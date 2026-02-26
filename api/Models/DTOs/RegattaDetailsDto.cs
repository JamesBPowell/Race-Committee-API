using System;
using System.Collections.Generic;

namespace RaceCommittee.Api.Models.DTOs
{
    public class RegattaDetailsDto
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
        public IEnumerable<RaceDto> Races { get; set; }
        public IEnumerable<EntryDto> Entries { get; set; }
    }

    public class EntryDto
    {
        public int Id { get; set; }
        public string BoatName { get; set; }
        public string BoatType { get; set; }
        public string SailNumber { get; set; }
        public string OwnerName { get; set; }
        public string RegistrationStatus { get; set; }
    }

    public class RaceDto
    {
        public int Id { get; set; }
        public int RaceNumber { get; set; }
        public DateTime? ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public string Status { get; set; }
    }
}
