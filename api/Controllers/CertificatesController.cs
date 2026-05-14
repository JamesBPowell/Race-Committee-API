using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;
using RaceCommittee.Api.Services;
using System.Security.Claims;

namespace RaceCommittee.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/boats/{boatId}/certificates")]
    public class CertificatesController : ControllerBase
    {
        private readonly ICertificatesService _certificatesService;

        public CertificatesController(ICertificatesService certificatesService)
        {
            _certificatesService = certificatesService;
        }

        private string? GetCurrentUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        // GET: api/boats/{boatId}/certificates
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CertificateDto>>> GetCertificates(int boatId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var certificates = await _certificatesService.GetCertificatesForBoatAsync(boatId, userId);
            return Ok(certificates);
        }

        // GET: api/boats/{boatId}/certificates/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CertificateDto>> GetCertificate(int boatId, int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var cert = await _certificatesService.GetCertificateAsync(id, userId);
            if (cert == null) return NotFound();

            return Ok(cert);
        }

        // POST: api/boats/{boatId}/certificates — Manual entry (PHRF)
        [HttpPost]
        public async Task<ActionResult<CertificateDto>> CreateCertificate(int boatId, CreateCertificateManualDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var cert = await _certificatesService.CreateCertificateManualAsync(boatId, dto, userId);
                return CreatedAtAction(nameof(GetCertificate), new { boatId, id = cert.Id }, cert);
            }
            catch (UnauthorizedAccessException)
            {
                return NotFound();
            }
        }

        // POST: api/boats/{boatId}/certificates/import — Import from regattaman URL (ORR/ORREZ)
        [HttpPost("import")]
        public async Task<ActionResult<CertificateDto>> ImportCertificate(int boatId, ImportCertificateDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var cert = await _certificatesService.ImportCertificateAsync(boatId, dto, userId);
                return CreatedAtAction(nameof(GetCertificate), new { boatId, id = cert.Id }, cert);
            }
            catch (UnauthorizedAccessException)
            {
                return NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/boats/{boatId}/certificates/{id}/upload — Upload PDF file
        [HttpPost("{id}/upload")]
        public async Task<ActionResult<CertificateDto>> UploadFile(int boatId, int id, IFormFile file)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var cert = await _certificatesService.UploadFileAsync(boatId, id, file, userId);
                if (cert == null) return NotFound();
                return Ok(cert);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/boats/{boatId}/certificates/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCertificate(int boatId, int id, UpdateCertificateDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var success = await _certificatesService.UpdateCertificateAsync(id, dto, userId);
            if (!success) return NotFound();

            return NoContent();
        }

        // DELETE: api/boats/{boatId}/certificates/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCertificate(int boatId, int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _certificatesService.DeleteCertificateAsync(id, userId);

            if (!result.Success)
            {
                if (result.ErrorMessage == "Certificate not found.")
                    return NotFound();
                return BadRequest(new { message = result.ErrorMessage });
            }

            return NoContent();
        }

        // POST: api/boats/{boatId}/certificates/{id}/refresh
        [HttpPost("{id}/refresh")]
        public async Task<ActionResult<CertificateDto>> RefreshCertificate(int boatId, int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var cert = await _certificatesService.RefreshFromSourceAsync(id, userId);
            if (cert == null) return NotFound();

            return Ok(cert);
        }

        // GET: api/boats/{boatId}/certificates/{id}/download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadFile(int boatId, int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (stream, contentType, fileName) = await _certificatesService.GetFileDownloadAsync(id, userId);
            if (stream == null) return NotFound();

            return File(stream, contentType ?? "application/octet-stream", fileName);
        }

        // GET: api/boats/{boatId}/certificates/{id}/mhtml
        [HttpGet("{id}/mhtml")]
        [AllowAnonymous] // Ideally check if user has access to regatta or boat, but simplified for now
        public async Task<IActionResult> DownloadMhtml(int boatId, int id)
        {
            var userId = GetCurrentUserId(); // We might not have a userId if we use AllowAnonymous, but the service handles it by just checking if the cert exists.
            
            var (stream, contentType, fileName) = await _certificatesService.GetMhtmlAsync(id, userId ?? string.Empty);
            if (stream == null) return NotFound();

            // Use inline to allow opening in browser preview if supported
            Response.Headers.Append("Content-Disposition", $"inline; filename={fileName}");
            return File(stream, contentType ?? "message/rfc822");
        }
    }

    // Separate controller for cert search (not boat-scoped)
    [Authorize]
    [ApiController]
    [Route("api/certificates")]
    public class CertificateSearchController : ControllerBase
    {
        private readonly ICertificateListService _listService;
        private readonly ICertificatesService _certificatesService;

        public CertificateSearchController(ICertificateListService listService, ICertificatesService certificatesService)
        {
            _listService = listService;
            _certificatesService = certificatesService;
        }

        // GET: api/certificates/search?type=ORR&query=geronimo
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<CertificateSearchResultDto>>> Search(
            [FromQuery] string type,
            [FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Both 'type' and 'query' parameters are required." });

            var results = await _listService.SearchAsync(type, query);
            return Ok(results);
        }
    
        // POST: api/certificates/reparse-all
        [HttpPost("reparse-all")]
        public async Task<ActionResult<object>> ReparseAll()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            
            // This could be restricted to admins, but for now we'll allow committee members or just leave it open to authorized users
            var count = await _certificatesService.ReparseAllCertificatesAsync();
            return Ok(new { count });
        }
    }
}
