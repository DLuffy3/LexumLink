using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace LexumLinkApp.Server.Services
{
    public class PlatformSettingsService : IPlatformSettingsService
    {
        private readonly LexumLinkDbContext _context;
        public PlatformSettingsService(LexumLinkDbContext context) => _context = context;

        public async Task<PlatformSettings> GetAsync()
        {
            var settings = await _context.PlatformSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new PlatformSettings { Id = Guid.NewGuid() };
                _context.PlatformSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }
    }
}
