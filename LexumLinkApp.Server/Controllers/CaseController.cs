using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.DTOs;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CasesController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;

        public CasesController(LexumLinkDbContext context)
        {
            _context = context;
        }

        private Guid GetOrganizationId()
        {
            var orgIdClaim = User.FindFirst("orgId")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim))
                throw new UnauthorizedAccessException("Organization not found in token.");
            return Guid.Parse(orgIdClaim);
        }

        // GET: api/cases
        [HttpGet]
        public async Task<IActionResult> GetCases()
        {
            var orgId = GetOrganizationId();
            var cases = await _context.Cases
                .Where(c => c.OrganizationId == orgId)
                .Include(c => c.Client)
                .Select(c => new CaseResponse
                {
                    Id = c.Id,
                    CaseNumber = c.CaseNumber,
                    ClientId = c.ClientId,
                    ClientName = c.Client.FirstName + " " + c.Client.LastName,
                    Status = c.Status,
                    IncidentDate = c.IncidentDate,
                    Description = c.Description,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(cases);
        }

        // GET: api/cases/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCase(Guid id)
        {
            var orgId = GetOrganizationId();
            var caseItem = await _context.Cases
                .Where(c => c.Id == id && c.OrganizationId == orgId)
                .Include(c => c.Client)
                .Select(c => new CaseResponse
                {
                    Id = c.Id,
                    CaseNumber = c.CaseNumber,
                    ClientId = c.ClientId,
                    ClientName = c.Client.FirstName + " " + c.Client.LastName,
                    Status = c.Status,
                    IncidentDate = c.IncidentDate,
                    Description = c.Description,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (caseItem == null)
                return NotFound(new { error = "Case not found" });

            return Ok(caseItem);
        }

        // POST: api/cases
        [HttpPost]
        public async Task<IActionResult> CreateCase([FromBody] CaseRequest request)
        {
            try
            {
                var orgId = GetOrganizationId();
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Verify client exists and belongs to the same organization
                var client = await _context.Clients
                    .FirstOrDefaultAsync(c => c.Id == request.ClientId && c.OrganizationId == orgId);
                if (client == null)
                    return BadRequest(new { error = "Client not found or does not belong to your organization." });

                // Check if case number already exists for this organization (optional)
                var existingCase = await _context.Cases
                    .FirstOrDefaultAsync(c => c.CaseNumber == request.CaseNumber && c.OrganizationId == orgId);
                if (existingCase != null)
                    return BadRequest(new { error = "Case number already exists in your organization." });

                var newCase = new Case
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    ClientId = request.ClientId,
                    CaseNumber = request.CaseNumber,
                    Status = request.Status ?? "open",
                    IncidentDate = request.IncidentDate?.ToUniversalTime(),
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Cases.Add(newCase);
                await _context.SaveChangesAsync();

                // Return the created case
                var response = new CaseResponse
                {
                    Id = newCase.Id,
                    CaseNumber = newCase.CaseNumber,
                    ClientId = newCase.ClientId,
                    ClientName = client.FirstName + " " + client.LastName,
                    Status = newCase.Status,
                    IncidentDate = newCase.IncidentDate,
                    Description = newCase.Description,
                    CreatedAt = newCase.CreatedAt,
                    UpdatedAt = newCase.UpdatedAt
                };

                return CreatedAtAction(nameof(GetCase), new { id = newCase.Id }, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        // PUT: api/cases/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCase(Guid id, [FromBody] CaseRequest request)
        {
            var orgId = GetOrganizationId();
            var existingCase = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);

            if (existingCase == null)
                return NotFound(new { error = "Case not found" });

            // Verify client belongs to organization
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == request.ClientId && c.OrganizationId == orgId);
            if (client == null)
                return BadRequest(new { error = "Client not found or does not belong to your organization." });

            // If case number is changed, check uniqueness
            if (existingCase.CaseNumber != request.CaseNumber)
            {
                var duplicate = await _context.Cases
                    .FirstOrDefaultAsync(c => c.CaseNumber == request.CaseNumber && c.OrganizationId == orgId && c.Id != id);
                if (duplicate != null)
                    return BadRequest(new { error = "Case number already exists in your organization." });
            }

            existingCase.ClientId = request.ClientId;
            existingCase.CaseNumber = request.CaseNumber;
            existingCase.Status = request.Status ?? "open";
            existingCase.IncidentDate = request.IncidentDate?.ToUniversalTime();
            existingCase.Description = request.Description;
            existingCase.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Case updated successfully" });
        }

        // DELETE: api/cases/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCase(Guid id)
        {
            var orgId = GetOrganizationId();
            var caseItem = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);

            if (caseItem == null)
                return NotFound(new { error = "Case not found" });

            _context.Cases.Remove(caseItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}