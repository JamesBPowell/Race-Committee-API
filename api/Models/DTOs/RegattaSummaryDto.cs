using System;

namespace RaceCommittee.Api.Models.DTOs
{
    public class RegattaSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Organization { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Location { get; set; }
        public string Status { get; set; }
        public int BoatsEnteredCount { get; set; }
        public int ClassesCount { get; set; }
        public int ScheduledRacesCount { get; set; }
        public bool IsCommitteeMember { get; set; }
    }
}
