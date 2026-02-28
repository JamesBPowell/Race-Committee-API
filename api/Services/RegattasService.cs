using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class RegattasService : IRegattasService
    {
        private readonly ApplicationDbContext _context;

        public RegattasService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Regatta> CreateRegattaAsync(CreateRegattaDto dto, string userId)
        {
            var regatta = new Regatta
            {
                Name = dto.Name,
                Organization = dto.Organization,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Location = dto.Location,
                Status = "Upcoming",
                Slug = GenerateSlug(dto.Name),
                CommitteeMembers = new List<RegattaCommittee>
                {
                    new RegattaCommittee
                    {
                        UserId = userId,
                        Role = "PRO"
                    }
                }
            };

            _context.Regattas.Add(regatta);
            await _context.SaveChangesAsync();

            return regatta;
        }

        public async Task<IEnumerable<Regatta>> GetRegattasAsync()
        {
            return await _context.Regattas.ToListAsync();
        }

        public async Task<IEnumerable<Regatta>> GetJoinedRegattasAsync(string userId)
        {
            return await _context.Entries
                .Include(e => e.Boat)
                .Include(e => e.Regatta)
                .Where(e => e.Boat.OwnerId == userId)
                .Select(e => e.Regatta)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IEnumerable<Regatta>> GetManagingRegattasAsync(string userId)
        {
            return await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .Where(r => r.CommitteeMembers.Any(cm => cm.UserId == userId))
                .ToListAsync();
        }

        public async Task<RegattaDetailsDto?> GetRegattaAsync(int id, string? userId = null)
        {
            var regatta = await _context.Regattas
                .Include(r => r.Races)
                    .ThenInclude(r => r.ParticipatingFleets)
                        .ThenInclude(rf => rf.Fleet)
                .Include(r => r.Entries)
                    .ThenInclude(e => e.Boat)
                        .ThenInclude(b => b.Owner)
                .Include(r => r.Fleets)
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (regatta == null) return null;

            var isCommittee = userId != null && regatta.CommitteeMembers.Any(cm => cm.UserId == userId);
            int? myEntryId = null;
            if (userId != null)
            {
                myEntryId = regatta.Entries?.FirstOrDefault(e => e.Boat?.OwnerId == userId)?.Id;
            }

            return new RegattaDetailsDto
            {
                Id = regatta.Id,
                Name = regatta.Name,
                Organization = regatta.Organization,
                StartDate = regatta.StartDate,
                EndDate = regatta.EndDate,
                Location = regatta.Location,
                Status = regatta.Status,
                BoatsEnteredCount = regatta.Entries?.Count ?? 0,
                ClassesCount = regatta.Fleets?.Count ?? 0,
                ScheduledRacesCount = regatta.Races?.Count ?? 0,
                IsCommitteeMember = isCommittee,
                MyEntryId = myEntryId,
                Races = regatta.Races?
                    .OrderBy(r => r.Name)
                    .Select(r => new RaceDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        ScheduledStartTime = r.ScheduledStartTime,
                        ActualStartTime = r.ActualStartTime,
                        Status = r.Status,
                        StartType = r.StartType,
                        CourseType = r.CourseType,
                        WindSpeed = r.WindSpeed,
                        WindDirection = r.WindDirection,
                        CourseDistance = r.CourseDistance,
                        RaceFleets = r.ParticipatingFleets?.Select(rf => new RaceFleetDto
                        {
                            Id = rf.Id,
                            FleetId = rf.FleetId,
                            FleetName = rf.Fleet?.Name,
                            RaceNumber = rf.RaceNumber,
                            StartTimeOffset = rf.StartTimeOffset,
                            CourseType = rf.CourseType,
                            WindSpeed = rf.WindSpeed,
                            WindDirection = rf.WindDirection,
                            CourseDistance = rf.CourseDistance,
                            IncludeInOverall = rf.IncludeInOverall
                        })
                    }),
                Entries = regatta.Entries?
                    .Select(e => new EntryDto
                    {
                        Id = e.Id,
                        FleetId = e.FleetId,
                        BoatName = e.Boat?.BoatName ?? "Unknown Boat",
                        BoatType = e.Boat?.MakeModel ?? "Unknown Type",
                        SailNumber = e.Boat?.SailNumber ?? "None",
                        OwnerName = e.Boat?.Owner?.FirstName != null ? $"{e.Boat.Owner.FirstName} {e.Boat.Owner.LastName}" : "Unknown Owner",
                        Rating = e.Rating,
                        RegistrationStatus = e.RegistrationStatus
                    })
                    .ToList(), // Materialize to list
                Fleets = regatta.Fleets?
                    .OrderBy(f => f.SequenceOrder)
                    .Select(f => new FleetDto
                    {
                        Id = f.Id,
                        Name = f.Name,
                        SequenceOrder = f.SequenceOrder,
                        ScoringMethod = f.ScoringMethod
                    })
            };
        }

        public async Task<Regatta?> UpdateRegattaAsync(int id, UpdateRegattaDto dto, string userId)
        {
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (regatta == null) return null;
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new UnauthorizedAccessException("Not authorized to update this regatta");

            regatta.Name = dto.Name;
            regatta.Organization = dto.Organization;
            regatta.StartDate = dto.StartDate;
            regatta.EndDate = dto.EndDate;
            regatta.Location = dto.Location;
            regatta.Status = dto.Status;

            await _context.SaveChangesAsync();
            return regatta;
        }

        public async Task<(bool Success, string ErrorMessage, Entry? Entry)> JoinRegattaAsync(int id, JoinRegattaDto dto, string userId)
        {
            // Verify Boat exists and belongs to the user
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == dto.BoatId && b.OwnerId == userId);
            if (boat == null)
            {
                return (false, "Invalid boat selected or boat does not belong to you.", null);
            }

            // Verify Regatta exists
            var regatta = await _context.Regattas.FindAsync(id);
            if (regatta == null)
            {
                return (false, "Regatta not found.", null);
            }

            // Check if already entered
            var existingEntry = await _context.Entries.FirstOrDefaultAsync(e => e.RegattaId == id && e.BoatId == dto.BoatId);
            if (existingEntry != null)
            {
                return (false, "This boat is already entered in this regatta.", null);
            }

            // Get available fleets for this regatta and default to the first one
            var fleets = await _context.Fleets.Where(f => f.RegattaId == id).ToListAsync();
            int? defaultFleetId = fleets.OrderBy(f => f.Id).FirstOrDefault()?.Id;

            var entry = new Entry
            {
                RegattaId = id,
                BoatId = dto.BoatId,
                FleetId = defaultFleetId,
                Rating = boat.DefaultRating,
                RatingSnapshot = "{}",
                Configuration = "Spinnaker",
                RegistrationStatus = "Pending"
            };

            _context.Entries.Add(entry);
            await _context.SaveChangesAsync();

            return (true, string.Empty, entry);
        }

        public async Task<Entry?> UpdateEntryAsync(int regattaId, int entryId, UpdateEntryDto dto, string userId)
        {
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == regattaId);

            if (regatta == null) return null;
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new System.UnauthorizedAccessException("Not authorized to update entries for this regatta");

            var entry = await _context.Entries.FirstOrDefaultAsync(e => e.Id == entryId && e.RegattaId == regattaId);
            if (entry == null) return null;

            entry.FleetId = dto.FleetId;
            if (dto.Rating.HasValue)
            {
                entry.Rating = dto.Rating;
            }
            if (!string.IsNullOrEmpty(dto.RegistrationStatus))
            {
                entry.RegistrationStatus = dto.RegistrationStatus;
            }

            await _context.SaveChangesAsync();
            return entry;
        }

        private string GenerateSlug(string phrase)
        {
            string str = phrase.ToLower();
            // Remove invalid chars
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // Convert multiple spaces into one space
            str = Regex.Replace(str, @"\s+", " ").Trim();
            // Replace spaces with hyphens
            str = Regex.Replace(str, @"\s", "-");
            return str;
        }
    }
}
