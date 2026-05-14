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

                // Inline all external CSS into <style> blocks so the HTML is self-contained
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

                    // Convert images to data URIs so they're embedded
                    const imgs = Array.from(document.querySelectorAll('img'));
                    for (const img of imgs) {
                        try {
                            if (!img.naturalWidth) continue;
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            img.src = canvas.toDataURL('image/png');
                        } catch(e) { /* skip CORS-restricted images */ }
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
