using System;

namespace RaceCommittee.Api.Models.DTOs
{
    public class UpdateRaceDto
    {
        public string? Name { get; set; }
        
        public DateTime? ScheduledStartTime { get; set; }
        
        public DateTime? ActualStartTime { get; set; }
        
        public string? Status { get; set; }

        public StartType? StartType { get; set; }
        public CourseType? CourseType { get; set; }
        public float? CourseDistance { get; set; }

        public IEnumerable<UpdateRaceFleetDto>? RaceFleets { get; set; }
    }

    public class UpdateRaceFleetDto
    {
        public int Id { get; set; }
        public int FleetId { get; set; }
        public int? RaceNumber { get; set; }
        public TimeSpan? StartTimeOffset { get; set; }
        public CourseType? CourseType { get; set; }
        public float? CourseDistance { get; set; }
        public bool? IncludeInOverall { get; set; }
    }
}
