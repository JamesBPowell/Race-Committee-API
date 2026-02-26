using System;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models.DTOs
{
    public class FleetDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int SequenceOrder { get; set; }
        public ScoringMethod ScoringMethod { get; set; }
    }

    public class CreateFleetDto
    {
        [Required]
        public string Name { get; set; }
        public int SequenceOrder { get; set; }
        public ScoringMethod ScoringMethod { get; set; }
    }

    public class UpdateFleetDto
    {
        [Required]
        public string Name { get; set; }
        public int SequenceOrder { get; set; }
        public ScoringMethod ScoringMethod { get; set; }
    }

    public class UpdateRegattaDto
    {
        [Required]
        public string Name { get; set; }
        public string Organization { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Location { get; set; }
        public string Status { get; set; }
    }
}
