using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Services
{
    public interface IPlatformSettingsService
    {
        // Returns the single settings row, creating it with defaults on first access.
        Task<PlatformSettings> GetAsync();
    }
}
