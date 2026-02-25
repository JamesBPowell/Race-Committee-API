using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models
{
    public class Boat
    {
        public int Id { get; set; }

        [Required]
        public string OwnerId { get; set; }
        public ApplicationUser Owner { get; set; }

        [Required]
        public string BoatName { get; set; }

        [Required]
        public string SailNumber { get; set; }

        public string MakeModel { get; set; }

        public float? DefaultRating { get; set; }

        public ICollection<Certificate> Certificates { get; set; }
        public ICollection<Entry> Entries { get; set; }
    }
}
