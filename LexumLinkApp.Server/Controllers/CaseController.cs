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

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

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

        // Prescription Alert: works out the Prescription Date (stored on Case.DeadlineDate)
        // from the Occurrence Date (Case.IncidentDate) and the selected matter type's
        // default period, when the caller hasn't supplied an explicit PrescriptionDate.
        private async Task<DateTime?> ResolvePrescriptionDateAsync(DateTime? explicitDate, DateTime? occurrenceDate, Guid? matterTypeId)
        {
            if (explicitDate.HasValue) return explicitDate.Value.ToUniversalTime();
            if (!occurrenceDate.HasValue || !matterTypeId.HasValue) return null;

            var matterType = await _context.MatterTypes.FindAsync(matterTypeId.Value);
            if (matterType?.DefaultPeriodMonths == null) return null;

            return occurrenceDate.Value.AddMonths(matterType.DefaultPeriodMonths.Value);
        }

        private async Task LogEventAsync(Guid caseId, string eventType, string? notes, Guid? userId)
        {
            _context.CaseEvents.Add(new CaseEvent
            {
                Id = Guid.NewGuid(),
                CaseId = caseId,
                EventType = eventType,
                EventDate = DateTime.UtcNow,
                Notes = notes,
                AddedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            await Task.CompletedTask;
        }

        private static CaseResponse ToResponse(Case c) => new CaseResponse
        {
            Id = c.Id,
            CaseNumber = c.CaseNumber,
            ClientId = c.ClientId,
            ClientName = c.Client != null ? $"{c.Client.FirstName} {c.Client.LastName}" : "",
            ClientPhotoUrl = c.Client?.PhotoUrl,
            Status = c.Status,
            IncidentDate = c.IncidentDate,
            Description = c.Description,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            IsArchived = c.IsArchived,
            AssignedUserId = c.AssignedUserId,
            AssignedUserName = c.AssignedUser != null ? $"{c.AssignedUser.FirstName} {c.AssignedUser.LastName}" : null,
            MatterTypeId = c.MatterTypeId,
            MatterTypeName = c.MatterType?.Name,
            PrescriptionDate = c.DeadlineDate,
            LodgementDate = c.LodgementDate,
            StatutoryNoticeDate = c.StatutoryNoticeDate,
            SummonsServedDate = c.SummonsServedDate,
            SupervisorUserId = c.SupervisorUserId,
            SupervisorUserName = c.SupervisorUser != null ? $"{c.SupervisorUser.FirstName} {c.SupervisorUser.LastName}" : null
        };

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
                .Include(c => c.AssignedUser)
                .Include(c => c.SupervisorUser)
                .Include(c => c.MatterType)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(cases.Select(ToResponse));
        }

        // GET: api/cases/matter-types — active matter types for the New/Edit Case dropdown
        [HttpGet("matter-types")]
        public async Task<IActionResult> GetMatterTypes()
        {
            var types = await _context.MatterTypes
                .Where(m => m.IsActive)
                .OrderBy(m => m.SortOrder)
                .Select(m => new MatterTypeResponse
                {
                    Id = m.Id,
                    Name = m.Name,
                    DefaultPeriodMonths = m.DefaultPeriodMonths,
                    Notes = m.Notes,
                    IsActive = m.IsActive,
                    SortOrder = m.SortOrder
                })
                .ToListAsync();

            return Ok(types);
        }

        // GET: api/cases/team — active users in the caller's org, for the Assigned
        // Handler / Supervisor dropdowns on New/Edit Case.
        [HttpGet("team")]
        public async Task<IActionResult> GetTeam()
        {
            var orgId = GetOrganizationId();
            var team = await _context.Users
                .Where(u => u.OrganizationId == orgId && u.IsActive)
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToListAsync();

            return Ok(team);
        }

        // GET: api/cases/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCase(Guid id)
        {
            var orgId = GetOrganizationId();
            var caseItem = await _context.Cases
                .Where(c => c.Id == id && c.OrganizationId == orgId)
                .Include(c => c.Client)
                .Include(c => c.AssignedUser)
                .Include(c => c.SupervisorUser)
                .Include(c => c.MatterType)
                .FirstOrDefaultAsync();

            if (caseItem == null)
                return NotFound(new { error = "Case not found" });

            return Ok(ToResponse(caseItem));
        }

        // GET: api/cases/{id}/events
        [HttpGet("{id}/events")]
        public async Task<IActionResult> GetCaseEvents(Guid id)
        {
            var orgId = GetOrganizationId();
            var caseExists = await _context.Cases.AnyAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (!caseExists) return NotFound(new { error = "Case not found" });

            var events = await _context.CaseEvents
                .Where(e => e.CaseId == id)
                .Include(e => e.AddedByUser)
                .OrderByDescending(e => e.EventDate)
                .Select(e => new CaseEventResponse
                {
                    Id = e.Id,
                    EventType = e.EventType,
                    EventDate = e.EventDate,
                    Notes = e.Notes,
                    AddedByName = e.AddedByUser != null ? e.AddedByUser.FirstName + " " + e.AddedByUser.LastName : null,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(events);
        }

        // POST: api/cases/{id}/events — manually log an event (e.g. "Summons served")
        [HttpPost("{id}/events")]
        public async Task<IActionResult> AddCaseEvent(Guid id, [FromBody] CaseEventRequest request)
        {
            var orgId = GetOrganizationId();
            var caseItem = await _context.Cases.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (caseItem == null) return NotFound(new { error = "Case not found" });

            if (string.IsNullOrWhiteSpace(request.EventType))
                return BadRequest(new { error = "Event type is required." });

            var evt = new CaseEvent
            {
                Id = Guid.NewGuid(),
                CaseId = id,
                EventType = request.EventType,
                EventDate = request.EventDate == default ? DateTime.UtcNow : request.EventDate.ToUniversalTime(),
                Notes = request.Notes,
                AddedByUserId = GetUserId(),
                CreatedAt = DateTime.UtcNow
            };
            _context.CaseEvents.Add(evt);
            caseItem.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Event added" });
        }

        // POST: api/cases
        [HttpPost]
        public async Task<IActionResult> CreateCase([FromBody] CaseRequest request)
        {
            try
            {
                var orgId = GetOrganizationId();
                var userId = GetUserId();

                // Verify client exists and belongs to the same organization
                var client = await _context.Clients
                    .FirstOrDefaultAsync(c => c.Id == request.ClientId && c.OrganizationId == orgId);
                if (client == null)
                    return BadRequest(new { error = "Client not found or does not belong to your organization." });

                // Case numbers are system-assigned (see GenerateCaseNumberAsync) — any
                // CaseNumber the client might still send is ignored.
                var caseNumber = await GenerateCaseNumberAsync(orgId);
                var occurrenceDate = request.IncidentDate?.ToUniversalTime();
                var prescriptionDate = await ResolvePrescriptionDateAsync(request.PrescriptionDate, occurrenceDate, request.MatterTypeId);

                var newCase = new Case
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    ClientId = request.ClientId,
                    CaseNumber = caseNumber,
                    Status = request.Status ?? "open",
                    IncidentDate = occurrenceDate,
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    AssignedUserId = request.AssignedUserId,
                    MatterTypeId = request.MatterTypeId,
                    DeadlineDate = prescriptionDate,
                    LodgementDate = request.LodgementDate?.ToUniversalTime(),
                    StatutoryNoticeDate = request.StatutoryNoticeDate?.ToUniversalTime(),
                    SummonsServedDate = request.SummonsServedDate?.ToUniversalTime(),
                    SupervisorUserId = request.SupervisorUserId
                };

                _context.Cases.Add(newCase);
                await LogEventAsync(newCase.Id, "Case registered", $"Case {caseNumber} created.", userId);
                await _context.SaveChangesAsync();

                var matterType = request.MatterTypeId.HasValue
                    ? await _context.MatterTypes.FindAsync(request.MatterTypeId.Value)
                    : null;
                var assignedUser = request.AssignedUserId.HasValue
                    ? await _context.Users.FindAsync(request.AssignedUserId.Value)
                    : null;
                var supervisorUser = request.SupervisorUserId.HasValue
                    ? await _context.Users.FindAsync(request.SupervisorUserId.Value)
                    : null;

                var response = ToResponse(newCase);
                response.ClientName = $"{client.FirstName} {client.LastName}";
                response.ClientPhotoUrl = client.PhotoUrl;
                response.MatterTypeName = matterType?.Name;
                response.AssignedUserName = assignedUser != null ? $"{assignedUser.FirstName} {assignedUser.LastName}" : null;
                response.SupervisorUserName = supervisorUser != null ? $"{supervisorUser.FirstName} {supervisorUser.LastName}" : null;

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
            var userId = GetUserId();
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
            var previousStatus = existingCase.Status;
            var wasClosed = previousStatus == "closed";
            var isNowClosed = newStatus == "closed";

            existingCase.ClientId = request.ClientId;
            existingCase.Status = newStatus;
            existingCase.IncidentDate = request.IncidentDate?.ToUniversalTime();
            existingCase.Description = request.Description;
            existingCase.AssignedUserId = request.AssignedUserId;
            existingCase.MatterTypeId = request.MatterTypeId;
            existingCase.LodgementDate = request.LodgementDate?.ToUniversalTime();
            existingCase.StatutoryNoticeDate = request.StatutoryNoticeDate?.ToUniversalTime();
            existingCase.SummonsServedDate = request.SummonsServedDate?.ToUniversalTime();
            existingCase.SupervisorUserId = request.SupervisorUserId;
            existingCase.UpdatedAt = DateTime.UtcNow;

            var newPrescriptionDate = await ResolvePrescriptionDateAsync(request.PrescriptionDate, existingCase.IncidentDate, existingCase.MatterTypeId);
            if (newPrescriptionDate != existingCase.DeadlineDate)
            {
                existingCase.DeadlineDate = newPrescriptionDate;
                // A changed prescription date invalidates any reminders already sent
                // against the old date, so the escalating 90/30/7-day alerts start over.
                existingCase.PrescriptionReminderStage = 0;
            }

            // Track when a case was closed — this is what the auto-archive job measures
            // the idle period from. Clear it if the case is reopened.
            if (isNowClosed && !wasClosed)
            {
                existingCase.ClosedAt = DateTime.UtcNow;
                await LogEventAsync(existingCase.Id, "Case closed", null, userId);
            }
            else if (!isNowClosed && wasClosed)
            {
                existingCase.ClosedAt = null;
                await LogEventAsync(existingCase.Id, "Case reopened", null, userId);
            }
            else if (newStatus != previousStatus)
            {
                await LogEventAsync(existingCase.Id, "Status changed", $"{previousStatus} → {newStatus}", userId);
            }

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
