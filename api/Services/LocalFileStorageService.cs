namespace RaceCommittee.Api.Services
{
    /// <summary>
    /// Development fallback file storage service that stores files to the local filesystem.
    /// Used when no Azure Storage connection string is configured.
    /// </summary>
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;

        public LocalFileStorageService(string basePath = "wwwroot/uploads")
        {
            _basePath = basePath;
        }

        public async Task<string> UploadAsync(string container, string blobPath, Stream file, string contentType)
        {
            var fullPath = Path.Combine(_basePath, container, blobPath);
            var directory = Path.GetDirectoryName(fullPath)!;
            Directory.CreateDirectory(directory);

            using var fileStream = File.Create(fullPath);
            await file.CopyToAsync(fileStream);

            return blobPath;
        }

        public async Task<Stream?> DownloadAsync(string container, string blobPath)
        {
            var fullPath = Path.Combine(_basePath, container, blobPath);
            if (!File.Exists(fullPath))
                return null;

            var memoryStream = new MemoryStream();
            using var fileStream = File.OpenRead(fullPath);
            await fileStream.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            return memoryStream;
        }

        public Task<string> GetDownloadUrlAsync(string container, string blobPath, TimeSpan expiry)
        {
            // In local dev, return a relative path — the file can be served as static content
            return Task.FromResult($"/uploads/{container}/{blobPath}");
        }

        public Task DeleteAsync(string container, string blobPath)
        {
            var fullPath = Path.Combine(_basePath, container, blobPath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.CompletedTask;
        }
    }
}
