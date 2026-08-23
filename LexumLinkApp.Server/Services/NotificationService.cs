using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly LexumLinkDbContext _db;
        private readonly IEmailService _email;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(LexumLinkDbContext db, IEmailService email, ILogger<NotificationService> logger)
        {
            _db = db;
            _email = email;
            _logger = logger;
        }

        // ── Recipient resolution ─────────────────────────────────────────────
        // Org-wide notifications go to admins (super admins in the org); if the
        // org has none, fall back to all users in the org.
        private async Task<List<string>> AdminEmailsAsync(Guid orgId)
        {
            var admins = await _db.Users
                .Where(u => u.OrganizationId == orgId && u.IsSuperAdmin && u.Email != "")
                .Select(u => u.Email)
                .ToListAsync();

            if (admins.Count == 0)
            {
                admins = await _db.Users
                    .Where(u => u.OrganizationId == orgId && u.Email != "")
                    .Select(u => u.Email)
                    .ToListAsync();
            }

            return admins.Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();
        }

        private async Task SafeSendAsync(IEnumerable<string> to, string subject, string body)
        {
            try
            {
                await _email.SendAsync(to, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification email: {Subject}", subject);
            }
        }

        // ── Live triggers ────────────────────────────────────────────────────

        public async Task NotifyNewClientAsync(Client client)
        {
            var to = await AdminEmailsAsync(client.OrganizationId);
            var name = $"{client.FirstName} {client.LastName}".Trim();
            var rows = new (string, string)[]
            {
                ("Client", name),
                ("Email", client.Email ?? "—"),
                ("Phone", client.Phone ?? "—"),
                ("Added", client.CreatedAt.ToString("dd MMM yyyy HH:mm") + " UTC"),
            };
            await SafeSendAsync(to, $"New client added: {name}",
                Shell("New Client Added", $"A new client has been registered on Lexum Link.{Table(rows)}"));
        }

        public async Task NotifyTaskAssignedAsync(Todo todo)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == todo.UserId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email)) return;

            var rows = new (string, string)[]
            {
                ("Task", todo.Title),
                ("Due", todo.DueDate.HasValue ? todo.DueDate.Value.ToString("dd MMM yyyy HH:mm") + " UTC" : "No due date"),
                ("Details", string.IsNullOrWhiteSpace(todo.Description) ? "—" : todo.Description!),
            };
            await SafeSendAsync(new[] { user.Email }, $"New task assigned: {todo.Title}",
                Shell("Task Assigned", $"Hi {user.FirstName}, a task has been assigned to you.{Table(rows)}"));
        }

        public async Task NotifyDocumentUploadedAsync(Document document, string clientName)
        {
            var to = await AdminEmailsAsync(document.OrganizationId);
            var rows = new (string, string)[]
            {
                ("File", document.FileName),
                ("Type", PrettyType(document.DocumentType)),
                ("Client", string.IsNullOrWhiteSpace(clientName) ? "—" : clientName),
                ("Uploaded", document.UploadedAt.ToString("dd MMM yyyy HH:mm") + " UTC"),
            };
            await SafeSendAsync(to, $"Document uploaded: {document.FileName}",
                Shell("Document Uploaded", $"A new document has been uploaded.{Table(rows)}"));
        }

        public async Task NotifyTicketCreatedAsync(Ticket ticket)
        {
            var number = INotificationService.TicketNumber(ticket.Id);
            var rows = new (string, string)[]
            {
                ("Ticket #", number),
                ("Title", ticket.Title),
                ("Type", PrettyType(ticket.Type)),
                ("Status", PrettyType(ticket.Status)),
                ("Created", ticket.CreatedAt.ToString("dd MMM yyyy HH:mm") + " UTC"),
            };

            // Confirmation straight to the person who logged the ticket — this is the
            // "we've got it, hang tight" receipt the reporter should always see.
            var creator = ticket.UserId.HasValue
                ? await _db.Users.FirstOrDefaultAsync(u => u.Id == ticket.UserId.Value)
                : null;
            if (creator != null && !string.IsNullOrWhiteSpace(creator.Email))
            {
                await SafeSendAsync(new[] { creator.Email }, $"We've received your ticket {number}",
                    Shell("Ticket Received", $"Hi {creator.FirstName}, thanks for reaching out. Your ticket has been logged and will be resolved as soon as possible.{Table(rows)}"));
            }

            // Separate internal notice to org admins (or the whole org if none), excluding the
            // creator so they don't get the same thing twice.
            var to = (await AdminEmailsAsync(ticket.OrganizationId))
                .Where(e => creator == null || !string.Equals(e, creator.Email, StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (to.Count > 0)
            {
                await SafeSendAsync(to, $"New ticket {number}: {ticket.Title}",
                    Shell("Support Ticket Created", $"A new support ticket has been logged.{Table(rows)}"));
            }
        }

        // ── Daily digest ─────────────────────────────────────────────────────

        public async Task SendDailyDigestsAsync(CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            var soon = now.AddDays(7);
            var orgIds = await _db.Organizations.Select(o => o.Id).ToListAsync(ct);

            foreach (var orgId in orgIds)
            {
                var clientNames = await _db.Clients
                    .Where(c => c.OrganizationId == orgId)
                    .ToDictionaryAsync(c => c.Id, c => $"{c.FirstName} {c.LastName}".Trim(), ct);

                var openCases = await _db.Cases
                    .Where(c => c.OrganizationId == orgId && c.Status != "closed" && c.DeadlineDate != null)
                    .ToListAsync(ct);

                var upcoming = openCases
                    .Where(c => c.DeadlineDate!.Value >= now && c.DeadlineDate.Value <= soon)
                    .OrderBy(c => c.DeadlineDate!.Value).ToList();
                var overdue = openCases
                    .Where(c => c.DeadlineDate!.Value < now)
                    .OrderBy(c => c.DeadlineDate!.Value).ToList();

                if (upcoming.Count == 0 && overdue.Count == 0) continue;

                string Line(Case c, bool od)
                {
                    var name = clientNames.TryGetValue(c.ClientId, out var n) ? n : "";
                    var days = (int)Math.Ceiling(Math.Abs((c.DeadlineDate!.Value - now).TotalDays));
                    var when = od ? $"{days} day(s) overdue" : $"in {days} day(s)";
                    return $"<li style=\"margin:4px 0\"><strong>{c.CaseNumber}</strong> — {name} · {c.DeadlineDate.Value:dd MMM yyyy} ({when})</li>";
                }

                var body = "Here is your daily case summary.";
                if (overdue.Count > 0)
                    body += $"<h3 style=\"color:#C1121F;margin:18px 0 6px\">Overdue cases ({overdue.Count})</h3><ul style=\"padding-left:18px;margin:0\">{string.Concat(overdue.Select(c => Line(c, true)))}</ul>";
                if (upcoming.Count > 0)
                    body += $"<h3 style=\"color:#5E0006;margin:18px 0 6px\">Upcoming deadlines ({upcoming.Count})</h3><ul style=\"padding-left:18px;margin:0\">{string.Concat(upcoming.Select(c => Line(c, false)))}</ul>";

                var to = await AdminEmailsAsync(orgId);
                await SafeSendAsync(to, $"Daily case digest — {overdue.Count} overdue, {upcoming.Count} upcoming",
                    Shell("Daily Case Digest", body));
            }
        }

        // ── HTML helpers ─────────────────────────────────────────────────────

        private static string PrettyType(string s) =>
            string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s.Substring(1).Replace('_', ' ');

        private static string Table((string, string)[] rows)
        {
            var trs = string.Concat(rows.Select(r =>
                $"<tr><td style=\"padding:6px 12px 6px 0;color:#8E7E69;white-space:nowrap\">{r.Item1}</td>" +
                $"<td style=\"padding:6px 0;color:#2A0A0C;font-weight:600\">{System.Net.WebUtility.HtmlEncode(r.Item2)}</td></tr>"));
            return $"<table style=\"margin-top:16px;border-collapse:collapse;font-size:14px\">{trs}</table>";
        }

        private static string Shell(string heading, string bodyHtml)
        {
            return $@"<!DOCTYPE html><html><body style=""margin:0;background:#EED9B9;font-family:Segoe UI,Arial,sans-serif"">
<div style=""max-width:560px;margin:0 auto;padding:24px"">
  <div style=""background:#5E0006;color:#EED9B9;padding:18px 24px;border-radius:12px 12px 0 0;font-weight:800;font-size:18px;letter-spacing:.5px"">Lexum<span style=""color:#fff"">Link</span></div>
  <div style=""background:#FBF5EC;padding:24px;border-radius:0 0 12px 12px;color:#2A0A0C"">
    <h2 style=""margin:0 0 10px;font-size:20px;color:#5E0006"">{heading}</h2>
    <div style=""font-size:14px;line-height:1.6;color:#4a2e2a"">{bodyHtml}</div>
    <p style=""margin-top:24px;font-size:12px;color:#9C7F79"">You are receiving this because you are an operator on Lexum Link.</p>
  </div>
</div></body></html>";
        }
    }
}
