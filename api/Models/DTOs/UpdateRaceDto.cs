using System;

namespace RaceCommittee.Api.Models.DTOs
{
    public class UpdateRaceDto
    {
        public int? RaceNumber { get; set; }
        
        public DateTime? ScheduledStartTime { get; set; }
        
        public DateTime? ActualStartTime { get; set; }
        
        public string Status { get; set; }
    }
}
