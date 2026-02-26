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
    public class FleetsController : ControllerBase
    {
        private readonly IFleetsService _fleetsService;

        public FleetsController(IFleetsService fleetsService)
        {
            _fleetsService = fleetsService;
        }

        // POST api/fleets/regatta/5
        [HttpPost("regatta/{regattaId}")]
        public async Task<IActionResult> CreateFleet(int regattaId, [FromBody] CreateFleetDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var fleet = await _fleetsService.CreateFleetAsync(regattaId, dto, userId);
                return Ok(fleet);
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

        // PUT api/fleets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFleet(int id, [FromBody] UpdateFleetDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var fleet = await _fleetsService.UpdateFleetAsync(id, dto, userId);
                return Ok(fleet);
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

        // DELETE api/fleets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFleet(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var success = await _fleetsService.DeleteFleetAsync(id, userId);
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
