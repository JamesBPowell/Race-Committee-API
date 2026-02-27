using System;

namespace RaceCommittee.Api.Models
{
    public class Race
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        public Regatta Regatta { get; set; }

        public int? FleetId { get; set; }
        public Fleet Fleet { get; set; }

        public StartType StartType { get; set; }
        public CourseType CourseType { get; set; }
        public float? WindSpeed { get; set; }
        public float? WindDirection { get; set; }
        public float? CourseDistance { get; set; }

        public int RaceNumber { get; set; }
        
        public DateTime? ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }

        public string Status { get; set; } // Scheduled, InSequence, Racing, Completed, Postponed, Abandoned
        public string ScoringParameters { get; set; } // JSON for race-specific scoring data (e.g. course mix for ORR-EZ)

        public ICollection<RaceFleet> ParticipatingFleets { get; set; }
        public ICollection<Finish> Finishes { get; set; }
    }
}
