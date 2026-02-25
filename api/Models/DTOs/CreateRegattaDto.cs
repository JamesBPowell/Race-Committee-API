using System;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models.DTOs
{
    public class CreateRegattaDto
    {
        [Required]
        public string Name { get; set; }

        public string Organization { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string Location { get; set; }
    }
}
