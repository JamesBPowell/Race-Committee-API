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
                Name = dto.Name ?? string.Empty,
                Organization = dto.Organization ?? string.Empty,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Location = dto.Location ?? string.Empty,
                Status = "Upcoming",
                Slug = GenerateSlug(dto.Name ?? string.Empty),
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

        public async Task<IEnumerable<RegattaSummaryDto>> GetRegattasAsync()
        {
            return await _context.Regattas
                .Select(r => new RegattaSummaryDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Organization = r.Organization,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    Location = r.Location,
                    Status = r.Status,
                    BoatsEnteredCount = r.Entries.Count(),
                    ClassesCount = r.Fleets.Count(),
                    ScheduledRacesCount = r.Races.Count(),
                    IsCommitteeMember = false
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<RegattaSummaryDto>> GetJoinedRegattasAsync(string userId)
        {
            return await _context.Entries
                .Include(e => e.Boat)
                .Include(e => e.Regatta)
                .Where(e => e.Boat.OwnerId == userId)
                .Select(e => e.Regatta)
                .Distinct()
                .Select(r => new RegattaSummaryDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Organization = r.Organization,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    Location = r.Location,
                    Status = r.Status,
                    BoatsEnteredCount = r.Entries.Count(),
                    ClassesCount = r.Fleets.Count(),
                    ScheduledRacesCount = r.Races.Count(),
                    IsCommitteeMember = false
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<RegattaSummaryDto>> GetManagingRegattasAsync(string userId)
        {
            return await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .Where(r => r.CommitteeMembers.Any(cm => cm.UserId == userId))
                .Select(r => new RegattaSummaryDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Organization = r.Organization,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    Location = r.Location,
                    Status = r.Status,
                    BoatsEnteredCount = r.Entries.Count(),
                    ClassesCount = r.Fleets.Count(),
                    ScheduledRacesCount = r.Races.Count(),
                    IsCommitteeMember = true
                })
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
                .Include(r => r.Entries)
                    .ThenInclude(e => e.ActiveCertificate)
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
                        BoatId = e.BoatId,
                        FleetId = e.FleetId,
                        BoatName = e.Boat?.BoatName ?? "Unknown Boat",
                        BoatType = e.Boat?.MakeModel ?? "Unknown Type",
                        SailNumber = e.Boat?.SailNumber ?? "None",
                        OwnerName = e.Boat?.Owner?.FirstName != null ? $"{e.Boat.Owner.FirstName} {e.Boat.Owner.LastName}" : "Unknown Owner",
                        Rating = e.Rating,
                        RegistrationStatus = e.RegistrationStatus,
                        ActiveCertificateId = e.ActiveCertificateId,
                        ActiveCertificateType = e.ActiveCertificate?.CertificateType,
                        ActiveCertificateNumber = e.ActiveCertificate?.CertificateNumber,
                        StatusNote = e.StatusNote,
                        Configuration = e.Configuration
                    })
                    .ToList(), // Materialize to list
                Fleets = regatta.Fleets?
                    .OrderBy(f => f.SequenceOrder)
                    .Select(f => new FleetDto
                    {
                        Id = f.Id,
                        Name = f.Name,
                        SequenceOrder = f.SequenceOrder,
                        ScoringMethod = f.ScoringMethod,
                        AllowMixedConfiguration = f.AllowMixedConfiguration,
                        DefaultConfiguration = f.DefaultConfiguration
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

            regatta.Name = dto.Name ?? string.Empty;
            regatta.Organization = dto.Organization ?? string.Empty;
            regatta.StartDate = dto.StartDate;
            regatta.EndDate = dto.EndDate;
            regatta.Location = dto.Location ?? string.Empty;
            regatta.Status = dto.Status ?? string.Empty;

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

            var entry = await _context.Entries
                .Include(e => e.Boat)
                .FirstOrDefaultAsync(e => e.Id == entryId && e.RegattaId == regattaId);
            if (entry == null) return null;

            var isCommittee = regatta.CommitteeMembers.Any(cm => cm.UserId == userId);
            var isOwner = entry.Boat?.OwnerId == userId;

            if (!isCommittee && !isOwner)
                throw new System.UnauthorizedAccessException("Not authorized to update this entry");

            // 1. Apply updates
            if (isCommittee)
            {
                // Only committee can change Fleet and Status and Manual Rating
                entry.FleetId = dto.FleetId;
                if (dto.Rating.HasValue) entry.Rating = dto.Rating;
                if (!string.IsNullOrEmpty(dto.RegistrationStatus)) entry.RegistrationStatus = dto.RegistrationStatus;
            }
            
            if (!string.IsNullOrEmpty(dto.Configuration)) entry.Configuration = dto.Configuration;

            // 2. Handle certificate assignment (MUST happen before validation)
            if (dto.ActiveCertificateId != entry.ActiveCertificateId)
            {
                if (dto.ActiveCertificateId.HasValue)
                {
                    var cert = await _context.Certificates
                        .FirstOrDefaultAsync(c => c.Id == dto.ActiveCertificateId.Value);

                    if (cert != null)
                    {
                        if (cert.BoatId != entry.BoatId)
                            throw new InvalidOperationException("Certificate does not belong to this boat.");

                        entry.ActiveCertificateId = cert.Id;
                    }
                    else
                    {
                        entry.ActiveCertificateId = null;
                    }
                }
                else
                {
                    entry.ActiveCertificateId = null;
                }
            }

            // 3. Perform Validation
            var fleet = entry.FleetId.HasValue 
                ? await _context.Fleets.FindAsync(entry.FleetId.Value)
                : null;
            
            var (isValid, message) = await ValidateEntryRequirementsAsync(entry, fleet);
            
            if (entry.RegistrationStatus == "Accepted" && !isValid)
            {
                entry.RegistrationStatus = "Pending";
            }
            entry.StatusNote = isValid ? null : message;

            // 4. Update Snapshot/Rating if valid and we have a cert
            if (isValid && entry.ActiveCertificateId.HasValue)
            {
                var cert = await _context.Certificates.FindAsync(entry.ActiveCertificateId.Value);
                if (cert != null)
                {
                    entry.RatingSnapshot = cert.RawData;
                    
                    // Determine configuration based on fleet settings
                    string config = (fleet != null && fleet.AllowMixedConfiguration) 
                        ? entry.Configuration 
                        : (fleet?.DefaultConfiguration ?? BoatConfiguration.Spinnaker);
                        
                    var isSpinnaker = config != BoatConfiguration.NonSpinnaker;
                    entry.Rating = isSpinnaker ? cert.RatingSpinnaker : cert.RatingNonSpinnaker;
                }
            }

            await _context.SaveChangesAsync();
            return entry;
        }

        public async Task<Entry?> RefreshEntrySnapshotAsync(int regattaId, int entryId, string userId)
        {
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == regattaId);

            if (regatta == null) return null;
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new System.UnauthorizedAccessException("Not authorized to manage entries for this regatta");

            var entry = await _context.Entries.FirstOrDefaultAsync(e => e.Id == entryId && e.RegattaId == regattaId);
            if (entry == null) return null;

            if (entry.ActiveCertificateId.HasValue)
            {
                var cert = await _context.Certificates.FindAsync(entry.ActiveCertificateId.Value);
                if (cert != null)
                {
                    entry.RatingSnapshot = cert.RawData;
                    var isSpinnaker = entry.Configuration != "Non-Spinnaker";
                    entry.Rating = isSpinnaker ? cert.RatingSpinnaker : cert.RatingNonSpinnaker;
                    await _context.SaveChangesAsync();
                }
            }

            return entry;
        }

        public async Task<int> RefreshAllEntrySnapshotsAsync()
        {
            var entries = await _context.Entries
                .Include(e => e.ActiveCertificate)
                .Where(e => e.ActiveCertificateId.HasValue)
                .ToListAsync();

            int count = 0;
            foreach (var entry in entries)
            {
                if (entry.ActiveCertificate != null)
                {
                    entry.RatingSnapshot = entry.ActiveCertificate.RawData;
                    var isSpinnaker = entry.Configuration != "Non-Spinnaker";
                    entry.Rating = isSpinnaker ? entry.ActiveCertificate.RatingSpinnaker : entry.ActiveCertificate.RatingNonSpinnaker;
                    count++;
                }
            }

            await _context.SaveChangesAsync();
            return count;
        }

        public async Task<(bool IsValid, string? Message)> ValidateEntryRequirementsAsync(Entry entry, Fleet? fleet)
        {
            if (fleet == null) return (true, null);

            // Check for certificate requirements
            if (fleet.ScoringMethod == ScoringMethod.ORR_EZ_PC || 
                fleet.ScoringMethod == ScoringMethod.ORR_Full_PC || 
                fleet.ScoringMethod == ScoringMethod.ORR_EZ_GPH)
            {
                var requiredType = fleet.ScoringMethod == ScoringMethod.ORR_Full_PC ? "ORR" : "ORR-EZ";
                
                if (!entry.ActiveCertificateId.HasValue)
                {
                    // Check if boat HAS any certificate
                    var anyCerts = await _context.Certificates
                        .Where(c => c.BoatId == entry.BoatId)
                        .ToListAsync();
                    
                    if (!anyCerts.Any())
                    {
                        return (false, $"A valid {requiredType} certificate is required, but no certificates were found for this boat. Please import or create a certificate first.");
                    }
                    
                    var matchingCerts = anyCerts.Where(c => IsCertificateTypeMatching(c.CertificateType, requiredType)).ToList();
                    
                    if (matchingCerts.Any())
                    {
                        return (false, $"A valid {requiredType} certificate is required. The boat has {matchingCerts.Count} matching certificate(s) available, but none are currently selected for this regatta entry.");
                    }

                    return (false, $"A valid {requiredType} certificate is required, but the boat only has {string.Join(", ", anyCerts.Select(c => c.CertificateType).Distinct())} certificates. An {requiredType} certificate is needed for this class.");
                }

                var cert = await _context.Certificates.FindAsync(entry.ActiveCertificateId.Value);
                if (cert == null)
                {
                    return (false, "The selected certificate could not be found. It may have been deleted.");
                }

                // Check if the linked certificate type is sufficient
                if (!IsCertificateTypeMatching(cert.CertificateType, requiredType))
                {
                     return (false, $"The class requires an {requiredType} certificate, but the selected certificate is an {cert.CertificateType} certificate.");
                }

                if (cert.ValidUntil.HasValue && cert.ValidUntil.Value < DateTime.UtcNow)
                {
                    return (false, $"The selected {cert.CertificateType} certificate (#{cert.CertificateNumber}) expired on {cert.ValidUntil.Value:d}. Please update or renew the certificate.");
                }
            }

            return (true, null);
        }

        private bool IsCertificateTypeMatching(string certType, string requiredType)
        {
            var normalizedCert = certType.Replace("-", "").ToUpperInvariant();
            var normalizedReq = requiredType.Replace("-", "").ToUpperInvariant();
            
            return normalizedCert == normalizedReq;
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
