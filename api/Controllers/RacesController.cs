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
        private readonly IScoringService _scoringService;

        public RacesController(IRacesService racesService, IScoringService scoringService)
        {
            _racesService = racesService;
            _scoringService = scoringService;
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

        // POST api/races/5/finishes
        [HttpPost("{id}/finishes")]
        public async Task<IActionResult> SaveFinishes(int id, [FromBody] System.Collections.Generic.List<RecordFinishDto> finishes)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var success = await _racesService.SaveFinishesAsync(id, finishes, userId);
                if (!success) return NotFound();

                return Ok();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // POST api/races/5/score
        [HttpPost("{id}/score")]
        public async Task<IActionResult> ScoreRace(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Additional permission checks could be added here
            var results = await _scoringService.CalculateRaceScoresAsync(id);
            return Ok(results);
        }

        // GET api/races/5/results
        [HttpGet("{id}/results")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRaceResults(int id)
        {
            var results = await _scoringService.CalculateRaceScoresAsync(id);
            return Ok(results);
        }

        // POST api/races/5/score-test
        [HttpPost("{id}/score-test")]
        [AllowAnonymous]
        public async Task<IActionResult> ScoreRaceTest(int id)
        {
            try {
                var results = await _scoringService.CalculateRaceScoresAsync(id);
                return Ok(results);
            } catch (Exception ex) {
                return StatusCode(500, ex.ToString());
            }
        }
    }
}
