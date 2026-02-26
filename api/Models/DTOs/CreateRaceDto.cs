using System;
using System.ComponentModel.DataAnnotations;

namespace RaceCommittee.Api.Models.DTOs
{
    public class CreateRaceDto
    {
        [Required]
        public int RaceNumber { get; set; }
        
        public DateTime? ScheduledStartTime { get; set; }
        
        public string Status { get; set; } = "Scheduled";
    }
}
