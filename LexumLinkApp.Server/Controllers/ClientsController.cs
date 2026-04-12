using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Controllers
{
    public class ClientsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;
        public ClientsController(LexumLinkDbContext context) => _context = context;

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

        [HttpPost]
        public async Task<IActionResult> CreateClient([FromBody] Client client)
        {
            client.Id = Guid.NewGuid();
            client.OrganizationId = GetOrganizationId();
            client.CreatedAt = DateTime.UtcNow;
            client.UpdatedAt = DateTime.UtcNow;

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
            return Ok(client);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, [FromBody] Client updated)
        {
            var orgId = GetOrganizationId();
            var existing = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (existing == null) return NotFound();

            existing.FirstName = updated.FirstName;
            existing.LastName = updated.LastName;
            existing.Email = updated.Email;
            existing.Phone = updated.Phone;
            existing.IdNumber = updated.IdNumber;
            existing.Address = updated.Address;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

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
    }
}