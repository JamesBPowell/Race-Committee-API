using Microsoft.Playwright;

namespace RaceCommittee.Api.Services
{
    public interface IPlaywrightMhtmlService
    {
        Task<byte[]> CapturePrintHtmlAsync(string url);
    }

    public class PlaywrightMhtmlService : IPlaywrightMhtmlService, IAsyncDisposable
    {
        private readonly SemaphoreSlim _requestSemaphore;
        private readonly SemaphoreSlim _browserSemaphore;
        
        private IPlaywright? _playwright;
        private IBrowser? _browser;
        private DateTime _browserStartedAt;
        private readonly TimeSpan _browserMaxLifetime = TimeSpan.FromMinutes(30);

        public PlaywrightMhtmlService(int maxConcurrent = 3)
        {
            _requestSemaphore = new SemaphoreSlim(maxConcurrent, maxConcurrent);
            _browserSemaphore = new SemaphoreSlim(1, 1);
        }

        private async Task EnsureBrowserAsync()
        {
            await _browserSemaphore.WaitAsync();
            try
            {
                if (_browser != null && (DateTime.UtcNow - _browserStartedAt) > _browserMaxLifetime)
                {
                    await _browser.CloseAsync();
                    _browser = null;
                }

                if (_browser == null)
                {
                    _playwright ??= await Playwright.CreateAsync();
                    _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
                    _browserStartedAt = DateTime.UtcNow;
                }
            }
            finally
            {
                _browserSemaphore.Release();
            }
        }

        public async Task<byte[]> CapturePrintHtmlAsync(string url)
        {
            // Backpressure: fail quickly if too many requests
            if (!await _requestSemaphore.WaitAsync(TimeSpan.FromSeconds(10)))
            {
                throw new TimeoutException("Service is busy, please retry in a short while.");
            }

            try
            {
                await EnsureBrowserAsync();

                if (_browser == null) throw new InvalidOperationException("Browser not initialized.");

                // Create context with print media emulated from the start.
                // This ensures @media print CSS rules are active during page load,
                // and matchMedia('print') listeners fire as the page initializes.
                await using var context = await _browser.NewContextAsync(new BrowserNewContextOptions
                {
                    ColorScheme = ColorScheme.Light
                });
                var page = await context.NewPageAsync();

                // Emulate print media BEFORE navigation so the page renders in print mode
                await page.EmulateMediaAsync(new PageEmulateMediaOptions { Media = Media.Print });

                // Navigate — NetworkIdle ensures all resources (CSS, images, XHR) are loaded
                await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

                // Brief pause for any print-specific JS to settle (matchMedia callbacks, etc.)
                await Task.Delay(500);

                // Step 1: Fetch and inline all external stylesheets
                await page.EvaluateAsync(@"async () => {
                    const links = Array.from(document.querySelectorAll('link[rel=""stylesheet""]'));
                    for (const link of links) {
                        try {
                            const resp = await fetch(link.href);
                            const css = await resp.text();
                            const style = document.createElement('style');
                            style.textContent = css;
                            link.parentNode.replaceChild(style, link);
                        } catch(e) { /* skip unreachable stylesheets */ }
                    }
                }");

                // Step 2: Transform CSS via CSSOM — unwrap @media print, strip @media screen
                // This ensures the captured HTML always renders as the print view
                await page.EvaluateAsync(@"() => {
                    const styleElements = Array.from(document.querySelectorAll('style'));
                    for (const styleEl of styleElements) {
                        try {
                            const sheet = styleEl.sheet;
                            if (!sheet || !sheet.cssRules) continue;

                            const newCss = [];
                            for (let i = 0; i < sheet.cssRules.length; i++) {
                                const rule = sheet.cssRules[i];
                                if (rule.type === CSSRule.MEDIA_RULE) {
                                    const media = (rule.conditionText || rule.media.mediaText || '').toLowerCase();
                                    if (media.includes('print') && !media.includes('not print')) {
                                        // Unwrap @media print rules — make them unconditional
                                        for (let j = 0; j < rule.cssRules.length; j++) {
                                            newCss.push(rule.cssRules[j].cssText);
                                        }
                                    } else if (media.includes('screen') || media.includes('not print')) {
                                        // Strip @media screen rules entirely
                                        continue;
                                    } else {
                                        // Keep other media queries as-is (e.g. max-width)
                                        newCss.push(rule.cssText);
                                    }
                                } else {
                                    newCss.push(rule.cssText);
                                }
                            }
                            styleEl.textContent = newCss.join('\n');
                        } catch(e) { /* skip inaccessible stylesheets */ }
                    }
                }");

                // Step 3: Convert images and canvases to embedded data URIs
                await page.EvaluateAsync(@"() => {
                    // Convert <img> elements to data URIs
                    const imgs = Array.from(document.querySelectorAll('img'));
                    for (const img of imgs) {
                        try {
                            if (!img.naturalWidth) continue;
                            const c = document.createElement('canvas');
                            c.width = img.naturalWidth;
                            c.height = img.naturalHeight;
                            c.getContext('2d').drawImage(img, 0, 0);
                            img.src = c.toDataURL('image/png');
                        } catch(e) { /* skip CORS-restricted images */ }
                    }

                    // Convert <canvas> elements (e.g. line drawings) to <img> tags
                    // Canvas pixel data is lost in serialized HTML, so we snapshot it
                    const canvases = Array.from(document.querySelectorAll('canvas'));
                    for (const canvas of canvases) {
                        try {
                            if (!canvas.width || !canvas.height) continue;
                            const dataUrl = canvas.toDataURL('image/png');
                            const img = document.createElement('img');
                            img.src = dataUrl;
                            img.width = canvas.width;
                            img.height = canvas.height;
                            img.style.cssText = canvas.style.cssText;
                            img.className = canvas.className;
                            canvas.parentNode.replaceChild(img, canvas);
                        } catch(e) { /* skip tainted canvases */ }
                    }
                }");

                // Capture the fully-rendered, self-contained HTML
                var html = await page.ContentAsync();

                return System.Text.Encoding.UTF8.GetBytes(html);
            }
            finally
            {
                _requestSemaphore.Release();
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_browser != null) await _browser.CloseAsync();
            _playwright?.Dispose();
        }
    }
}
