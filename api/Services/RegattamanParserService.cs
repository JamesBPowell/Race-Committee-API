using System.Text.Json;
using System.Globalization;
using AngleSharp;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using RaceCommittee.Api.Models;

namespace RaceCommittee.Api.Services
{
    /// <summary>
    /// Parses ORR and ORR-EZ certificate data from regattaman.com HTML pages using AngleSharp.
    /// </summary>
    public class RegattamanParserService : ICertificateParserService
    {
        private readonly HttpClient _httpClient;

        public RegattamanParserService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Add User-Agent to avoid blocks/redirects from regattaman.com
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            }
        }

        public async Task<ParsedCertificateData> ParseFromUrlAsync(string url, string certType)
        {
            var html = await _httpClient.GetStringAsync(url);
            return await ParseFromHtmlAsync(html, certType);
        }

        public async Task<ParsedCertificateData> ParseFromHtmlAsync(string html, string certificateType)
        {
            var isOrrEz = certificateType.ToUpperInvariant() == "ORR-EZ";
            var parser = new HtmlParser();
            using var document = await parser.ParseDocumentAsync(html);

            var result = new ParsedCertificateData
            {
                CertificateType = certificateType.ToUpperInvariant(),
                SchemaVersion = isOrrEz ? CertificateSchemas.CurrentOrrEz : CertificateSchemas.CurrentOrr
            };

            // Extract structured data from data-tbname tables and dataElement spans
            var structuredData = ExtractStructuredData(document);

            result.CertificateNumber = ExtractCertificateNumber(document, isOrrEz);

            // Parse administrative data from input fields
            ExtractAdministrativeData(document, result);

            // Parse ratings (GPH spin/non-spin)
            ExtractRatings(document, result, isOrrEz);

            // Build the full JSON data payload
            var rawData = new Dictionary<string, object?>
            {
                ["certificateNumber"] = result.CertificateNumber,
                ["boatName"] = result.BoatName,
                ["sailNumber"] = result.SailNumber,
                ["boatClass"] = result.BoatClass,
                ["configuration"] = result.Configuration,
                ["issueDate"] = result.IssueDate?.ToString("yyyy-MM-dd"),
                ["expirationDate"] = result.ExpirationDate?.ToString("yyyy-MM-dd"),
                ["ratingSpinnaker"] = result.RatingSpinnaker,
                ["ratingNonSpinnaker"] = result.RatingNonSpinnaker,
                ["schemaVersion"] = result.SchemaVersion,
                ["structuredData"] = structuredData
            };

            // Extract polar table data
            var polarData = ExtractPolarTable(document, isOrrEz);

            // Try to extract benchmark ratings
            var benchmarks = ExtractBenchmarkRatings(document, isOrrEz);
            if (benchmarks.Count > 0)
                rawData["benchmarkRatings"] = benchmarks;

            // Extract PCS ratings (this will also populate dynamic polar tables)
            var pcsRatings = ExtractPcsRatings(document, polarData);

            if (polarData.Count > 0)
                rawData["polarTable"] = polarData;

            if (pcsRatings.Count > 0)
                rawData["pcsRatings"] = pcsRatings;

            result.RawDataJson = JsonSerializer.Serialize(rawData, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            return result;
        }

        private static string ExtractCertificateNumber(IDocument document, bool isOrrEz)
        {
            // Look for cert number in title or header text
            // ORR: "2026 Offshore Racing Rule Certificate Data" with cert # in a field
            // ORREZ: "2026 EZ Certificate - EZ10025"
            var headerText = document.QuerySelector("h2, h3, .cert-header, td[class*='cert']")?.TextContent ?? "";

            if (isOrrEz && headerText.Contains("EZ Certificate"))
            {
                var dashIndex = headerText.LastIndexOf('-');
                if (dashIndex >= 0)
                    return headerText[(dashIndex + 1)..].Trim();
            }

            // Try input fields with title/name containing "cert"
            var certInput = document.QuerySelectorAll("input")
                .FirstOrDefault(e =>
                    (e.GetAttribute("title")?.Contains("Cert", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (e.GetAttribute("name")?.Contains("cert_id", StringComparison.OrdinalIgnoreCase) ?? false));

            return certInput?.GetAttribute("value")?.Trim() ?? string.Empty;
        }

        private static void ExtractAdministrativeData(IDocument document, ParsedCertificateData result)
        {
            // Extract labeled values from input elements or text cells
            var inputs = document.QuerySelectorAll("input[title], input[name]");

            foreach (var input in inputs)
            {
                var title = (input.GetAttribute("title") ?? input.GetAttribute("name") ?? "").ToLowerInvariant();
                var value = input.GetAttribute("value")?.Trim() ?? "";

                if (string.IsNullOrEmpty(value)) continue;

                if (title.Contains("boat name") || title.Contains("yacht"))
                    result.BoatName = value;
                else if (title.Contains("sail") && title.Contains("num"))
                    result.SailNumber = value;
                else if (title.Contains("class") || title.Contains("boat type"))
                    result.BoatClass = value;
                else if (title.Contains("issue") && title.Contains("date"))
                    result.IssueDate = TryParseDate(value);
                else if (title.Contains("expir") || (title.Contains("valid") && title.Contains("until")))
                    result.ExpirationDate = TryParseDate(value);
                else if (title.Contains("config") || title.Contains("rig type"))
                    result.Configuration = value;
            }

            // Also try to extract from table cells with text labels
            var cells = document.QuerySelectorAll("td");
            for (int i = 0; i < cells.Length - 1; i++)
            {
                var label = cells[i].TextContent.Trim().ToLowerInvariant();
                var value = cells[i + 1].TextContent.Trim();

                if (string.IsNullOrEmpty(value) || value.Length > 200) continue;

                if (string.IsNullOrEmpty(result.BoatName) && (label.Contains("yacht") || label == "boat name:"))
                    result.BoatName = value;
                else if (string.IsNullOrEmpty(result.SailNumber) && label.Contains("sail") && label.Contains("num"))
                    result.SailNumber = value;
                else if (string.IsNullOrEmpty(result.BoatClass) && label == "class:")
                    result.BoatClass = value;
                else if (result.IssueDate == null && label.Contains("issue date"))
                    result.IssueDate = TryParseDate(value);
            }
        }

        private static void ExtractRatings(IDocument document, ParsedCertificateData result, bool isOrrEz)
        {
            // First try the modern ratings summary section (most reliable for GPH)
            ExtractRatingsSummary(document, result, isOrrEz);

            // For ORR, finding Spinnaker (GPH) is enough to stop
            if (result.RatingSpinnaker != null && (!isOrrEz || result.RatingNonSpinnaker != null))
                return;

            // For ORR-EZ, also check specifically labeled spin/non-spin sections
            if (isOrrEz)
            {
                ExtractOrrEzSectionRatings(document, result);
            }
        }

        private static void ExtractRatingsSummary(IDocument document, ParsedCertificateData result, bool isOrrEz)
        {
            // For ORR certificates, the GPH is often in a specific element with id="gph"
            // Note: There might be multiple elements with id="gph" (e.g. a div and a span)
            var gphElements = document.QuerySelectorAll("#gph, .gph-data .input, .gph-value");
            foreach (var el in gphElements)
            {
                var val = ExtractNumericRating(el.TextContent);
                if (val > 300)
                {
                    result.RatingSpinnaker = val;
                    result.RatingType = "SecondsPerMile";
                    result.NormalizedToD = val;
                    if (!isOrrEz) return;
                }
            }

            // Fallback: If still not found (or for ORR-EZ), try a regex on the entire raw HTML for the specific span#gph pattern
            // This bypasses any DOM parsing issues for huge files with duplicate IDs.
            var rawHtml = document.Source.Text;
            var gphMatch = System.Text.RegularExpressions.Regex.Match(rawHtml, @"id=""gph""[^>]*>(\d+(\.\d+)?)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (gphMatch.Success && float.TryParse(gphMatch.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var gphVal))
            {
                result.RatingSpinnaker = gphVal;
                result.RatingType = "SecondsPerMile";
                result.NormalizedToD = gphVal;
                if (!isOrrEz) return;
            }

            // Regattaman modern certificates also store rating data in data-ratingjson attributes
            var blocks = document.QuerySelectorAll(".ratBlock");
            foreach (var block in blocks)
            {
                var field = block.GetAttribute("data-field");
                var json = block.GetAttribute("data-ratingjson");
                if (string.IsNullOrEmpty(json)) continue;

                try
                {
                    using var jdoc = JsonDocument.Parse(json);
                    var elements = jdoc.RootElement.ValueKind == JsonValueKind.Array 
                        ? (System.Collections.Generic.IEnumerable<System.Text.Json.JsonElement>)jdoc.RootElement.EnumerateArray() 
                        : new[] { jdoc.RootElement };

                    foreach (var element in elements)
                    {
                        var course = element.TryGetProperty("course", out var cProp) ? cProp.GetString() : null;
                        var rtype = element.TryGetProperty("rtype", out var rProp) ? rProp.GetString() : null;

                        bool isPhrfBm = field == "PHRF_bm";
                        bool matches = isPhrfBm || 
                                     string.Equals(course, "GPH", StringComparison.OrdinalIgnoreCase) ||
                                     string.Equals(rtype, "TOD", StringComparison.OrdinalIgnoreCase);

                        if (matches && TryParseRatingElement(element, out var spin, out var nonspin))
                        {
                            // If we already found PHRF_bm, don't overwrite it with GPH
                            if (result.RatingType == "PHRF" && !isPhrfBm) continue;

                            result.RatingSpinnaker = spin;
                            result.RatingNonSpinnaker = nonspin;
                            result.RatingType = isPhrfBm ? "PHRF" : "SecondsPerMile";
                            
                            if (result.RatingType == "PHRF" && spin.HasValue)
                                result.NormalizedToD = spin.Value + 550;
                            else
                                result.NormalizedToD = spin;
                                
                            // If it's ORR-EZ, we really want PHRF_bm. If we found it, we can stop.
                            // If we only found GPH, keep looking in case PHRF_bm appears in another block.
                            if (!isOrrEz || isPhrfBm) return;
                        }
                    }
                }
                catch { /* skip invalid JSON */ }
            }
        }

        private static float? ExtractNumericRating(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;
            
            // Match any decimal number (e.g. 567.7, 604.0)
            var match = System.Text.RegularExpressions.Regex.Match(text, @"(\d+(\.\d+)?)");
            if (match.Success && float.TryParse(match.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var val))
            {
                return val;
            }
            return null;
        }

        private static bool TryParseRatingElement(JsonElement element, out float? spin, out float? nonspin)
        {
            spin = null;
            nonspin = null;

            if (element.ValueKind != JsonValueKind.Object) return false;

            if (element.TryGetProperty("spin", out var sProp))
            {
                var sVal = sProp.ValueKind == JsonValueKind.String ? sProp.GetString() : sProp.GetRawText();
                if (float.TryParse(sVal, NumberStyles.Float, CultureInfo.InvariantCulture, out var s)) spin = s;
            }

            if (element.TryGetProperty("nonspin", out var nsProp))
            {
                var nsVal = nsProp.ValueKind == JsonValueKind.String ? nsProp.GetString() : nsProp.GetRawText();
                if (float.TryParse(nsVal, NumberStyles.Float, CultureInfo.InvariantCulture, out var ns)) nonspin = ns;
            }

            return spin != null || nonspin != null;
        }

        private static bool TryParseRatingJson(string? json, out float? spin, out float? nonspin)
        {
            spin = null;
            nonspin = null;

            if (string.IsNullOrEmpty(json)) return false;

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var first = root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0 
                    ? root[0] 
                    : root;

                return TryParseRatingElement(first, out spin, out nonspin);
            }
            catch
            {
                return false;
            }
        }

        private static void ExtractOrrEzSectionRatings(IDocument document, ParsedCertificateData result)
        {
            // ORR-EZ has separate Spinnaker and Non-Spinnaker sections
            // Each section has a "GPH" row with TOT and TOD values
            var allText = document.Body?.TextContent ?? "";
            var tables = document.QuerySelectorAll("table");

            bool inSpinSection = false;
            bool inNonSpinSection = false;

            foreach (var table in tables)
            {
                var tableText = table.TextContent;
                if (tableText.Contains("Spinnaker") && !tableText.Contains("Non-Spinnaker"))
                    inSpinSection = true;
                if (tableText.Contains("Non-Spinnaker"))
                {
                    inSpinSection = false;
                    inNonSpinSection = true;
                }

                var rows = table.QuerySelectorAll("tr");
                foreach (var row in rows)
                {
                    var rowCells = row.QuerySelectorAll("td");
                    if (rowCells.Length < 2) continue;

                    var label = rowCells[0].TextContent.Trim();
                    bool isRatingLabel = label.Contains("GPH", StringComparison.OrdinalIgnoreCase) || 
                                       label.Contains("Benchmark", StringComparison.OrdinalIgnoreCase) || 
                                       label.Contains("PHRF", StringComparison.OrdinalIgnoreCase);

                    if (!isRatingLabel) continue;

                    // The next cell should be the TOT value (the multiplier, e.g. 0.882)
                    // or the TOD value (sec/mi, e.g. 604.4)
                    for (int j = 1; j < rowCells.Length; j++)
                    {
                        var valText = rowCells[j].TextContent.Trim();
                        if (float.TryParse(valText, NumberStyles.Float, CultureInfo.InvariantCulture, out var val) && val > 0)
                        {
                            // TOD values (sec/mi) are typically > 100
                            // TOT values (multiplier) are typically < 2
                            if (val > 100) // This is a TOD (sec/mi) — use as rating
                            {
                                if (inSpinSection)
                                    result.RatingSpinnaker = val;
                                else if (inNonSpinSection)
                                    result.RatingNonSpinnaker = val;
                                break;
                            }
                        }
                    }
                }
            }
        }

        private static Dictionary<string, object> ExtractPolarTable(IDocument document, bool isOrrEz)
        {
            var polarData = new Dictionary<string, object>();

            // Look for tables with "Polar Time Allowances" header or wind speed headers
            var tables = document.QuerySelectorAll("table");

            foreach (var table in tables)
            {
                var headerRow = table.QuerySelector("tr");
                if (headerRow == null) continue;

                var headerCells = headerRow.QuerySelectorAll("td, th");
                if (headerCells.Length < 3) continue;

                // Check if this looks like a polar table (first column is angles, headers are wind speeds)
                var firstHeader = headerCells[0].TextContent.Trim().ToLowerInvariant();
                if (!firstHeader.Contains("wind") && !firstHeader.Contains("angle") && firstHeader != "true wind speed")
                    continue;

                // Parse the table
                var windSpeeds = new List<string>();
                for (int i = 1; i < headerCells.Length; i++)
                {
                    var ws = headerCells[i].TextContent.Trim().Replace(" kts", "").Replace(" kt", "");
                    if (!string.IsNullOrEmpty(ws))
                        windSpeeds.Add(ws);
                }

                var rows = table.QuerySelectorAll("tr");
                var angles = new Dictionary<string, Dictionary<string, float>>();

                for (int r = 1; r < rows.Length; r++) // Skip header row
                {
                    var cells = rows[r].QuerySelectorAll("td");
                    if (cells.Length < 2) continue;

                    var angleLabel = cells[0].TextContent.Trim();
                    if (string.IsNullOrEmpty(angleLabel)) continue;

                    var values = new Dictionary<string, float>();
                    for (int c = 1; c < cells.Length && c - 1 < windSpeeds.Count; c++)
                    {
                        var cellText = cells[c].TextContent.Trim().Replace(",", "");
                        if (float.TryParse(cellText, NumberStyles.Float, CultureInfo.InvariantCulture, out var val))
                            values[windSpeeds[c - 1]] = val;
                    }

                    if (values.Count > 0)
                        angles[angleLabel] = values;
                }

                if (angles.Count > 0)
                {
                    // Determine if this is spinnaker or non-spinnaker section, and offshore vs short course
                    var key = GetTableSectionContext(table);
                    polarData[key] = angles;
                }
            }

            // Also check for ORR-EZ newer formats using CSS Grids instead of tables
            var gridDivs = document.QuerySelectorAll("div.ratingGrid-9");
            foreach (var grid in gridDivs)
            {
                // Verify it's a polar block
                if (!grid.ClassList.Contains("polar_block_cert")) continue;

                var spans = grid.QuerySelectorAll("span").ToList();
                if (spans.Count < 10) continue;

                var firstSpanText = spans[0].TextContent.Trim().ToLowerInvariant();
                if (!firstSpanText.Contains("wind") && !firstSpanText.Contains("angle") && firstSpanText != "true wind speed")
                    continue;

                // Extract wind speeds (first row: spans 1-9)
                var windSpeeds = new List<string>();
                for (int i = 1; i < 10 && i < spans.Count; i++)
                {
                    var ws = spans[i].TextContent.Trim().Replace(" kts", "").Replace(" kt", "");
                    if (!string.IsNullOrEmpty(ws))
                        windSpeeds.Add(ws);
                }

                var angles = new Dictionary<string, Dictionary<string, float>>();
                
                // Subsequent rows: chunks of 10 spans
                for (int r = 10; r < spans.Count; r += 10)
                {
                    if (r + 9 >= spans.Count) break; // Incomplete row

                    var angleLabel = spans[r].TextContent.Trim();
                    if (string.IsNullOrEmpty(angleLabel)) continue;

                    var values = new Dictionary<string, float>();
                    for (int c = 1; c <= 9 && c - 1 < windSpeeds.Count; c++)
                    {
                        var valueText = spans[r + c].TextContent.Trim().Replace(",", "");
                        if (float.TryParse(valueText, NumberStyles.Float, CultureInfo.InvariantCulture, out var val))
                            values[windSpeeds[c - 1]] = val;
                    }

                    if (values.Count > 0)
                        angles[angleLabel] = values;
                }

                if (angles.Count > 0)
                {
                    var parent = grid.ParentElement;
                    string context = "spinnaker"; // Default
                    while (parent != null)
                    {
                        if (parent.Id == "polar_time_ns" || parent.ClassList.Contains("nonspin"))
                        {
                            context = "nonSpinnaker";
                            break;
                        }
                        if (parent.Id == "polar_time_spin" || parent.ClassList.Contains("spin"))
                        {
                            context = "spinnaker";
                            break;
                        }
                        parent = parent.ParentElement;
                    }
                    polarData[context] = angles;
                }
            }

            return polarData;
        }


        private static Dictionary<string, object> ExtractBenchmarkRatings(IDocument document, bool isOrrEz)
        {
            var benchmarks = new Dictionary<string, object>();

            var cells = document.QuerySelectorAll("td");
            for (int i = 0; i < cells.Length - 1; i++)
            {
                var label = cells[i].TextContent.Trim();

                if (label.StartsWith("TOT") || label.StartsWith("TOD"))
                {
                    var valText = cells[i + 1].TextContent.Trim();
                    if (float.TryParse(valText, out var val))
                    {
                        benchmarks[label.Replace(" ", "_").Replace("(", "").Replace(")", "")] = val;
                    }
                }
            }

            return benchmarks;
        }

        private static Dictionary<string, object> ExtractPcsRatings(IDocument document, Dictionary<string, object> polarData)
        {
            var pcsData = new Dictionary<string, object>();

            // 1. Try parsing from JSON blocks first (modern Regattaman certs)
            var blocks = document.QuerySelectorAll(".ratBlock");
            foreach (var block in blocks)
            {
                var json = block.GetAttribute("data-ratingjson");
                if (string.IsNullOrEmpty(json)) continue;

                try
                {
                    using var jdoc = JsonDocument.Parse(json);
                    var elements = jdoc.RootElement.ValueKind == JsonValueKind.Array 
                        ? (System.Collections.Generic.IEnumerable<System.Text.Json.JsonElement>)jdoc.RootElement.EnumerateArray() 
                        : new[] { jdoc.RootElement };

                    foreach (var element in elements)
                    {
                        var course = element.TryGetProperty("course", out var cProp) ? cProp.GetString() : null;
                        var wind = element.TryGetProperty("wind", out var wProp) ? wProp.GetString() : "";

                        // Skip GPH since it's handled in ExtractRatingsSummary, and ensure we have a course
                        if (string.IsNullOrEmpty(course) || course.Equals("GPH", StringComparison.OrdinalIgnoreCase)) continue;

                        var safeCourseType = course.Replace(" ", "").Replace("/", "").Replace("-", "").Replace(".", "");
                        if (string.IsNullOrEmpty(safeCourseType)) continue;
                        safeCourseType = char.ToLowerInvariant(safeCourseType[0]) + safeCourseType.Substring(1);

                        var bandName = string.IsNullOrEmpty(wind) ? "rating" : wind.ToLowerInvariant().Replace(" ", "");
                        var isPolarData = int.TryParse(bandName, out _); // if it's a numeric wind speed, it's true Polar Time Allowances

                        if (TryParseRatingElement(element, out var spin, out var nonspin))
                        {
                            var targetData = isPolarData ? polarData : pcsData;

                            if (spin.HasValue)
                            {
                                if (!targetData.ContainsKey("spin")) targetData["spin"] = new Dictionary<string, Dictionary<string, float>>();
                                var spinDict = (Dictionary<string, Dictionary<string, float>>)targetData["spin"];
                                if (!spinDict.ContainsKey(safeCourseType)) spinDict[safeCourseType] = new Dictionary<string, float>();
                                spinDict[safeCourseType][bandName] = spin.Value;
                            }
                            if (nonspin.HasValue)
                            {
                                if (!targetData.ContainsKey("nonSpin")) targetData["nonSpin"] = new Dictionary<string, Dictionary<string, float>>();
                                var nonSpinDict = (Dictionary<string, Dictionary<string, float>>)targetData["nonSpin"];
                                if (!nonSpinDict.ContainsKey(safeCourseType)) nonSpinDict[safeCourseType] = new Dictionary<string, float>();
                                nonSpinDict[safeCourseType][bandName] = nonspin.Value;
                            }
                        }
                    }
                }
                catch { /* skip invalid JSON */ }
            }

            if (pcsData.Count > 0) return pcsData;

            // 2. Fallback to HTML table parsing (legacy certs)
            var tables = document.QuerySelectorAll("table");
            foreach (var table in tables)
            {
                var headerRow = table.QuerySelector("tr");
                if (headerRow == null) continue;

                var text = table.TextContent;
                if (text.Contains("Windward", StringComparison.OrdinalIgnoreCase) || 
                    text.Contains("Random Leg", StringComparison.OrdinalIgnoreCase) || 
                    text.Contains("Course Type", StringComparison.OrdinalIgnoreCase) ||
                    text.Contains("Mostly WW", StringComparison.OrdinalIgnoreCase))
                {
                    var headerCells = headerRow.QuerySelectorAll("td, th").Select(c => c.TextContent.Trim()).ToList();
                    if (headerCells.Count < 2) continue;
                    
                    var rows = table.QuerySelectorAll("tr").Skip(1);
                    foreach (var row in rows)
                    {
                        var cells = row.QuerySelectorAll("td");
                        if (cells.Length < 2) continue;

                        var courseType = cells[0].TextContent.Trim();
                        if (string.IsNullOrEmpty(courseType) || courseType.Length > 40 || courseType == "GPH") continue;
                        
                        var safeCourseType = courseType.Replace(" ", "").Replace("/", "").Replace("-", "").Replace(".", "");
                        if (string.IsNullOrEmpty(safeCourseType)) continue;
                        safeCourseType = char.ToLowerInvariant(safeCourseType[0]) + safeCourseType.Substring(1);

                        var courseValues = new Dictionary<string, float>();
                        for (int c = 1; c < cells.Length && c < headerCells.Count; c++)
                        {
                            var headerName = headerCells[c].ToLowerInvariant().Replace(" ", "");
                            if (string.IsNullOrEmpty(headerName)) headerName = "band" + c;
                            
                            if (float.TryParse(cells[c].TextContent.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var val))
                            {
                                courseValues[headerName] = val;
                            }
                        }

                        if (courseValues.Count > 0)
                        {
                            var context = GetTableSectionContext(table);
                            var isNonSpin = context.Contains("non", StringComparison.OrdinalIgnoreCase);
                            var topKey = isNonSpin ? "nonSpin" : "spin";

                            if (!pcsData.ContainsKey(topKey)) pcsData[topKey] = new Dictionary<string, Dictionary<string, float>>();
                            var dict = (Dictionary<string, Dictionary<string, float>>)pcsData[topKey];
                            dict[safeCourseType] = courseValues;
                        }
                    }
                }
            }
            return pcsData;
        }

        private static string GetTableSectionContext(IElement table)
        {
            // Look up the tree for a parent div with data-tbname or a preceding header
            var parent = table.Closest("div[data-tbname]");
            if (parent != null) return parent.GetAttribute("data-tbname") ?? "";

            var prev = table.PreviousElementSibling;
            while (prev != null)
            {
                if (prev.LocalName == "h2" || prev.LocalName == "h3" || prev.LocalName == "h4")
                    return prev.TextContent.Trim();
                prev = prev.PreviousElementSibling;
            }

            return "";
        }

        private static Dictionary<string, object> ExtractStructuredData(IDocument document)
        {
            var data = new Dictionary<string, object>();

            // 1. Extract data from span.dataElement (modern certs)
            foreach (var element in document.QuerySelectorAll("span.dataElement"))
            {
                var id = element.Id;
                if (string.IsNullOrEmpty(id)) continue;

                var text = element.TextContent?.Trim();
                if (string.IsNullOrEmpty(text)) continue;

                // Strip suffix "-input" if present
                var key = id.EndsWith("-input") ? id.Substring(0, id.Length - 6) : id;
                
                if (float.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out float val))
                    data[key] = val;
                else
                    data[key] = text;
            }

            // 2. Extract data from input elements
            foreach (var input in document.QuerySelectorAll("input[id], input[name]"))
            {
                var key = input.Id ?? input.GetAttribute("name");
                if (string.IsNullOrEmpty(key)) continue;

                var val = input.GetAttribute("value");
                if (string.IsNullOrEmpty(val)) continue;

                if (float.TryParse(val, NumberStyles.Float, CultureInfo.InvariantCulture, out float fVal))
                    data[key] = fVal;
                else
                    data[key] = val;
            }

            return data;
        }

        private static DateTime? TryParseDate(string value)
        {
            if (DateTime.TryParse(value, out var date))
                return date;
            return null;
        }
    }
}
