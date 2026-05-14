using Microsoft.Playwright;
using System.Text.Json;

namespace RaceCommittee.Api.Services
{
    public interface IPlaywrightMhtmlService
    {
        Task<byte[]> ExtractPrintMhtmlAsync(string url);
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

        public async Task<byte[]> ExtractPrintMhtmlAsync(string url)
        {
            // Backpressure: fail quickly if too many requests
            if (!_requestSemaphore.Wait(TimeSpan.FromSeconds(10)))
            {
                throw new TimeoutException("Service is busy, please retry in a short while.");
            }

            try
            {
                await EnsureBrowserAsync();

                if (_browser == null) throw new InvalidOperationException("Browser not initialized.");

                await using var context = await _browser.NewContextAsync();
                var page = await context.NewPageAsync();

                // 1. Load initial state
                await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

                // 2. Trigger print emulation
                await page.EmulateMediaAsync(new PageEmulateMediaOptions { Media = Media.Print });

                // 3. Wait for the SPA to be print-ready (fallback to network idle if we don't know the specific class)
                // We'll wait a bit to allow any JS triggered by matchMedia('print') to execute.
                await Task.Delay(2000); 

                // 4. Capture MHTML
                var client = await context.NewCDPSessionAsync(page);
                var result = await client.SendAsync("Page.captureSnapshot", new Dictionary<string, object> { { "format", "mhtml" } });
                
                var mhtml = result.Value.GetProperty("data").GetString();
                return System.Text.Encoding.UTF8.GetBytes(mhtml ?? string.Empty);
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
