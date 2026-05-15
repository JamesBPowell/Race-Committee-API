using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class CertificatesService : ICertificatesService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly ICertificateParserService _parser;
        private readonly IPlaywrightMhtmlService _mhtmlService;
        private const string CertificatesContainer = "certificates";
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
        private static readonly string[] AllowedContentTypes = ["application/pdf", "image/jpeg", "image/png"];

        public CertificatesService(
            ApplicationDbContext context,
            IFileStorageService fileStorage,
            ICertificateParserService parser,
            IPlaywrightMhtmlService mhtmlService)
        {
            _context = context;
            _fileStorage = fileStorage;
            _parser = parser;
            _mhtmlService = mhtmlService;
        }

        public async Task<IEnumerable<CertificateDto>> GetCertificatesForBoatAsync(int boatId, string userId)
        {
            // Verify ownership
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == boatId && b.OwnerId == userId);
            if (boat == null) return Enumerable.Empty<CertificateDto>();

            return await _context.Certificates
                .Where(c => c.BoatId == boatId)
                .Select(c => MapToDto(c))
                .ToListAsync();
        }

        public async Task<CertificateDto?> GetCertificateAsync(int id, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == id && c.Boat.OwnerId == userId);

            if (cert == null) return null;

            var dto = MapToDto(cert);

            // Generate download URL if file exists
            if (cert.BlobPath != null)
            {
                dto.FileDownloadUrl = await _fileStorage.GetDownloadUrlAsync(
                    CertificatesContainer, cert.BlobPath, TimeSpan.FromMinutes(15));
            }

            return dto;
        }

        public async Task<CertificateDto> CreateCertificateManualAsync(int boatId, CreateCertificateManualDto dto, string userId)
        {
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == boatId && b.OwnerId == userId);
            if (boat == null) throw new UnauthorizedAccessException("Boat not found or access denied.");

            var cert = new Certificate
            {
                BoatId = boatId,
                CertificateType = dto.CertificateType,
                CertificateNumber = dto.CertificateNumber ?? string.Empty,
                IssueDate = dto.IssueDate,
                ValidUntil = dto.ValidUntil,
                RatingSpinnaker = dto.RatingSpinnaker,
                RatingNonSpinnaker = dto.RatingNonSpinnaker,
                ParseStatus = "Manual",
                SchemaVersion = CertificateSchemas.CurrentPhrf,
                RawData = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, object?>
                {
                    ["certificateNumber"] = dto.CertificateNumber,
                    ["baseRatingSpinnaker"] = dto.RatingSpinnaker,
                    ["baseRatingNonSpinnaker"] = dto.RatingNonSpinnaker,
                    ["schemaVersion"] = CertificateSchemas.CurrentPhrf
                })
            };

            _context.Certificates.Add(cert);
            await _context.SaveChangesAsync();

            return MapToDto(cert);
        }

        public async Task<CertificateDto> ImportCertificateAsync(int boatId, ImportCertificateDto dto, string userId)
        {
            var boat = await _context.Boats.FirstOrDefaultAsync(b => b.Id == boatId && b.OwnerId == userId);
            if (boat == null) throw new UnauthorizedAccessException("Boat not found or access denied.");

            // Validate URL pattern
            if (!dto.SourceUrl.Contains("regattaman.com/cert_form.php"))
                throw new ArgumentException("Invalid certificate URL. Expected a regattaman.com certificate URL.");

            // Extract SKU from URL
            var uri = new Uri(dto.SourceUrl);
            var sku = System.Web.HttpUtility.ParseQueryString(uri.Query)["sku"] ?? string.Empty;

            // Parse the certificate
            var schemaVersion = dto.CertificateType.ToUpperInvariant() == "ORR"
                ? CertificateSchemas.CurrentOrr
                : CertificateSchemas.CurrentOrrEz;

            ParsedCertificateData? parsed = null;
            string parseStatus = "Pending";
            string? parseErrors = null;

            try
            {
                parsed = await _parser.ParseFromUrlAsync(dto.SourceUrl, dto.CertificateType);
                parseStatus = "Success";
            }
            catch (Exception ex)
            {
                parseStatus = "Failed";
                parseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
            }

            var cert = new Certificate
            {
                BoatId = boatId,
                CertificateType = dto.CertificateType.ToUpperInvariant(),
                CertificateNumber = parsed?.CertificateNumber ?? string.Empty,
                IssueDate = parsed?.IssueDate,
                ValidUntil = parsed?.ExpirationDate,
                RatingSpinnaker = parsed?.RatingSpinnaker,
                RatingNonSpinnaker = parsed?.RatingNonSpinnaker,
                RatingType = parsed?.RatingType ?? "SecondsPerMile",
                NormalizedToD = parsed?.NormalizedToD,
                Configuration = parsed?.Configuration,
                RawData = parsed?.RawDataJson ?? "{}",
                SourceUrl = dto.SourceUrl,
                SourceSku = sku,
                ParseStatus = parseStatus,
                ParseErrors = parseErrors,
                SchemaVersion = schemaVersion
            };

            _context.Certificates.Add(cert);
            await _context.SaveChangesAsync();

            // Try to capture print-view HTML snapshot
            try
            {
                var htmlBytes = await _mhtmlService.CapturePrintHtmlAsync(dto.SourceUrl);
                var filename = $"cert_{cert.Id}.html";
                var blobPath = $"{boatId}/{cert.Id}/{filename}";
                
                using var stream = new MemoryStream(htmlBytes);
                await _fileStorage.UploadAsync(CertificatesContainer, blobPath, stream, "text/html");
                
                cert.SourceContentPath = blobPath;
                await _context.SaveChangesAsync();
            }
            catch (TimeoutException ex)
            {
                // Throw so the frontend displays the busy message
                throw new Exception("Service is busy, please retry in a short while.");
            }
            catch (Exception ex)
            {
                cert.ParseStatus = "Failed";
                cert.ParseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { "Failed to capture snapshot: " + ex.Message });
                await _context.SaveChangesAsync();
            }

            return MapToDto(cert);
        }

        public async Task<CertificateDto?> UploadFileAsync(int boatId, int certId, IFormFile file, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == certId && c.BoatId == boatId && c.Boat.OwnerId == userId);

            if (cert == null) return null;

            // Validate file
            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException($"File too large. Maximum size is {MaxFileSizeBytes / 1024 / 1024}MB.");

            if (!AllowedContentTypes.Contains(file.ContentType))
                throw new ArgumentException($"Invalid file type. Allowed types: PDF, JPEG, PNG.");

            // Delete old file if exists
            if (cert.BlobPath != null)
                await _fileStorage.DeleteAsync(CertificatesContainer, cert.BlobPath);

            // Upload new file
            var blobPath = $"{boatId}/{certId}/{file.FileName}";
            using var stream = file.OpenReadStream();
            await _fileStorage.UploadAsync(CertificatesContainer, blobPath, stream, file.ContentType);

            // Update cert record
            cert.FileName = file.FileName;
            cert.BlobPath = blobPath;
            cert.ContentType = file.ContentType;
            cert.FileSizeBytes = file.Length;
            cert.FileUploadedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(cert);
        }

        public async Task<bool> UpdateCertificateAsync(int id, UpdateCertificateDto dto, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == id && c.Boat.OwnerId == userId);

            if (cert == null) return false;

            if (dto.CertificateNumber != null) cert.CertificateNumber = dto.CertificateNumber;
            if (dto.IssueDate.HasValue) cert.IssueDate = dto.IssueDate;
            if (dto.ValidUntil.HasValue) cert.ValidUntil = dto.ValidUntil;
            if (dto.RatingSpinnaker.HasValue) cert.RatingSpinnaker = dto.RatingSpinnaker;
            if (dto.RatingNonSpinnaker.HasValue) cert.RatingNonSpinnaker = dto.RatingNonSpinnaker;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string ErrorMessage)> DeleteCertificateAsync(int id, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == id && c.Boat.OwnerId == userId);

            if (cert == null) return (false, "Certificate not found.");

            // Check if any entries reference this certificate
            var hasEntries = await _context.Entries.AnyAsync(e => e.ActiveCertificateId == id);
            if (hasEntries)
                return (false, "Cannot delete a certificate that is referenced by a regatta entry.");

            // Delete blob if exists
            if (cert.BlobPath != null)
                await _fileStorage.DeleteAsync(CertificatesContainer, cert.BlobPath);

            _context.Certificates.Remove(cert);
            await _context.SaveChangesAsync();

            return (true, string.Empty);
        }

        public async Task<CertificateDto?> RefreshFromSourceAsync(int id, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == id && c.Boat.OwnerId == userId);

            if (cert == null || cert.SourceUrl == null)
                return null;

            try
            {
                var parsed = await _parser.ParseFromUrlAsync(cert.SourceUrl, cert.CertificateType);

                cert.CertificateNumber = parsed.CertificateNumber;
                cert.IssueDate = parsed.IssueDate;
                cert.ValidUntil = parsed.ExpirationDate;
                cert.RatingSpinnaker = parsed.RatingSpinnaker;
                cert.RatingNonSpinnaker = parsed.RatingNonSpinnaker;
                cert.RatingType = parsed.RatingType;
                cert.NormalizedToD = parsed.NormalizedToD;
                cert.Configuration = parsed.Configuration;
                cert.RawData = parsed.RawDataJson;
                cert.ParseStatus = "Success";
                cert.ParseErrors = null;
                cert.SchemaVersion = parsed.SchemaVersion;

                await _context.SaveChangesAsync();

                // Try to capture print-view HTML snapshot
                try
                {
                    var htmlBytes = await _mhtmlService.CapturePrintHtmlAsync(cert.SourceUrl);
                    var filename = $"cert_{cert.Id}.html";
                    var blobPath = $"{cert.BoatId}/{cert.Id}/{filename}";
                    
                    using var stream = new MemoryStream(htmlBytes);
                    await _fileStorage.UploadAsync(CertificatesContainer, blobPath, stream, "text/html");
                    
                    cert.SourceContentPath = blobPath;
                    await _context.SaveChangesAsync();
                }
                catch (TimeoutException)
                {
                    throw new Exception("Service is busy, please retry in a short while.");
                }
                catch (Exception ex)
                {
                    cert.ParseStatus = "Failed";
                    cert.ParseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { "Failed to capture snapshot: " + ex.Message });
                    await _context.SaveChangesAsync();
                }

                return MapToDto(cert);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Service is busy")) throw; // Bubble up busy message

                cert.ParseStatus = "Failed";
                cert.ParseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
                await _context.SaveChangesAsync();
                return MapToDto(cert);
            }
        }

        public async Task<(Stream? FileStream, string? ContentType, string? FileName)> GetFileDownloadAsync(int id, string userId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Boat)
                .FirstOrDefaultAsync(c => c.Id == id && c.Boat.OwnerId == userId);

            if (cert?.BlobPath == null) return (null, null, null);

            var stream = await _fileStorage.DownloadAsync(CertificatesContainer, cert.BlobPath);
            return (stream, cert.ContentType, cert.FileName);
        }

        public async Task<(Stream? FileStream, string? ContentType, string? FileName)> GetMhtmlAsync(int id, string userId)
        {
            var cert = await _context.Certificates.FirstOrDefaultAsync(c => c.Id == id);

            if (cert?.SourceContentPath == null) return (null, null, null);

            var stream = await _fileStorage.DownloadAsync(CertificatesContainer, cert.SourceContentPath);
            return (stream, "text/html", $"cert_{cert.Id}.html");
        }
    
        public async Task<int> ReparseAllCertificatesAsync()
        {
            var certificates = await _context.Certificates
                .Where(c => !string.IsNullOrEmpty(c.SourceUrl))
                .ToListAsync();
            
            int count = 0;
            foreach (var cert in certificates)
            {
                try
                {
                    var parsed = await _parser.ParseFromUrlAsync(cert.SourceUrl!, cert.CertificateType);
                    UpdateCertificateFromParsedData(cert, parsed);
                    
                    // Capture print-view HTML snapshot if missing
                    if (string.IsNullOrEmpty(cert.SourceContentPath))
                    {
                        try
                        {
                            var htmlBytes = await _mhtmlService.CapturePrintHtmlAsync(cert.SourceUrl!);
                            var filename = $"cert_{cert.Id}.html";
                            var blobPath = $"{cert.BoatId}/{cert.Id}/{filename}";
                            using var stream = new MemoryStream(htmlBytes);
                            await _fileStorage.UploadAsync(CertificatesContainer, blobPath, stream, "text/html");
                            cert.SourceContentPath = blobPath;
                        }
                        catch { /* ignore capture failures */ }
                    }
                    
                    count++;
                }
                catch (Exception ex)
                {
                    cert.ParseStatus = "Failed";
                    cert.ParseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
                }
            }
            
            await _context.SaveChangesAsync();
            return count;
        }

        public async Task<int> ReparseFromSnapshotsAsync()
        {
            var certificates = await _context.Certificates
                .Where(c => !string.IsNullOrEmpty(c.SourceContentPath))
                .ToListAsync();
            
            int count = 0;
            foreach (var cert in certificates)
            {
                try
                {
                    using var stream = await _fileStorage.DownloadAsync(CertificatesContainer, cert.SourceContentPath!);
                    using var reader = new StreamReader(stream);
                    var html = await reader.ReadToEndAsync();
                    
                    var parsed = await _parser.ParseFromHtmlAsync(html, cert.CertificateType);
                    UpdateCertificateFromParsedData(cert, parsed);
                    
                    count++;
                }
                catch (Exception ex)
                {
                    cert.ParseStatus = "Failed";
                    cert.ParseErrors = System.Text.Json.JsonSerializer.Serialize(new[] { "Reparse from snapshot failed: " + ex.Message });
                }
            }
            
            await _context.SaveChangesAsync();
            return count;
        }

        private void UpdateCertificateFromParsedData(Certificate cert, ParsedCertificateData parsed)
        {
            cert.CertificateNumber = parsed.CertificateNumber ?? cert.CertificateNumber;
            cert.IssueDate = parsed.IssueDate;
            cert.ValidUntil = parsed.ExpirationDate;
            cert.RatingSpinnaker = parsed.RatingSpinnaker;
            cert.RatingNonSpinnaker = parsed.RatingNonSpinnaker;
            cert.RatingType = parsed.RatingType;
            cert.NormalizedToD = parsed.NormalizedToD;
            cert.Configuration = parsed.Configuration;
            cert.RawData = parsed.RawDataJson;
            cert.ParseStatus = "Success";
            cert.ParseErrors = null;
            cert.SchemaVersion = parsed.SchemaVersion;
        }

        private static CertificateDto MapToDto(Certificate cert)
        {
            return new CertificateDto
            {
                Id = cert.Id,
                BoatId = cert.BoatId,
                CertificateType = cert.CertificateType,
                CertificateNumber = cert.CertificateNumber,
                IssueDate = cert.IssueDate,
                ValidUntil = cert.ValidUntil,
                RatingSpinnaker = cert.RatingSpinnaker,
                RatingNonSpinnaker = cert.RatingNonSpinnaker,
                RatingType = cert.RatingType,
                NormalizedToD = cert.NormalizedToD,
                Configuration = cert.Configuration,
                FileName = cert.FileName,
                HasFile = cert.BlobPath != null,
                SourceUrl = cert.SourceUrl,
                SourceContentPath = cert.SourceContentPath,
                ParseStatus = cert.ParseStatus,
                SchemaVersion = cert.SchemaVersion
            };
        }
    }
}
