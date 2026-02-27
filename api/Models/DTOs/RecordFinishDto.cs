using System;

namespace RaceCommittee.Api.Models.DTOs
{
    public class RecordFinishDto
    {
        public int EntryId { get; set; }
        public DateTime? FinishTime { get; set; }
        public TimeSpan? TimePenalty { get; set; }
        public float? PointPenalty { get; set; }
        public string? Code { get; set; } // DNF, DNS, DSQ, etc.
        public string? Notes { get; set; }
    }
}
