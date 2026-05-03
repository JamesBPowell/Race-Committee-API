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

        public async Task<IEnumerable<BoatDto>> GetBoatsAsync(string userId, bool includeCertificates = false)
        {
            var query = _context.Boats
                .Where(b => b.OwnerId == userId);

            if (includeCertificates)
            {
                query = query.Include(b => b.Certificates);
            }

            return await query
                .Select(b => new BoatDto
                {
                    Id = b.Id,
                    BoatName = b.BoatName,
                    SailNumber = b.SailNumber,
                    MakeModel = b.MakeModel,
                    DefaultRating = b.DefaultRating,
                    DefaultRatingType = b.DefaultRatingType,
                    Certificates = includeCertificates ? b.Certificates.Select(c => new CertificateDto
                    {
                        Id = c.Id,
                        BoatId = c.BoatId,
                        CertificateType = c.CertificateType,
                        CertificateNumber = c.CertificateNumber,
                        IssueDate = c.IssueDate,
                        ValidUntil = c.ValidUntil,
                        RatingSpinnaker = c.RatingSpinnaker,
                        RatingNonSpinnaker = c.RatingNonSpinnaker,
                        Configuration = c.Configuration,
                        FileName = c.FileName,
                        HasFile = c.BlobPath != null,
                        SourceUrl = c.SourceUrl,
                        ParseStatus = c.ParseStatus,
                        SchemaVersion = c.SchemaVersion
                    }).ToList() : null
                })
                .ToListAsync();
        }

        public async Task<BoatDto?> GetBoatAsync(int id, string userId, bool includeCertificates = false)
        {
            var query = _context.Boats
                .Where(b => b.Id == id && b.OwnerId == userId);

            if (includeCertificates)
            {
                query = query.Include(b => b.Certificates);
            }

            return await query
                .Select(b => new BoatDto
                {
                    Id = b.Id,
                    BoatName = b.BoatName,
                    SailNumber = b.SailNumber,
                    MakeModel = b.MakeModel,
                    DefaultRating = b.DefaultRating,
                    DefaultRatingType = b.DefaultRatingType,
                    Certificates = includeCertificates ? b.Certificates.Select(c => new CertificateDto
                    {
                        Id = c.Id,
                        BoatId = c.BoatId,
                        CertificateType = c.CertificateType,
                        CertificateNumber = c.CertificateNumber,
                        IssueDate = c.IssueDate,
                        ValidUntil = c.ValidUntil,
                        RatingSpinnaker = c.RatingSpinnaker,
                        RatingNonSpinnaker = c.RatingNonSpinnaker,
                        Configuration = c.Configuration,
                        FileName = c.FileName,
                        HasFile = c.BlobPath != null,
                        SourceUrl = c.SourceUrl,
                        ParseStatus = c.ParseStatus,
                        SchemaVersion = c.SchemaVersion
                    }).ToList() : null
                })
                .FirstOrDefaultAsync();
        }

        public async Task<BoatDto> CreateBoatAsync(CreateBoatDto createBoatDto, string userId)
        {
            var boat = new Boat
            {
                OwnerId = userId,
                BoatName = createBoatDto.BoatName ?? string.Empty,
                SailNumber = createBoatDto.SailNumber ?? string.Empty,
                MakeModel = createBoatDto.MakeModel ?? string.Empty,
                DefaultRating = createBoatDto.DefaultRating,
                DefaultRatingType = createBoatDto.DefaultRatingType
            };

            _context.Boats.Add(boat);
            await _context.SaveChangesAsync();

            return new BoatDto
            {
                Id = boat.Id,
                BoatName = boat.BoatName,
                SailNumber = boat.SailNumber,
                MakeModel = boat.MakeModel,
                DefaultRating = boat.DefaultRating,
                DefaultRatingType = boat.DefaultRatingType
            };
        }

        public async Task<bool> UpdateBoatAsync(int id, UpdateBoatDto updateBoatDto, string userId)
        {
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);

            if (boat == null)
            {
                return false;
            }

            boat.BoatName = updateBoatDto.BoatName ?? string.Empty;
            boat.SailNumber = updateBoatDto.SailNumber ?? string.Empty;
            boat.MakeModel = updateBoatDto.MakeModel ?? string.Empty;
            boat.DefaultRating = updateBoatDto.DefaultRating;
            if (updateBoatDto.DefaultRatingType != null) boat.DefaultRatingType = updateBoatDto.DefaultRatingType;

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
