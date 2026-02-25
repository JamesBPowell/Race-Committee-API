using System;
using System.Collections.Generic;

namespace RaceCommittee.Api.Models
{
    public class Fleet
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        public Regatta Regatta { get; set; }

        public string Name { get; set; }
        public int SequenceOrder { get; set; }

        public ICollection<Entry> Entries { get; set; }
        public ICollection<Race> Races { get; set; }
    }
}
