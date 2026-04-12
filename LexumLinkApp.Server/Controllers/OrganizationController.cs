using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Controllers
{
    public class OrganizationsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;
        public OrganizationsController(LexumLinkDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetOrganizations()
        {
            var userId = GetUserId();
            var orgs = await _context.OrganizationMemberships
                .Where(om => om.UserId == userId)
                .Include(om => om.Organization)
                .Select(om => om.Organization)
                .ToListAsync();
            return Ok(orgs);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrganization([FromBody] CreateOrgRequest request)
        {
            var userId = GetUserId();
            var org = new Organization { Name = request.Name };
            _context.Organizations.Add(org);
            await _context.SaveChangesAsync();

            var membership = new OrganizationMembership
            {
                UserId = userId,
                OrganizationId = org.Id,
                Role = "admin"
            };
            _context.OrganizationMemberships.Add(membership);
            await _context.SaveChangesAsync();

            var orgDto = new OrganizationDto { Id = org.Id, Name = org.Name, CreatedAt = org.CreatedAt };
            return Ok(orgDto);
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetMembers(Guid id)
        {
            var orgId = GetOrganizationId();
            if (orgId != id) return Forbid();
            var members = await _context.OrganizationMemberships
                .Where(om => om.OrganizationId == id)
                .Include(om => om.User)
                .Select(om => new { om.User.Id, om.User.Email, om.User.FirstName, om.User.LastName, om.Role })
                .ToListAsync();
            return Ok(members);
        }
    }

    public class CreateOrgRequest { public string Name { get; set; } = ""; }
}