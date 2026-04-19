using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;

        public TicketsController(LexumLinkDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        private bool IsSuperAdmin()
        {
            var isSuperAdminClaim = User.FindFirst("isSuperAdmin")?.Value;
            return isSuperAdminClaim == "true";
        }

        // GET: api/tickets (for regular users – only their own tickets)
        [HttpGet]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetUserId();
            var tickets = await _context.Tickets
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Type,
                    t.Status,
                    t.CreatedAt,
                    t.UpdatedAt
                })
                .ToListAsync();
            return Ok(tickets);
        }

        // GET: api/tickets/admin (for super admin – all tickets across all orgs)
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllTickets()
        {
            if (!IsSuperAdmin())
                return Forbid("Only super administrators can view all tickets.");

            var tickets = await _context.Tickets
                .Include(t => t.User)
                .Include(t => t.Organization)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Type,
                    t.Status,
                    t.CreatedAt,
                    t.UpdatedAt,
                    User = t.User != null ? new { t.User.FirstName, t.User.LastName, t.User.Email } : null,
                    Organization = new { t.Organization.Name }
                })
                .ToListAsync();
            return Ok(tickets);
        }

        // POST: api/tickets
        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest request)
        {
            var userId = GetUserId();
            var orgIdClaim = User.FindFirst("orgId")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim))
                return BadRequest(new { error = "Organization not found." });

            var orgId = Guid.Parse(orgIdClaim);

            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                Status = "new",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ticket created successfully", ticketId = ticket.Id });
        }

        // PUT: api/tickets/{id}/status (for super admin)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateTicketStatus(Guid id, [FromBody] UpdateStatusRequest request)
        {
            if (!IsSuperAdmin())
                return Forbid("Only super administrators can update ticket status.");

            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { error = "Ticket not found" });

            var allowedStatuses = new[] { "new", "active", "critical", "complete" };
            if (!allowedStatuses.Contains(request.Status))
                return BadRequest(new { error = "Invalid status value." });

            ticket.Status = request.Status;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated" });
        }
    }
}