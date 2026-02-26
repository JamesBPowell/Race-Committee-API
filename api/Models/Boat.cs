using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models
{
    public class Boat
    {
        public int Id { get; set; }

        [Required]
        public string OwnerId { get; set; } = string.Empty;
        public ApplicationUser Owner { get; set; } = null!;

        [Required]
        public string BoatName { get; set; } = string.Empty;

        [Required]
        public string SailNumber { get; set; } = string.Empty;

        public string MakeModel { get; set; } = string.Empty;

        public float? DefaultRating { get; set; }

        public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
        public ICollection<Entry> Entries { get; set; } = new List<Entry>();
    }
}
