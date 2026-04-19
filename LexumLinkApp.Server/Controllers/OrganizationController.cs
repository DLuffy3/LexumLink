using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly LexumLinkDbContext _context;
    private readonly IJwtService _jwtService;

    public OrganizationsController(LexumLinkDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrganizations()
    {
        var orgs = await _context.Organizations.ToListAsync();
        return Ok(orgs);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrgRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var org = new Organization { Name = request.Name };
        _context.Organizations.Add(org);
        await _context.SaveChangesAsync();

        user.OrganizationId = org.Id;
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user, org.Id, "admin");
        return Ok(new { organization = org, token });
    }
    public class CreateOrgRequest
    {
        public string Name { get; set; } = "";
    }
}