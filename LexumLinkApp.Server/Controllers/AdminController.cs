using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IJwtService _jwtService;

        public AdminController(LexumLinkDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { error = "Email already exists" });

            Guid orgId;
            if (request.CreateNewOrganization && !string.IsNullOrWhiteSpace(request.NewOrganizationName))
            {
                var newOrg = new Organization { Name = request.NewOrganizationName };
                _context.Organizations.Add(newOrg);
                await _context.SaveChangesAsync();
                orgId = newOrg.Id;
            }
            else if (request.ExistingOrganizationId.HasValue)
            {
                orgId = request.ExistingOrganizationId.Value;
                var exists = await _context.Organizations.AnyAsync(o => o.Id == orgId);
                if (!exists) return BadRequest(new { error = "Organization does not exist" });
            }
            else
            {
                return BadRequest(new { error = "Must select or create an organization" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                OrganizationId = orgId,
                IsSuperAdmin = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User created", userId = user.Id });
        }
    }

    public class CreateUserRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public bool CreateNewOrganization { get; set; }
        public string? NewOrganizationName { get; set; }
        public Guid? ExistingOrganizationId { get; set; }
    }
}