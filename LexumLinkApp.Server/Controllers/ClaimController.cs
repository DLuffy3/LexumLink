using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using System.Security.Claims;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClaimsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;

        public ClaimsController(LexumLinkDbContext context)
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

        [HttpGet]
        public async Task<IActionResult> GetClaims()
        {
            var orgId = GetOrganizationId();
            var claims = await _context.Claims
                .Where(c => c.OrganizationId == orgId)
                .Include(c => c.Case)
                    .ThenInclude(ca => ca.Client)
                .Select(c => new
                {
                    c.Id,
                    c.ClaimNumber,
                    ClientId = c.Case.ClientId,
                    ClientName = c.Case.Client.FirstName + " " + c.Case.Client.LastName,
                    c.Status,
                    c.RafReference,
                    c.AmountRequested,
                    c.AmountAwarded,
                    c.CreatedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(claims);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClaim(Guid id)
        {
            var orgId = GetOrganizationId();
            var claim = await _context.Claims
                .Where(c => c.Id == id && c.OrganizationId == orgId)
                .Include(c => c.Case)
                    .ThenInclude(ca => ca.Client)
                .Select(c => new
                {
                    c.Id,
                    c.ClaimNumber,
                    ClientId = c.Case.ClientId,
                    ClientName = c.Case.Client.FirstName + " " + c.Case.Client.LastName,
                    c.Status,
                    c.RafReference,
                    c.AmountRequested,
                    c.AmountAwarded,
                    c.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (claim == null)
                return NotFound(new { error = "Claim not found" });

            return Ok(claim);
        }

        [HttpPost]
        public async Task<IActionResult> CreateClaim([FromBody] CreateClaimRequest request)
        {
            var orgId = GetOrganizationId();
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // Verify case exists and belongs to the organization
            var caseEntity = await _context.Cases
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.OrganizationId == orgId);
            if (caseEntity == null)
                return BadRequest(new { error = "Case not found or does not belong to your organization." });

            // Check uniqueness of claim number (optional)
            var existingClaim = await _context.Claims
                .FirstOrDefaultAsync(c => c.ClaimNumber == request.ClaimNumber && c.OrganizationId == orgId);
            if (existingClaim != null)
                return BadRequest(new { error = "Claim number already exists in your organization." });

            var claim = new ClientClaim
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                CaseId = request.CaseId,
                ClaimNumber = request.ClaimNumber,
                Status = request.Status ?? "in_progress",
                RafReference = request.RafReference,
                AmountRequested = request.AmountRequested,
                AmountAwarded = request.AmountAwarded,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Claims.Add(claim);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                claim.Id,
                claim.ClaimNumber,
                ClientId = caseEntity.ClientId,
                ClientName = caseEntity.Client.FirstName + " " + caseEntity.Client.LastName,
                claim.Status,
                claim.RafReference,
                claim.AmountRequested,
                claim.AmountAwarded,
                claim.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClaim(Guid id, [FromBody] UpdateClaimRequest request)
        {
            var orgId = GetOrganizationId();
            var claim = await _context.Claims
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);

            if (claim == null)
                return NotFound(new { error = "Claim not found" });

            // If claim number changed, check uniqueness
            if (claim.ClaimNumber != request.ClaimNumber)
            {
                var duplicate = await _context.Claims
                    .FirstOrDefaultAsync(c => c.ClaimNumber == request.ClaimNumber && c.OrganizationId == orgId && c.Id != id);
                if (duplicate != null)
                    return BadRequest(new { error = "Claim number already exists in your organization." });
            }

            claim.ClaimNumber = request.ClaimNumber;
            claim.Status = request.Status ?? claim.Status;
            claim.RafReference = request.RafReference;
            claim.AmountRequested = request.AmountRequested;
            claim.AmountAwarded = request.AmountAwarded;
            claim.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Claim updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClaim(Guid id)
        {
            var orgId = GetOrganizationId();
            var claim = await _context.Claims
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);

            if (claim == null)
                return NotFound(new { error = "Claim not found" });

            _context.Claims.Remove(claim);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}