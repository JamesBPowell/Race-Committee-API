using System;
using System.Text.Json.Serialization;

namespace RaceCommittee.Api.Models
{
    public class Finish
    {
        public int Id { get; set; }

        public int RaceId { get; set; }
        [JsonIgnore]
        public Race Race { get; set; }

        public int EntryId { get; set; }
        [JsonIgnore]
        public Entry Entry { get; set; }

        public DateTime? FinishTime { get; set; }
        public TimeSpan? ElapsedDuration { get; set; }
        public TimeSpan? CorrectedDuration { get; set; }
        
        public TimeSpan? TimePenalty { get; set; }
        
        public float? Points { get; set; }
        public float? PointPenalty { get; set; }

        public int? OverallRank { get; set; }
        public float? OverallPoints { get; set; }
        
        public string Code { get; set; } // DNF, DNS, DNC, DSQ, RET, OCS, UFD, BFD, SCP, RDG
        
        public string Notes { get; set; }
    }
}
