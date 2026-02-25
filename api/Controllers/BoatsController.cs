using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Models;
using api.Models.DTOs;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using System.Security.Claims;

namespace api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BoatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoatsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // GET: api/boats
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BoatDto>>> GetBoats()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var boats = await _context.Boats
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

            return Ok(boats);
        }

        // GET: api/boats/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BoatDto>> GetBoat(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var boat = await _context.Boats
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

            if (boat == null)
            {
                return NotFound();
            }

            return Ok(boat);
        }

        // POST: api/boats
        [HttpPost]
        public async Task<ActionResult<BoatDto>> PostBoat(CreateBoatDto createBoatDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

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

            var boatDto = new BoatDto
            {
                Id = boat.Id,
                BoatName = boat.BoatName,
                SailNumber = boat.SailNumber,
                MakeModel = boat.MakeModel,
                DefaultRating = boat.DefaultRating
            };

            return CreatedAtAction(nameof(GetBoat), new { id = boat.Id }, boatDto);
        }

        // PUT: api/boats/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBoat(int id, UpdateBoatDto updateBoatDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);

            if (boat == null)
            {
                return NotFound();
            }

            boat.BoatName = updateBoatDto.BoatName;
            boat.SailNumber = updateBoatDto.SailNumber;
            boat.MakeModel = updateBoatDto.MakeModel;
            boat.DefaultRating = updateBoatDto.DefaultRating;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BoatExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/boats/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoat(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
            if (boat == null)
            {
                return NotFound();
            }

            // Optional: Prevent deletion if there are active entries. 
            // EF Core will likely block this due to Restrict cascade delete on Entry,
            // but handling it gracefully here provides a better API response.
            var hasEntries = await _context.Entries.AnyAsync(e => e.BoatId == id);
            if (hasEntries)
            {
                return BadRequest("Cannot delete a boat that is currently entered in a regatta.");
            }

            _context.Boats.Remove(boat);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BoatExists(int id)
        {
            return _context.Boats.Any(e => e.Id == id);
        }
    }
}
