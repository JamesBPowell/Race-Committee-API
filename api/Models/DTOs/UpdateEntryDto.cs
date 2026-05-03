namespace RaceCommittee.Api.Models.DTOs
{
    public class UpdateEntryDto
    {
        public int? FleetId { get; set; }
        public float? Rating { get; set; }
        public string? RegistrationStatus { get; set; }
        public int? ActiveCertificateId { get; set; }
        public string? Configuration { get; set; } // "Spinnaker", "Non-Spinnaker"
    }
}
