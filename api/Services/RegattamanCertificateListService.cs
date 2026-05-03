using System.Collections.Concurrent;
using AngleSharp;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    /// <summary>
    /// Fetches and caches the regattaman.com valid certificate lists for dropdown search.
    /// Supports ORR and ORR-EZ certificate types.
    /// </summary>
    public class RegattamanCertificateListService : ICertificateListService
    {
        private readonly HttpClient _httpClient;
        private readonly ConcurrentDictionary<string, CachedList> _cache = new();
        private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

        public RegattamanCertificateListService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Add User-Agent to avoid blocks/redirects from regattaman.com
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            }
        }

        public async Task<IEnumerable<CertificateSearchResultDto>> SearchAsync(string certType, string query)
        {
            var normalizedType = certType.ToUpperInvariant() switch
            {
                "ORR" => "ORR",
                "ORREZ" or "ORR-EZ" => "ORR-Ez",
                _ => throw new ArgumentException($"Unsupported certificate type: {certType}")
            };

            var items = await GetOrFetchListAsync(normalizedType);

            // Filter by query (boat name or sail number, case-insensitive)
            var queryLower = query.ToLowerInvariant();
            return items.Where(item =>
                item.BoatName.Contains(queryLower, StringComparison.OrdinalIgnoreCase) ||
                item.SailNumber.Contains(queryLower, StringComparison.OrdinalIgnoreCase) ||
                item.CertificateNumber.Contains(queryLower, StringComparison.OrdinalIgnoreCase))
                .Take(50); // Limit results
        }

        private async Task<List<CertificateSearchResultDto>> GetOrFetchListAsync(string ruleType)
        {
            if (_cache.TryGetValue(ruleType, out var cached) && DateTime.UtcNow - cached.FetchedAt < CacheTtl)
                return cached.Items;

            var items = await FetchCertificateListAsync(ruleType);
            _cache[ruleType] = new CachedList { Items = items, FetchedAt = DateTime.UtcNow };
            return items;
        }

        private async Task<List<CertificateSearchResultDto>> FetchCertificateListAsync(string ruleType)
        {
            var url = $"https://www.regattaman.com/cert_list.php?crule={ruleType}";
            var html = await _httpClient.GetStringAsync(url);

            var config = Configuration.Default;
            var context = BrowsingContext.New(config);
            var document = await context.OpenAsync(req => req.Content(html));

            var results = new List<CertificateSearchResultDto>();

            // Find all cert links — they point to cert_form.php?sku=...
            var links = document.QuerySelectorAll("a[href*='cert_form.php?sku=']");

            foreach (var link in links)
            {
                var href = link.GetAttribute("href") ?? "";
                var certNumber = link.TextContent.Trim();

                if (string.IsNullOrEmpty(certNumber) || certNumber == "History")
                    continue;

                // Extract SKU from href
                var skuMatch = href.Contains("sku=") ? href[(href.IndexOf("sku=") + 4)..] : "";
                if (skuMatch.Contains('&'))
                    skuMatch = skuMatch[..skuMatch.IndexOf('&')];

                // Try to get boat name, sail number from the same table row
                var row = link.Closest("tr");
                var boatName = "";
                var sailNumber = "";
                var boatType = "";

                if (row != null)
                {
                    var cells = row.QuerySelectorAll("td");
                    // The cert list table columns vary, but typically:
                    // Cert ID, Effective, Expiration, Yacht, Boat Type, Config, ...
                    if (cells.Length >= 5)
                    {
                        // Find cells by position — yacht name is typically column 4 (index 3)
                        boatName = cells.Length > 3 ? cells[3].TextContent.Trim() : "";
                        boatType = cells.Length > 4 ? cells[4].TextContent.Trim() : "";
                        // Sail number is often near the end
                        sailNumber = cells.Length > 13 ? cells[13].TextContent.Trim() : "";
                    }
                }

                var fullUrl = href.StartsWith("http")
                    ? href
                    : $"https://www.regattaman.com/{href.TrimStart('/')}";

                results.Add(new CertificateSearchResultDto
                {
                    Sku = skuMatch,
                    CertificateNumber = certNumber,
                    BoatName = boatName,
                    SailNumber = sailNumber,
                    BoatType = boatType,
                    DisplayText = $"{certNumber} - {boatName} - {sailNumber}".Trim(' ', '-'),
                    Url = fullUrl
                });
            }

            return results;
        }

        private class CachedList
        {
            public List<CertificateSearchResultDto> Items { get; set; } = new();
            public DateTime FetchedAt { get; set; }
        }
    }
}
