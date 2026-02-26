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

        public StartType StartType { get; set; }
        public CourseType CourseType { get; set; }
        public float? WindSpeed { get; set; }
        public float? WindDirection { get; set; }
        public float? CourseDistance { get; set; }

        public IEnumerable<CreateRaceFleetDto>? RaceFleets { get; set; }
    }

    public class CreateRaceFleetDto
    {
        public int FleetId { get; set; }
        public TimeSpan? StartTimeOffset { get; set; }
        public CourseType? CourseType { get; set; }
        public float? WindSpeed { get; set; }
        public float? WindDirection { get; set; }
        public float? CourseDistance { get; set; }
    }
}
