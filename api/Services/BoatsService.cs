using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Models;
using api.Models.DTOs;
using RaceCommittee.Api.Models.DTOs;
using RaceCommittee.Api.Data;

namespace RaceCommittee.Api.Services
{
    public class BoatsService : IBoatsService
    {
        private readonly ApplicationDbContext _context;

        public BoatsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BoatDto>> GetBoatsAsync(string userId)
        {
            return await _context.Boats
                .Where(b => b.OwnerId == userId)
                .Select(b => new BoatDto
                {
                    Id = b.Id,
                    BoatName = b.BoatName,
                    SailNumber = b.SailNumber,
                    MakeModel = b.MakeModel,
                    DefaultRating = b.DefaultRating
                })
                .ToListAsync();
        }

        public async Task<BoatDto?> GetBoatAsync(int id, string userId)
        {
            return await _context.Boats
                .Where(b => b.Id == id && b.OwnerId == userId)
                .Select(b => new BoatDto
                {
                    Id = b.Id,
                    BoatName = b.BoatName,
                    SailNumber = b.SailNumber,
                    MakeModel = b.MakeModel,
                    DefaultRating = b.DefaultRating
                })
                .FirstOrDefaultAsync();
        }

        public async Task<BoatDto> CreateBoatAsync(CreateBoatDto createBoatDto, string userId)
        {
            var boat = new Boat
            {
                OwnerId = userId,
                BoatName = createBoatDto.BoatName,
                SailNumber = createBoatDto.SailNumber,
                MakeModel = createBoatDto.MakeModel,
                DefaultRating = createBoatDto.DefaultRating
            };

            _context.Boats.Add(boat);
            await _context.SaveChangesAsync();

            return new BoatDto
            {
                Id = boat.Id,
                BoatName = boat.BoatName,
                SailNumber = boat.SailNumber,
                MakeModel = boat.MakeModel,
                DefaultRating = boat.DefaultRating
            };
        }

        public async Task<bool> UpdateBoatAsync(int id, UpdateBoatDto updateBoatDto, string userId)
        {
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);

            if (boat == null)
            {
                return false;
            }

            boat.BoatName = updateBoatDto.BoatName;
            boat.SailNumber = updateBoatDto.SailNumber;
            boat.MakeModel = updateBoatDto.MakeModel;
            boat.DefaultRating = updateBoatDto.DefaultRating;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BoatExists(id))
                {
                    return false;
                }
                else
                {
                    throw;
                }
            }
        }

        public async Task<(bool Success, string ErrorMessage)> DeleteBoatAsync(int id, string userId)
        {
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
            if (boat == null)
            {
                return (false, "Boat not found.");
            }

            var hasEntries = await _context.Entries.AnyAsync(e => e.BoatId == id);
            if (hasEntries)
            {
                return (false, "Cannot delete a boat that is currently entered in a regatta.");
            }

            _context.Boats.Remove(boat);
            await _context.SaveChangesAsync();

            return (true, string.Empty);
        }

        private bool BoatExists(int id)
        {
            return _context.Boats.Any(e => e.Id == id);
        }
    }
}
