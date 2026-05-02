using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    public class ClientsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;
        public ClientsController(LexumLinkDbContext context) => _context = context;
        
        #region Create

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateClient([FromBody] ClientRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Invalid user token");

            var orgIdClaim = User.FindFirst("orgId")?.Value;
            if (!Guid.TryParse(orgIdClaim, out var orgId))
                return BadRequest("No active organization selected");

            var client = new Client
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                UserId = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                IdNumber = request.IdNumber,
                Address = request.Address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
            return Ok(client);
        }

        #endregion Create

        #region Read

        [HttpGet]
        public async Task<IActionResult> GetClients()
        {
            var orgId = GetOrganizationId();
            var clients = await _context.Clients
                .Where(c => c.OrganizationId == orgId)
                .OrderBy(c => c.LastName)
                .ToListAsync();
            return Ok(clients);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClient(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();
            return Ok(client);
        }

        #endregion Read

        #region Update

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, [FromBody] UpdateClientRequest request)
        {
            var orgId = GetOrganizationId();
            var existing = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (existing == null) return NotFound();

            existing.FirstName = request.FirstName;
            existing.LastName = request.LastName;
            existing.Email = request.Email;
            existing.Phone = request.Phone;
            existing.IdNumber = request.IdNumber;
            existing.Address = request.Address;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        #endregion Update

        #region Delete

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        #endregion Delete
    }
}