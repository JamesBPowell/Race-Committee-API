using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class RacesService : IRacesService
    {
        private readonly ApplicationDbContext _context;

        public RacesService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Race> CreateRaceAsync(int regattaId, CreateRaceDto dto, string userId)
        {
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == regattaId);

            if (regatta == null)
            {
                throw new ArgumentException("Regatta not found");
            }

            // Verify the user is a committee member
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this regatta");
            }

            var race = new Race
            {
                RegattaId = regattaId,
                RaceNumber = dto.RaceNumber,
                ScheduledStartTime = dto.ScheduledStartTime,
                Status = dto.Status ?? "Scheduled"
            };

            _context.Races.Add(race);
            await _context.SaveChangesAsync();

            return race;
        }

        public async Task<Race> UpdateRaceAsync(int id, UpdateRaceDto dto, string userId)
        {
            var race = await _context.Races
                .Include(r => r.Regatta)
                .ThenInclude(reg => reg.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (race == null)
            {
                throw new ArgumentException("Race not found");
            }

            // Verify the user is a committee member for the regatta
            if (!race.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this race");
            }

            if (dto.RaceNumber.HasValue) race.RaceNumber = dto.RaceNumber.Value;
            if (dto.ScheduledStartTime.HasValue) race.ScheduledStartTime = dto.ScheduledStartTime;
            if (dto.ActualStartTime.HasValue) race.ActualStartTime = dto.ActualStartTime;
            if (!string.IsNullOrEmpty(dto.Status)) race.Status = dto.Status;

            _context.Races.Update(race);
            await _context.SaveChangesAsync();

            return race;
        }

        public async Task<bool> DeleteRaceAsync(int id, string userId)
        {
            var race = await _context.Races
                .Include(r => r.Regatta)
                .ThenInclude(reg => reg.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (race == null)
            {
                return false;
            }

            // Verify the user is a committee member for the regatta
            if (!race.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this race");
            }

            _context.Races.Remove(race);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
