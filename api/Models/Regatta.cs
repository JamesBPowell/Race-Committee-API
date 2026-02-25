using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models
{
    public class Regatta
    {
        public int Id { get; set; }

        [Required]
        public string Slug { get; set; }

        [Required]
        public string Name { get; set; }

        public string Organization { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string Location { get; set; }
        public string Status { get; set; }

        public ICollection<RegattaCommittee> CommitteeMembers { get; set; }
        public ICollection<Fleet> Fleets { get; set; }
        public ICollection<Entry> Entries { get; set; }
        public ICollection<Race> Races { get; set; }
    }
}
