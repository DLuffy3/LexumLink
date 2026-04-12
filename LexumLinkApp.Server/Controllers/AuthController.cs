using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using BCrypt;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace LexumLinkApp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(LexumLinkDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("signup")]
        [AllowAnonymous]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
        {
            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { error = "Email already exists" });

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // After signup, no organization yet – user must create or join one
            var token = GenerateJwtToken(user, null);
            return Ok(new { user, token, hasOrganizations = false });
        }

        [HttpPost("signin")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { error = "Invalid credentials" });

            var organizations = await _context.OrganizationMemberships
                .Where(om => om.UserId == user.Id)
                .Select(om => om.Organization)
                .ToListAsync();

            // If user belongs to at least one organization, we still don't set org in token until they choose one
            var token = GenerateJwtToken(user, null);
            return Ok(new { user, token, organizations, hasOrganizations = organizations.Any() });
        }

        [HttpGet("organizations")]
        [Authorize]
        public async Task<IActionResult> GetUserOrganizations()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var orgs = await _context.OrganizationMemberships
                .Where(om => om.UserId == userId)
                .Include(om => om.Organization)
                .Select(om => new { om.Organization.Id, om.Organization.Name, om.Role })
                .ToListAsync();
            return Ok(orgs);
        }

        [HttpPost("switch-organization")]
        [Authorize]
        public async Task<IActionResult> SwitchOrganization([FromBody] SwitchOrgRequest request)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var membership = await _context.OrganizationMemberships
                .FirstOrDefaultAsync(om => om.UserId == userId && om.OrganizationId == request.OrganizationId);
            if (membership == null)
                return Forbid("You are not a member of this organization");

            var user = await _context.Users.FindAsync(userId);
            var token = GenerateJwtToken(user, request.OrganizationId, membership.Role);
            return Ok(new { token });
        }

        private string GenerateJwtToken(User user, Guid? organizationId, string role = null)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? "")
            };

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
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class SignUpRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string FirstName { get; set; } = ""; public string LastName { get; set; } = ""; }
    public class SignInRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
    public class SwitchOrgRequest { public Guid OrganizationId { get; set; } }
}