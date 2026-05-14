using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class FleetsService : IFleetsService
    {
        private readonly ApplicationDbContext _context;

        public FleetsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Fleet> CreateFleetAsync(int regattaId, CreateFleetDto dto, string userId)
        {
            // Verify regatta exists and user has permission
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == regattaId);

            if (regatta == null) throw new ArgumentException("Regatta not found");
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new UnauthorizedAccessException("Not a committee member");

            var fleet = new Fleet
            {
                RegattaId = regattaId,
                Name = dto.Name ?? string.Empty,
                SequenceOrder = dto.SequenceOrder,
                ScoringMethod = dto.ScoringMethod,
                AllowMixedConfiguration = dto.AllowMixedConfiguration,
                DefaultConfiguration = dto.DefaultConfiguration ?? BoatConfiguration.Spinnaker,
                ScoringConfiguration = "{}" // Default empty config
            };

            _context.Fleets.Add(fleet);
            await _context.SaveChangesAsync();

            // Automatically enroll the new fleet in all existing races for the regatta
            var existingRaces = await _context.Races
                .Where(r => r.RegattaId == regattaId)
                .ToListAsync();

            if (existingRaces.Any())
            {
                foreach (var race in existingRaces)
                {
                    // Attempt to extract a race number from the race name if possible
                    int? extractedNumber = null;
                    if (!string.IsNullOrEmpty(race.Name))
                    {
                        var match = System.Text.RegularExpressions.Regex.Match(race.Name, @"\d+");
                        if (match.Success && int.TryParse(match.Value, out int num))
                        {
                            extractedNumber = num;
                        }
                    }

                    var raceFleet = new RaceFleet
                    {
                        RaceId = race.Id,
                        FleetId = fleet.Id,
                        RaceNumber = extractedNumber ?? 1,
                        IncludeInOverall = true
                    };
                    _context.RaceFleets.Add(raceFleet);
                }
                await _context.SaveChangesAsync();
            }

            return fleet;
        }

        public async Task<Fleet> UpdateFleetAsync(int id, UpdateFleetDto dto, string userId)
        {
            var fleet = await _context.Fleets
                .Include(f => f.Regatta)
                    .ThenInclude(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fleet == null) throw new ArgumentException("Fleet not found");
            if (!fleet.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new UnauthorizedAccessException("Not a committee member");

            var oldScoringMethod = fleet.ScoringMethod;
            fleet.Name = dto.Name ?? string.Empty;
            fleet.SequenceOrder = dto.SequenceOrder;
            fleet.ScoringMethod = dto.ScoringMethod;
            fleet.AllowMixedConfiguration = dto.AllowMixedConfiguration;
            fleet.DefaultConfiguration = dto.DefaultConfiguration ?? BoatConfiguration.Spinnaker;

            await _context.SaveChangesAsync();

            if (oldScoringMethod != dto.ScoringMethod)
            {
                await ReevaluateFleetEntriesAsync(fleet.Id);
            }

            return fleet;
        }

        public async Task ReevaluateFleetEntriesAsync(int fleetId)
        {
            var fleet = await _context.Fleets.FindAsync(fleetId);
            if (fleet == null) return;

            var entries = await _context.Entries
                .Where(e => e.FleetId == fleetId)
                .ToListAsync();

            foreach (var entry in entries)
            {
                var (isValid, message) = await ValidateEntryRequirementsInternalAsync(entry, fleet);
                
                if (!isValid)
                {
                    // If it was accepted but no longer valid, move back to pending
                    if (entry.RegistrationStatus == "Accepted")
                    {
                        entry.RegistrationStatus = "Pending";
                    }
                    entry.StatusNote = message;
                }
                else
                {
                    // If it's valid, clear the note (it might have been pending due to missing cert)
                    entry.StatusNote = null;
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task<(bool IsValid, string? Message)> ValidateEntryRequirementsInternalAsync(Entry entry, Fleet fleet)
        {
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

        public async Task<bool> DeleteFleetAsync(int id, string userId)
        {
            var fleet = await _context.Fleets
                .Include(f => f.Regatta)
                    .ThenInclude(r => r.CommitteeMembers)
                .Include(f => f.ParticipatingInRaces)
                .Include(f => f.Entries)
                .Include(f => f.Races)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fleet == null) return false;
            if (!fleet.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new UnauthorizedAccessException("Not a committee member");

            // Manually clear related data that would otherwise conflict 
            // or where we want to preserve the record but unlink the class
            _context.RaceFleets.RemoveRange(fleet.ParticipatingInRaces);

            foreach (var entry in fleet.Entries)
            {
                entry.FleetId = null;
            }

            foreach (var race in fleet.Races)
            {
                race.FleetId = null;
            }

            _context.Fleets.Remove(fleet);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Fleet>> GetRegattaFleetsAsync(int regattaId)
        {
            return await _context.Fleets
                .Where(f => f.RegattaId == regattaId)
                .OrderBy(f => f.SequenceOrder)
                .ToListAsync();
        }
    }
}
