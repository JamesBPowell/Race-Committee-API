using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
namespace RaceCommittee.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RegattasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RegattasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/regattas
        [HttpPost]
        public async Task<IActionResult> CreateRegatta([FromBody] CreateRegattaDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var regatta = new Regatta
            {
                Name = dto.Name,
                Organization = dto.Organization,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Location = dto.Location,
                Status = "Upcoming",
                Slug = GenerateSlug(dto.Name)
            };

            _context.Regattas.Add(regatta);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRegatta), new { id = regatta.Id }, regatta);
        }

        // GET: api/regattas
        [HttpGet]
        public async Task<IActionResult> GetRegattas()
        {
            var regattas = await _context.Regattas.ToListAsync();
            return Ok(regattas);
        }

        // GET: api/regattas/joined
        [HttpGet("joined")]
        public async Task<IActionResult> GetJoinedRegattas()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var regattas = await _context.Entries
                .Include(e => e.Boat)
                .Include(e => e.Regatta)
                .Where(e => e.Boat.OwnerId == userId)
                .Select(e => e.Regatta)
                .Distinct()
                .ToListAsync();

            return Ok(regattas);
        }

        // GET: api/regattas/5
        // Required for CreatedAtAction to work correctly, even if we don't fully implement it yet
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRegatta(int id)
        {
            var regatta = await _context.Regattas.FindAsync(id);

            if (regatta == null)
            {
                return NotFound();
            }

            return Ok(regatta);
        }

        // POST: api/regattas/{id}/entries
        [HttpPost("{id}/entries")]
        public async Task<IActionResult> JoinRegatta(int id, [FromBody] JoinRegattaDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Verify Boat exists and belongs to the user
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == dto.BoatId && b.OwnerId == userId);
            if (boat == null)
            {
                return BadRequest("Invalid boat selected or boat does not belong to you.");
            }

            // Verify Regatta exists
            var regatta = await _context.Regattas.FindAsync(id);
            if (regatta == null)
            {
                return NotFound("Regatta not found.");
            }

            // Check if already entered
            var existingEntry = await _context.Entries.FirstOrDefaultAsync(e => e.RegattaId == id && e.BoatId == dto.BoatId);
            if (existingEntry != null)
            {
                return BadRequest("This boat is already entered in this regatta.");
            }

            var entry = new Entry
            {
                RegattaId = id,
                BoatId = dto.BoatId,
                RegistrationStatus = "Pending"
            };

            _context.Entries.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(entry);
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
