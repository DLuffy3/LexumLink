using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Services;
using BCrypt.Net;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPlatformSettingsService _settingsService;

        public AuthController(LexumLinkDbContext context, IJwtService jwtService, IPlatformSettingsService settingsService)
        {
            _context = context;
            _jwtService = jwtService;
            _settingsService = settingsService;
        }

        [HttpPost("signin")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Organization)  // Include the navigation property, not the foreign key
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null && !user.IsActive)
                return Unauthorized(new { error = "This account has been deactivated. Contact your administrator." });

            if (user != null && user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
            {
                var minutesLeft = Math.Ceiling((user.LockedUntil.Value - DateTime.UtcNow).TotalMinutes);
                return StatusCode(423, new { error = $"Too many failed attempts. Try again in {minutesLeft} minute(s)." });
            }

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                if (user != null)
                {
                    var settings = await _settingsService.GetAsync();
                    user.FailedLoginAttempts += 1;
                    if (user.FailedLoginAttempts >= settings.MaxLoginAttempts)
                    {
                        user.LockedUntil = DateTime.UtcNow.AddMinutes(settings.LockoutDurationMinutes);
                        user.FailedLoginAttempts = 0;
                    }
                    await _context.SaveChangesAsync();
                }
                return Unauthorized(new { error = "Invalid credentials" });
            }

            if (user.FailedLoginAttempts != 0 || user.LockedUntil.HasValue)
            {
                user.FailedLoginAttempts = 0;
                user.LockedUntil = null;
                await _context.SaveChangesAsync();
            }

            var token = _jwtService.GenerateToken(user, user.OrganizationId, "user");

            var orgDto = user.Organization == null ? null : new
            {
                user.Organization.Id,
                user.Organization.Name,
                user.Organization.CreatedAt
                // Do not include Users collection
            };

            return Ok(new
            {
                user = new { user.Id, user.Email, user.FirstName, user.LastName, user.IsSuperAdmin },
                token,
                organization = orgDto,
                hasOrganization = user.OrganizationId.HasValue && user.OrganizationId != Guid.Empty
            });
        }

        [HttpGet("hash")]
        [AllowAnonymous]
        public IActionResult GetHash(string password)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            return Ok(new { hash });
        }

        [HttpGet("organization")]
        [Authorize]
        public async Task<IActionResult> GetUserOrganization()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var orgDto = user?.Organization == null ? null : new
            {
                user.Organization.Id,
                user.Organization.Name,
                user.Organization.CreatedAt
            };
            return Ok(new { organization = orgDto });
        }
    }

    public class SignInRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
}