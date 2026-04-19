using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user, Guid? organizationId = null, string role = null);
    }
}