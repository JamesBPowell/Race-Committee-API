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

            string key = courseType switch
            {
                CourseType.WindwardLeeward => "wl",
                CourseType.RandomLeg => "randomLeg",
                CourseType.MostlyLW => "mostlyLW",
                CourseType.MostlyReach => "mostlyReach",
                CourseType.CircularRandom => "circularRandom",
                CourseType.MostlyWW => "mostlyWW",
                CourseType.WL5050 => "wl5050",
                CourseType.WL6040 => "wl6040",
                CourseType.ClosedCourse => "closedCourse",
                CourseType.BayviewMac => "bayviewMac",
                CourseType.ChicagoMac => "chicagoMacAP",
                CourseType.PacificCup => "pacificCup",
                CourseType.Transpac => "transpacApprox",
                _ => "wl"
            };

            if (dict.TryGetValue(key, out var curve))
            {
                return curve.GetAllowance(windSpeed);
            }

            foreach (var kvp in dict)
            {
                if (string.Equals(kvp.Key, key, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value.GetAllowance(windSpeed);
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

            string wsStr = ((int)Math.Round(windSpeed)).ToString() + "kt";
            if (NumericalAllowances != null && NumericalAllowances.TryGetValue(wsStr, out var numObj))
            {
                if (numObj is JsonElement jel && jel.TryGetSingle(out var v))
                    return v;
            }

            return null;
        }
    }

}
