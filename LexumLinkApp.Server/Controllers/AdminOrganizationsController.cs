using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    // Cross-organization admin endpoints for editing organizations (plan/limits/status).
    // Kept separate from OrganizationsController, which handles a signed-in user creating
    // and switching into their own new organization — a different concern.
    [Authorize]
    [ApiController]
    [Route("api/admin/organizations")]
    public class AdminOrganizationsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        public AdminOrganizationsController(LexumLinkDbContext context) => _context = context;

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        // GET: api/admin/organizations
        [HttpGet]
        public async Task<IActionResult> GetOrganizations()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var orgs = await _context.Organizations
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Plan,
                    o.MaxUsers,
                    o.MaxClients,
                    o.StorageLimitGb,
                    o.IsActive,
                    o.CreatedAt,
                    UserCount = o.Users.Count,
                    ClientCount = o.Clients.Count
                })
                .ToListAsync();

            return Ok(orgs);
        }

        // GET: api/admin/organizations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrganization(Guid id)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var org = await _context.Organizations
                .Where(o => o.Id == id)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Plan,
                    o.MaxUsers,
                    o.MaxClients,
                    o.StorageLimitGb,
                    o.IsActive,
                    o.CreatedAt,
                    UserCount = o.Users.Count,
                    ClientCount = o.Clients.Count
                })
                .FirstOrDefaultAsync();

            if (org == null) return NotFound();
            return Ok(org);
        }

        // POST: api/admin/organizations — create a standalone organization (no user attached).
        // Useful for a "custom" customer that needs several organizations set up ahead of
        // assigning their people into each one from the Users page.
        [HttpPost]
        public async Task<IActionResult> CreateOrganization([FromBody] UpdateOrganizationRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Organization name is required" });

            var org = new Organization
            {
                Name = request.Name,
                Plan = request.Plan,
                MaxUsers = request.MaxUsers,
                MaxClients = request.MaxClients,
                StorageLimitGb = request.StorageLimitGb,
                IsActive = request.IsActive
            };

            _context.Organizations.Add(org);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Organization created", organizationId = org.Id });
        }

        // PUT: api/admin/organizations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrganization(Guid id, [FromBody] UpdateOrganizationRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var org = await _context.Organizations.FindAsync(id);
            if (org == null) return NotFound();

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Organization name is required" });

            org.Name = request.Name;
            org.Plan = request.Plan;
            org.MaxUsers = request.MaxUsers;
            org.MaxClients = request.MaxClients;
            org.StorageLimitGb = request.StorageLimitGb;
            org.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Organization updated" });
        }
    }

    public class UpdateOrganizationRequest
    {
        public string Name { get; set; } = "";
        public string Plan { get; set; } = "starter";
        public int MaxUsers { get; set; } = 1;
        public int? MaxClients { get; set; }
        public int StorageLimitGb { get; set; } = 5;
        public bool IsActive { get; set; } = true;
    }
}
