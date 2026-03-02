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

            fleet.Name = dto.Name ?? string.Empty;
            fleet.SequenceOrder = dto.SequenceOrder;
            fleet.ScoringMethod = dto.ScoringMethod;

            await _context.SaveChangesAsync();
            return fleet;
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
