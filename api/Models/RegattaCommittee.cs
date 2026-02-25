using System;

namespace RaceCommittee.Api.Models
{
    public class RegattaCommittee
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        public Regatta Regatta { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public string Role { get; set; } // e.g. PrincipalRaceOfficer, Scorer, MarkSet, General
    }
}
