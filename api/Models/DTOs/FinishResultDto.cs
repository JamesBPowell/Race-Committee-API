using System;

namespace RaceCommittee.Api.Models.DTOs
{
    public class FinishResultDto
    {
        public int FinishId { get; set; }
        public int RaceId { get; set; }
        public int EntryId { get; set; }
        public int FleetId { get; set; }
        
        public string BoatName { get; set; }
        public string SailNumber { get; set; }
        public string FleetName { get; set; }
        
        public DateTime? FinishTime { get; set; }
        public TimeSpan? ElapsedDuration { get; set; }
        public TimeSpan? CorrectedDuration { get; set; }
        public TimeSpan? TimePenalty { get; set; }
        
        public string Code { get; set; }
        public string Notes { get; set; }
        
        public float? Points { get; set; }
        public float? OverallPoints { get; set; }
        public int? OverallRank { get; set; }
        
        public string ScoringMethodUsed { get; set; }
    }
}
