using System;

namespace RaceCommittee.Api.Models
{
    public class Certificate
    {
        public int Id { get; set; }

        public int BoatId { get; set; }
        public Boat Boat { get; set; }

        public string CertificateType { get; set; } // e.g., "ORR", "ORREZ", "PHRF" // Could be Enum

        public string CertificateNumber { get; set; }

        public DateTime? IssueDate { get; set; }
        public DateTime? ValidUntil { get; set; }

        public float? GPH { get; set; }

        public string RawData { get; set; } // JSON payload
    }
}
