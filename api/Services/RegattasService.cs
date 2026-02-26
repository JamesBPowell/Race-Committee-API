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

        public async Task<Regatta?> GetRegattaAsync(int id)
        {
            return await _context.Regattas.FindAsync(id);
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

            var entry = new Entry
            {
                RegattaId = id,
                BoatId = dto.BoatId,
                RegistrationStatus = "Pending"
            };

            _context.Entries.Add(entry);
            await _context.SaveChangesAsync();

            return (true, string.Empty, entry);
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
