using System;

namespace RaceCommittee.Api.Models
{
    public class RaceFleet
    {
        public int Id { get; set; }

        public int RaceId { get; set; }
        public Race Race { get; set; }

        public int FleetId { get; set; }
        public Fleet Fleet { get; set; }

        public TimeSpan? StartTimeOffset { get; set; } // Used for staggered starts
        public CourseType? CourseType { get; set; }
        public float? WindSpeed { get; set; }
        public float? WindDirection { get; set; }
        public float? CourseDistance { get; set; }
        public string ScoringParameters { get; set; }
    }
}
