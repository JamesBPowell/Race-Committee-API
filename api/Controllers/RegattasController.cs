using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using RaceCommittee.Api.Services;

namespace RaceCommittee.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RegattasController : ControllerBase
    {
        private readonly IRegattasService _regattasService;
        private readonly IRacesService _racesService;

        public RegattasController(IRegattasService regattasService, IRacesService racesService)
        {
            _regattasService = regattasService;
            _racesService = racesService;
        }

        // POST: api/regattas
        [HttpPost]
        public async Task<IActionResult> CreateRegatta([FromBody] CreateRegattaDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var regatta = await _regattasService.CreateRegattaAsync(dto, userId);

            return CreatedAtAction(nameof(GetRegatta), new { id = regatta.Id }, regatta);
        }

        // GET: api/regattas
        [HttpGet]
        public async Task<IActionResult> GetRegattas()
        {
            var regattas = await _regattasService.GetRegattasAsync();
            return Ok(regattas);
        }

        // GET: api/regattas/joined
        [HttpGet("joined")]
        public async Task<IActionResult> GetJoinedRegattas()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var regattas = await _regattasService.GetJoinedRegattasAsync(userId);
            return Ok(regattas);
        }

        // GET: api/regattas/managing
        [HttpGet("managing")]
        public async Task<IActionResult> GetManagingRegattas()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var regattas = await _regattasService.GetManagingRegattasAsync(userId);
            return Ok(regattas);
        }

        // GET: api/regattas/5
        // Required for CreatedAtAction to work correctly, even if we don't fully implement it yet
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRegatta(int id)
        {
            var regatta = await _regattasService.GetRegattaAsync(id);

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
            if (userId == null) return Unauthorized();

            var result = await _regattasService.JoinRegattaAsync(id, dto, userId);

            if (!result.Success)
            {
                if (result.ErrorMessage == "Regatta not found.")
                {
                    return NotFound(result.ErrorMessage);
                }
                return BadRequest(result.ErrorMessage);
            }

            return Ok(result.Entry);
        }

        // POST: api/regattas/{id}/races
        [HttpPost("{id}/races")]
        public async Task<IActionResult> CreateRace(int id, [FromBody] CreateRaceDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var race = await _racesService.CreateRaceAsync(id, dto, userId);
                return Ok(race);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (System.ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
