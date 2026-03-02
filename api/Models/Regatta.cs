using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models
{
    public class Regatta
    {
        public int Id { get; set; }

        [Required]
        public string Slug { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Organization { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = "Upcoming";

        public ICollection<RegattaCommittee> CommitteeMembers { get; set; } = new List<RegattaCommittee>();
        public ICollection<Fleet> Fleets { get; set; } = new List<Fleet>();
        public ICollection<Entry> Entries { get; set; } = new List<Entry>();
        public ICollection<Race> Races { get; set; } = new List<Race>();
    }
}
