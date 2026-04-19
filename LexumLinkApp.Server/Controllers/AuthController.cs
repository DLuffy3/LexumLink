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

        public AuthController(LexumLinkDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        [HttpPost("signin")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Organization)  // Include the navigation property, not the foreign key
                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { error = "Invalid credentials" });

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