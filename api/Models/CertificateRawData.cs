using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using System.Linq;

namespace RaceCommittee.Api.Models
{
    [JsonPolymorphic(TypeDiscriminatorPropertyName = "schemaVersion")]
    [JsonDerivedType(typeof(OrrEzCertificateData), "1.0")]
    [JsonDerivedType(typeof(OrrEzCertificateData), "1.1")]
    [JsonDerivedType(typeof(OrrEzCertificateData), "2.0")]
    [JsonDerivedType(typeof(OrrEzCertificateData), "ORREZ-2026-v1")]
    [JsonDerivedType(typeof(OrrEzCertificateData), "ORR-2026-v1")]
    public class BaseCertificateData
    {
        [JsonPropertyName("schemaVersion")]
        public string SchemaVersion { get; set; } = "1.0";

        public virtual TimeSpan CalculateCorrectedTime(ScoringMethod method, string configJson, TimeSpan elapsed, float distance, float? windSpeed, CourseType? courseType, bool isNonSpin)
        {
            return elapsed;
        }
    }

    public class OrrEzCertificateData : BaseCertificateData
    {
        [JsonPropertyName("ratings")]
        public Dictionary<string, float>? Ratings { get; set; }

        [JsonPropertyName("benchmarkRatings")]
        public Dictionary<string, float>? BenchmarkRatings { get; set; }

        [JsonPropertyName("pcsRatings")]
        public PcsRatingsSnapshot? PcsRatings { get; set; }

        [JsonPropertyName("polarTable")]
        public Dictionary<string, object>? PolarTable { get; set; }

        [JsonExtensionData]
        public Dictionary<string, object>? AdditionalData { get; set; }

        public override TimeSpan CalculateCorrectedTime(ScoringMethod method, string configJson, TimeSpan elapsed, float distance, float? windSpeed, CourseType? courseType, bool isNonSpin)
        {
            if (method == ScoringMethod.ORR_EZ_GPH)
            {
                float rating = 0;
                string bmKey = isNonSpin ? "nonSpin" : "spin";
                if (BenchmarkRatings != null && BenchmarkRatings.TryGetValue(bmKey, out var bmVal))
                    rating = bmVal;
                else if (Ratings != null && Ratings.TryGetValue("GPH", out var gphVal))
                    rating = gphVal;

                return TimeSpan.FromSeconds(Math.Max(0, elapsed.TotalSeconds - (rating * distance)));
            }

            if (method == ScoringMethod.ORR_EZ_PC && PcsRatings != null)
            {
                var allowance = PcsRatings.GetTargetAllowance(courseType ?? CourseType.WindwardLeeward, isNonSpin, windSpeed ?? 12f);
                if (allowance.HasValue)
                {
                    return TimeSpan.FromSeconds(Math.Max(0, elapsed.TotalSeconds - (allowance.Value * distance)));
                }
            }

            return elapsed;
        }
    }

    public class PcsRatingsSnapshot
    {
        public Dictionary<string, WindBandCurve>? Spin { get; set; }
        public Dictionary<string, WindBandCurve>? NonSpin { get; set; }

        [JsonExtensionData]
        public Dictionary<string, object>? AdditionalData { get; set; }

        public float? GetTargetAllowance(CourseType courseType, bool isNonSpin, float windSpeed)
        {
            var dict = isNonSpin ? NonSpin : Spin;
            if (dict == null) return null;

            var candidates = new List<string>();
            switch (courseType)
            {
                case CourseType.WindwardLeeward:
                    candidates.AddRange(new[] { "wl", "windwardLeeward", "windward/leeward", "windwardleeward" });
                    break;
                case CourseType.RandomLeg:
                    candidates.AddRange(new[] { "randomLeg", "rl", "randomleg" });
                    break;
                case CourseType.MostlyLW:
                    candidates.AddRange(new[] { "mostlyLW", "mostlyLw", "mostlylw", "mostlyDownwind", "mostlyL/W" });
                    break;
                case CourseType.MostlyReach:
                    candidates.AddRange(new[] { "mostlyReach", "mostlyreach", "reaching" });
                    break;
                case CourseType.CircularRandom:
                    candidates.AddRange(new[] { "circularRandom", "circularrandom", "cr" });
                    break;
                case CourseType.MostlyWW:
                    candidates.AddRange(new[] { "mostlyWW", "mostlyWw", "mostlyww", "mostlyUpwind" });
                    break;
                case CourseType.WL5050:
                    candidates.AddRange(new[] { "wl5050", "wl50/50", "wl50_50" });
                    break;
                case CourseType.WL6040:
                    candidates.AddRange(new[] { "wl6040", "wl60/40", "wl60_40" });
                    break;
                case CourseType.ClosedCourse:
                    candidates.AddRange(new[] { "closedCourse", "closedcourse" });
                    break;
                case CourseType.BayviewMac:
                    candidates.AddRange(new[] { "bayviewMac", "bayviewmac" });
                    break;
                case CourseType.ChicagoMac:
                    candidates.AddRange(new[] { "chicagoMacAP", "chicagoMacAp", "chicagoMac", "chicagomac" });
                    break;
                case CourseType.PacificCup:
                    candidates.AddRange(new[] { "pacificCup", "pacificcup", "pacCup" });
                    break;
                case CourseType.Transpac:
                    candidates.AddRange(new[] { "transpacApprox", "transpac", "transpacapprox" });
                    break;
                default:
                    candidates.Add(courseType.ToString());
                    break;
            }

            foreach (var key in candidates)
            {
                if (dict.TryGetValue(key, out var curve))
                {
                    return curve.GetAllowance(windSpeed);
                }

                // Also try case-insensitive check
                foreach (var kvp in dict)
                {
                    if (string.Equals(kvp.Key, key, StringComparison.OrdinalIgnoreCase))
                    {
                        return kvp.Value.GetAllowance(windSpeed);
                    }
                }
            }

            return null;
        }
    }

    public class WindBandCurve
    {
        public float? Light { get; set; }
        public float? Medium { get; set; }
        public float? Heavy { get; set; }

        [JsonExtensionData]
        public Dictionary<string, object>? NumericalAllowances { get; set; }

        public float? GetAllowance(float windSpeed)
        {
            string targetBandKey = windSpeed <= 9 ? WindBand.Light : (windSpeed >= 16 ? WindBand.Heavy : WindBand.Medium);

            float? allowance = targetBandKey switch
            {
                WindBand.Light => Light,
                WindBand.Heavy => Heavy,
                _ => Medium
            };

            if (allowance.HasValue) return allowance.Value;

            if (NumericalAllowances != null)
            {
                int roundedWind = (int)Math.Round(windSpeed);
                var keysToCheck = new[] { roundedWind.ToString() + "kt", roundedWind.ToString(), roundedWind.ToString() + " kts", roundedWind.ToString() + " kt" };

                foreach (var wsStr in keysToCheck)
                {
                    if (NumericalAllowances.TryGetValue(wsStr, out var numObj))
                    {
                        if (numObj is JsonElement jel)
                        {
                            if (jel.ValueKind == JsonValueKind.Number && jel.TryGetSingle(out var v))
                                return v;
                            if (jel.ValueKind == JsonValueKind.String && float.TryParse(jel.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var f))
                                return f;
                        }
                        else if (numObj is float fVal)
                        {
                            return fVal;
                        }
                        else if (numObj is double dVal)
                        {
                            return (float)dVal;
                        }
                        else if (numObj is int iVal)
                        {
                            return (float)iVal;
                        }
                    }
                }
            }

            return null;
        }
    }

}
