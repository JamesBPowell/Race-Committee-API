using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Models;
using api.Models.DTOs;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using System.Security.Claims;

using RaceCommittee.Api.Services;

namespace api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BoatsController : ControllerBase
    {
        private readonly IBoatsService _boatsService;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoatsController(IBoatsService boatsService, UserManager<ApplicationUser> userManager)
        {
            _boatsService = boatsService;
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

            var boats = await _boatsService.GetBoatsAsync(userId);
            return Ok(boats);
        }

        // GET: api/boats/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BoatDto>> GetBoat(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var boat = await _boatsService.GetBoatAsync(id, userId);

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

            var boatDto = await _boatsService.CreateBoatAsync(createBoatDto, userId);

            return CreatedAtAction(nameof(GetBoat), new { id = boatDto.Id }, boatDto);
        }

        // PUT: api/boats/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBoat(int id, UpdateBoatDto updateBoatDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var success = await _boatsService.UpdateBoatAsync(id, updateBoatDto, userId);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/boats/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoat(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _boatsService.DeleteBoatAsync(id, userId);

            if (!result.Success)
            {
                if (result.ErrorMessage == "Boat not found.")
                {
                    return NotFound();
                }
                return BadRequest(result.ErrorMessage);
            }

            return NoContent();
        }
    }
}
