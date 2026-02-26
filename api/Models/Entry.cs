using System;
using System.Text.Json.Serialization;

namespace RaceCommittee.Api.Models
{
    public class Entry
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        [JsonIgnore]
        public Regatta Regatta { get; set; }

        public int BoatId { get; set; }
        [JsonIgnore]
        public Boat Boat { get; set; }

        public int? FleetId { get; set; }
        [JsonIgnore]
        public Fleet Fleet { get; set; }

        public int? ActiveCertificateId { get; set; }
        [JsonIgnore]
        public Certificate ActiveCertificate { get; set; }

        public string Configuration { get; set; } // "Spinnaker", "Non-Spinnaker"
        public float? Rating { get; set; } // Current fixed rating (snapshot)
        public string RatingSnapshot { get; set; } // JSON of full polar data for ORR (snapshot at regatta start)

        public string RegistrationStatus { get; set; } // Pending, Paid, CheckedIn
    }
}
