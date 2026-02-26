using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RaceCommittee.Api.Models.DTOs;
using RaceCommittee.Api.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RaceCommittee.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RacesController : ControllerBase
    {
        private readonly IRacesService _racesService;

        public RacesController(IRacesService racesService)
        {
            _racesService = racesService;
        }

        // PUT api/races/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRace(int id, [FromBody] UpdateRaceDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var race = await _racesService.UpdateRaceAsync(id, dto, userId);
                return Ok(race);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // DELETE api/races/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRace(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var success = await _racesService.DeleteRaceAsync(id, userId);
                if (!success) return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
    }
}
