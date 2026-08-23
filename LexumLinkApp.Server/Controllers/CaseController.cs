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

        // Workflow automation: case numbers are assigned by the system, not typed in by
        // hand. Format is CASE-{year}-{seq}, sequential per organization and resetting to
        // 0001 at the start of each year.
        private async Task<string> GenerateCaseNumberAsync(Guid orgId)
        {
            var prefix = $"CASE-{DateTime.UtcNow.Year}-";
            var existing = await _context.Cases
                .Where(c => c.OrganizationId == orgId && c.CaseNumber.StartsWith(prefix))
                .Select(c => c.CaseNumber)
                .ToListAsync();

            var nextSeq = existing
                .Select(n => int.TryParse(n.AsSpan(prefix.Length), out var seq) ? seq : 0)
                .DefaultIfEmpty(0)
                .Max() + 1;

            return $"{prefix}{nextSeq:D4}";
        }

        // GET: api/cases
        // Archived cases are hidden by default — pass includeArchived=true to see them
        // (e.g. from a dedicated "Archived" filter/tab).
        [HttpGet]
        public async Task<IActionResult> GetCases([FromQuery] bool includeArchived = false)
        {
            var orgId = GetOrganizationId();
            var cases = await _context.Cases
                .Where(c => c.OrganizationId == orgId && (includeArchived || !c.IsArchived))
                .Include(c => c.Client)
                .Select(c => new CaseResponse
                {
                    Id = c.Id,
                    CaseNumber = c.CaseNumber,
                    ClientId = c.ClientId,
                    ClientName = c.Client.FirstName + " " + c.Client.LastName,
                    ClientPhotoUrl = c.Client.PhotoUrl,
                    Status = c.Status,
                    IncidentDate = c.IncidentDate,
                    Description = c.Description,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    IsArchived = c.IsArchived
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
                    ClientPhotoUrl = c.Client.PhotoUrl,
                    Status = c.Status,
                    IncidentDate = c.IncidentDate,
                    Description = c.Description,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    IsArchived = c.IsArchived
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

                // Case numbers are system-assigned (see GenerateCaseNumberAsync) — any
                // CaseNumber the client might still send is ignored.
                var caseNumber = await GenerateCaseNumberAsync(orgId);

                var newCase = new Case
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    ClientId = request.ClientId,
                    CaseNumber = caseNumber,
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
                    ClientPhotoUrl = client.PhotoUrl,
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

            // Case numbers are system-assigned and immutable once created — any CaseNumber
            // sent by the client is ignored here.
            var newStatus = request.Status ?? "open";
            var wasClosed = existingCase.Status == "closed";
            var isNowClosed = newStatus == "closed";

            existingCase.ClientId = request.ClientId;
            existingCase.Status = newStatus;
            existingCase.IncidentDate = request.IncidentDate?.ToUniversalTime();
            existingCase.Description = request.Description;
            existingCase.UpdatedAt = DateTime.UtcNow;

            // Track when a case was closed — this is what the auto-archive job measures
            // the idle period from. Clear it if the case is reopened.
            if (isNowClosed && !wasClosed)
                existingCase.ClosedAt = DateTime.UtcNow;
            else if (!isNowClosed && wasClosed)
                existingCase.ClosedAt = null;

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