using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Controllers
{
    public class EventsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;

        public EventsController(LexumLinkDbContext context)
        {
            _context = context;
        }

        // GET: api/events?start=...&end=...
        // Unified calendar feed: CalendarEvents (editable) + task deadlines (todos) + case deadlines.
        [HttpGet]
        public async Task<IActionResult> GetFeed([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var orgId = GetOrganizationId();
            if (orgId == Guid.Empty) return Unauthorized(new { error = "No organization context" });
            var userId = GetUserId();

            var now = DateTime.UtcNow;
            var firstOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var rangeStart = (start?.ToUniversalTime()) ?? firstOfMonth.AddMonths(-1);
            var rangeEnd = (end?.ToUniversalTime()) ?? firstOfMonth.AddMonths(2);

            var clients = await _context.Clients.Where(c => c.OrganizationId == orgId).ToListAsync();
            var clientNames = clients.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}".Trim());

            var cases = await _context.Cases.Where(c => c.OrganizationId == orgId).ToListAsync();
            var caseNumbers = cases.ToDictionary(c => c.Id, c => c.CaseNumber);

            var events = await _context.Events
                .Where(e => e.OrganizationId == orgId && e.StartAt >= rangeStart && e.StartAt < rangeEnd)
                .ToListAsync();

            var feed = new List<object>();

            foreach (var e in events)
            {
                feed.Add(new
                {
                    id = e.Id,
                    source = "event",
                    editable = true,
                    type = e.EventType,
                    title = e.Title,
                    start = e.StartAt,
                    end = e.EndAt,
                    allDay = e.AllDay,
                    location = e.Location,
                    notes = e.Notes,
                    clientId = e.ClientId,
                    clientName = e.ClientId.HasValue && clientNames.TryGetValue(e.ClientId.Value, out var cn) ? cn : null,
                    caseId = e.CaseId,
                    caseNumber = e.CaseId.HasValue && caseNumbers.TryGetValue(e.CaseId.Value, out var num) ? num : null,
                });
            }

            // Task deadlines — current user's todos with a due date
            var todos = await _context.Todos
                .Where(t => t.OrganizationId == orgId && t.UserId == userId
                    && t.DueDate != null && t.DueDate >= rangeStart && t.DueDate < rangeEnd)
                .ToListAsync();
            foreach (var t in todos)
            {
                feed.Add(new
                {
                    id = t.Id,
                    source = "task",
                    editable = false,
                    type = "task_deadline",
                    title = t.Title,
                    start = t.DueDate,
                    end = (DateTime?)null,
                    allDay = true,
                    location = (string?)null,
                    notes = t.Description,
                    clientId = (Guid?)null,
                    clientName = (string?)null,
                    caseId = (Guid?)null,
                    caseNumber = (string?)null,
                });
            }

            // Case deadlines
            foreach (var c in cases.Where(c => c.DeadlineDate != null && c.DeadlineDate >= rangeStart && c.DeadlineDate < rangeEnd))
            {
                feed.Add(new
                {
                    id = c.Id,
                    source = "case",
                    editable = false,
                    type = "case_deadline",
                    title = $"Deadline: {c.CaseNumber}",
                    start = c.DeadlineDate,
                    end = (DateTime?)null,
                    allDay = true,
                    location = (string?)null,
                    notes = (string?)null,
                    clientId = (Guid?)c.ClientId,
                    clientName = clientNames.TryGetValue(c.ClientId, out var ccn) ? ccn : null,
                    caseId = (Guid?)c.Id,
                    caseNumber = c.CaseNumber,
                });
            }

            return Ok(feed);
        }

        // POST: api/events
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EventRequest request)
        {
            var orgId = GetOrganizationId();
            if (orgId == Guid.Empty) return Unauthorized(new { error = "No organization context" });

            var ev = new CalendarEvent
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Title = request.Title,
                EventType = request.EventType,
                StartAt = request.StartAt.ToUniversalTime(),
                EndAt = request.EndAt?.ToUniversalTime(),
                AllDay = request.AllDay,
                Location = request.Location,
                Notes = request.Notes,
                ClientId = request.ClientId,
                CaseId = request.CaseId,
                AssignedUserId = request.AssignedUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();
            return Ok(new { ev.Id });
        }

        // PUT: api/events/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] EventRequest request)
        {
            var orgId = GetOrganizationId();
            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);
            if (ev == null) return NotFound(new { error = "Event not found" });

            ev.Title = request.Title;
            ev.EventType = request.EventType;
            ev.StartAt = request.StartAt.ToUniversalTime();
            ev.EndAt = request.EndAt?.ToUniversalTime();
            ev.AllDay = request.AllDay;
            ev.Location = request.Location;
            ev.Notes = request.Notes;
            ev.ClientId = request.ClientId;
            ev.CaseId = request.CaseId;
            ev.AssignedUserId = request.AssignedUserId;
            ev.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Event updated" });
        }

        // DELETE: api/events/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var orgId = GetOrganizationId();
            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);
            if (ev == null) return NotFound(new { error = "Event not found" });

            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class EventRequest
    {
        public string Title { get; set; } = string.Empty;
        public string EventType { get; set; } = "appointment";
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public bool AllDay { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? CaseId { get; set; }
        public Guid? AssignedUserId { get; set; }
    }
}
