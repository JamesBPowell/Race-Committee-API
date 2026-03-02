using System;
using System.Collections.Generic;

namespace RaceCommittee.Api.Models
{
    public class Fleet
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        public Regatta Regatta { get; set; } = default!;

        public string Name { get; set; } = string.Empty;
        public int SequenceOrder { get; set; }

        public ScoringMethod ScoringMethod { get; set; }
        public string ScoringConfiguration { get; set; } = "{}"; // JSON for method-specific settings (e.g. TOT coefficients)

        public ICollection<Entry> Entries { get; set; } = new List<Entry>();
        public ICollection<Race> Races { get; set; } = new List<Race>();
        public ICollection<RaceFleet> ParticipatingInRaces { get; set; } = new List<RaceFleet>();
    }
}
