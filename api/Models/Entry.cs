using System;

namespace RaceCommittee.Api.Models
{
    public class Entry
    {
        public int Id { get; set; }

        public int RegattaId { get; set; }
        public Regatta Regatta { get; set; }

        public int BoatId { get; set; }
        public Boat Boat { get; set; }

        public int? FleetId { get; set; }
        public Fleet Fleet { get; set; }

        public int? ActiveCertificateId { get; set; }
        public Certificate ActiveCertificate { get; set; }

        public string RegistrationStatus { get; set; } // Pending, Paid, CheckedIn
    }
}
