using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace LexumLinkApp.Server.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _config;
        private readonly LexumLinkDbContext _context;
        public JwtService(IConfiguration config, LexumLinkDbContext context)
        {
            _config = config;
            _context = context;
        }

        public string GenerateToken(User user, Guid? organizationId = null, string role = null)
        {
            // Token lifetime comes from PlatformSettings (editable on the Super Admin
            // Settings page) so it can change without a redeploy. Read synchronously
            // (and get-or-create the settings row) since this method isn't async and
            // is only called a couple of times per request at most.
            var settings = _context.PlatformSettings.FirstOrDefault();
            if (settings == null)
            {
                settings = new PlatformSettings { Id = Guid.NewGuid() };
                _context.PlatformSettings.Add(settings);
                _context.SaveChanges();
            }
            var sessionTimeoutMinutes = settings.SessionTimeoutMinutes > 0 ? settings.SessionTimeoutMinutes : 10080;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? "")
            };

            claims.Add(new Claim("isSuperAdmin", user.IsSuperAdmin.ToString().ToLower()));

            if (organizationId.HasValue)
            {
                claims.Add(new Claim("orgId", organizationId.Value.ToString()));
                if (!string.IsNullOrEmpty(role))
                    claims.Add(new Claim("role", role));
            }

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(sessionTimeoutMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}