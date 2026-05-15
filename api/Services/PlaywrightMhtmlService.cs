using Microsoft.Playwright;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface ICertificateCaptureService
    {
        Task<CertificateCaptureResult> CaptureCertificateAsync(string url, string certificateType);
    }

    public class CertificateCaptureService : ICertificateCaptureService, IAsyncDisposable
    {
        private readonly ICertificateParserService _parser;
        private readonly SemaphoreSlim _requestSemaphore;
        private readonly SemaphoreSlim _browserSemaphore;
        private IPlaywright? _playwright;
        private IBrowser? _browser;
        private DateTime _browserStartedAt;
        private readonly TimeSpan _browserMaxLifetime = TimeSpan.FromMinutes(30);

        public CertificateCaptureService(ICertificateParserService parser, int maxConcurrent = 3)
        {
            _parser = parser;
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

        public async Task<CertificateCaptureResult> CaptureCertificateAsync(string url, string certificateType)
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
                await using var context = await _browser.NewContextAsync(new BrowserNewContextOptions
                {
                    ColorScheme = ColorScheme.Light,
                    ViewportSize = new ViewportSize { Width = 1280, Height = 1024 }
                });
                var page = await context.NewPageAsync();

                // Emulate print media BEFORE navigation so the page renders in print mode
                // This unrolls all tabs (Ratings, Offshore Polars, Short Course Polars) into a single page
                await page.EmulateMediaAsync(new PageEmulateMediaOptions { Media = Media.Print });

                // Navigate — NetworkIdle ensures all resources (CSS, images, XHR) are loaded
                await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

                // Wait for certificates elements to be visible
                await page.WaitForSelectorAsync("div[data-tbname]", new PageWaitForSelectorOptions { State = WaitForSelectorState.Visible, Timeout = 5000 });

                // Brief pause for any print-specific JS to settle (matchMedia callbacks, etc.)
                await Task.Delay(1000);

                // Extract HTML for parsing
                // Since we are in Print mode, this HTML contains ALL sections (Ratings, Polars, etc.)
                var unrolledHtml = await page.ContentAsync();
                var parsedData = await _parser.ParseFromHtmlAsync(unrolledHtml, certificateType);

                // Generate archival PDF
                // We use standard PDF generation which is highly compressed compared to Base64 HTML
                var pdfBytes = await page.PdfAsync(new PagePdfOptions
                {
                    Format = "Letter",
                    PrintBackground = true,
                    Margin = new Margin { Top = "0.4in", Bottom = "0.4in", Left = "0.4in", Right = "0.4in" }
                });

                return new CertificateCaptureResult
                {
                    ParsedData = parsedData,
                    PdfBytes = pdfBytes
                };
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
