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
                Name = dto.Name,
                SequenceOrder = dto.SequenceOrder,
                ScoringMethod = dto.ScoringMethod,
                ScoringConfiguration = "{}" // Default empty config
            };

            _context.Fleets.Add(fleet);
            await _context.SaveChangesAsync();
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

            fleet.Name = dto.Name;
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
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fleet == null) return false;
            if (!fleet.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
                throw new UnauthorizedAccessException("Not a committee member");

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
