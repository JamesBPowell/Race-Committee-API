using Microsoft.AspNetCore.Identity;

namespace RaceCommittee.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    public ICollection<Boat> Boats { get; set; } = new List<Boat>();
    public ICollection<RegattaCommittee> CommitteeMemberships { get; set; } = new List<RegattaCommittee>();
}
