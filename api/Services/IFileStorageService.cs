namespace RaceCommittee.Api.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(string container, string blobPath, Stream file, string contentType);
        Task<Stream?> DownloadAsync(string container, string blobPath);
        Task<string> GetDownloadUrlAsync(string container, string blobPath, TimeSpan expiry);
        Task DeleteAsync(string container, string blobPath);
    }
}
