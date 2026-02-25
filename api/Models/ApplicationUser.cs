using Microsoft.AspNetCore.Identity;

namespace RaceCommittee.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
