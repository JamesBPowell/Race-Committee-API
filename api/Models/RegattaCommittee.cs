using System;
using System.Text.Json.Serialization;

namespace RaceCommittee.Api.Models
{
    public class RegattaCommittee
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }

        [JsonIgnore]
        public Regatta Regatta { get; set; } = default!;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = default!;

        public string Role { get; set; } = "General"; // e.g. PrincipalRaceOfficer, Scorer, MarkSet, General
    }
}
