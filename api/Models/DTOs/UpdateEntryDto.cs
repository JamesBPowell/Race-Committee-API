namespace RaceCommittee.Api.Models.DTOs
{
    public class UpdateEntryDto
    {
        public int? FleetId { get; set; }
        public float? Rating { get; set; }
        public string RegistrationStatus { get; set; }
    }
}
