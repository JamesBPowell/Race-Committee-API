using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Models;

namespace RaceCommittee.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public DbSet<Regatta> Regattas { get; set; }
    public DbSet<RegattaCommittee> RegattaCommittees { get; set; }
    public DbSet<Fleet> Fleets { get; set; }
    public DbSet<Race> Races { get; set; }
    public DbSet<Boat> Boats { get; set; }
    public DbSet<Certificate> Certificates { get; set; }
    public DbSet<Entry> Entries { get; set; }
    public DbSet<RaceFleet> RaceFleets { get; set; }
    public DbSet<Finish> Finishes { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure RaceFleet relationship
        builder.Entity<RaceFleet>()
            .HasOne(rf => rf.Race)
            .WithMany(r => r.ParticipatingFleets)
            .HasForeignKey(rf => rf.RaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RaceFleet>()
            .HasOne(rf => rf.Fleet)
            .WithMany(f => f.ParticipatingInRaces)
            .HasForeignKey(rf => rf.FleetId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Entry to Boat relationship
        builder.Entity<Entry>()
            .HasOne(e => e.Boat)
            .WithMany(b => b.Entries)
            .HasForeignKey(e => e.BoatId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes

        // Configure Entry to ActiveCertificate relationship
        builder.Entity<Entry>()
            .HasOne(e => e.ActiveCertificate)
            .WithMany()
            .HasForeignKey(e => e.ActiveCertificateId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Finish relationships to prevent multiple cascade paths
        builder.Entity<Finish>()
            .HasOne(f => f.Race)
            .WithMany(r => r.Finishes)
            .HasForeignKey(f => f.RaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Finish>()
            .HasOne(f => f.Entry)
            .WithMany(e => e.Finishes)
            .HasForeignKey(f => f.EntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
