using System.Collections.Generic;

namespace RaceCommittee.Api.Models.DTOs
{
    public class RecordRaceFinishesDto
    {
        public float? WindSpeed { get; set; }
        public float? WindDirection { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public List<RecordFinishDto> Finishes { get; set; } = new List<RecordFinishDto>();
    }
}
