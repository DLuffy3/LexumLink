using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly LexumLinkDbContext _db;
        private readonly IEmailService _email;
        private readonly IPlatformSettingsService _settings;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(LexumLinkDbContext db, IEmailService email, IPlatformSettingsService settings, ILogger<NotificationService> logger)
        {
            _db = db;
            _email = email;
            _settings = settings;
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

        // New public sign-up (Client Registration & Service Agreement) submitted via the
        // marketing site. Two emails: an internal notice to sales so the account can be
        // reviewed/activated, and a confirmation receipt to the registrant.
        public async Task NotifyClientRegistrationAsync(ClientRegistration registration)
        {
            var settings = await _settings.GetAsync();
            var salesTo = string.IsNullOrWhiteSpace(settings.SalesNotificationEmail)
                ? settings.SupportEmail
                : settings.SalesNotificationEmail;

            var rows = new (string, string)[]
            {
                ("Reference #", registration.ClientReferenceNumber),
                ("Company", registration.CompanyName),
                ("Contact", $"{registration.ContactFullName} ({registration.ContactPosition ?? "—"})"),
                ("Email", registration.ContactEmail),
                ("Mobile", registration.ContactMobile),
                ("Package", PrettyType(registration.ServicePackage)),
                ("Signed", registration.SignedAt.ToString("dd MMM yyyy HH:mm") + " UTC"),
            };

            if (!string.IsNullOrWhiteSpace(salesTo))
            {
                await SafeSendAsync(new[] { salesTo }, $"New client sign-up: {registration.CompanyName} ({registration.ClientReferenceNumber})",
                    Shell("New Client Registration", $"A new client has signed up and is awaiting review.{Table(rows)}<p style=\"margin-top:16px\">Review and activate it from Super Admin &gt; Signups.</p>"));
            }

            if (!string.IsNullOrWhiteSpace(registration.ContactEmail))
            {
                await SafeSendAsync(new[] { registration.ContactEmail }, "We've received your LexumLink registration",
                    Shell("Registration Received", $"Hi {registration.ContactFullName}, thanks for signing up with LexumLink. Your signed Client Registration &amp; Service Agreement has been received.{Table(new (string, string)[] { ("Reference #", registration.ClientReferenceNumber), ("Company", registration.CompanyName) })}<p style=\"margin-top:16px\">Our team will review your details and be in touch shortly to activate your account.</p>"));
            }
        }

        // Sent when a Super Admin activates a pending client registration into a real
        // Organization + admin User — gives the new admin their login and temp password.
        //
        // Unlike the other Notify* methods (which use SafeSendAsync and swallow failures,
        // since a broken mail server shouldn't block a ticket or a digest), this one is the
        // ONLY way the new admin receives their password — silently failing here leaves
        // them locked out with no way to know why. So it deliberately does not swallow the
        // outcome: it returns null on success, or a human-readable reason the admin doing
        // the activation should see immediately (surfaced by the Activate endpoint/UI).
        public async Task<string?> NotifyAccountActivatedAsync(User user, string organizationName, string tempPassword)
        {
            if (string.IsNullOrWhiteSpace(user.Email))
                return "This user has no email address on file, so no welcome email could be sent.";

            var settings = await _settings.GetAsync();
            if (!settings.SmtpEnabled || string.IsNullOrWhiteSpace(settings.SmtpHost))
                return "SMTP is not enabled/configured (Super Admin > Settings), so no email was sent.";

            var rows = new (string, string)[]
            {
                ("Organization", organizationName),
                ("Login email", user.Email),
                ("Temporary password", tempPassword),
            };

            try
            {
                await _email.SendAsync(new[] { user.Email }, "Your LexumLink account is ready",
                    Shell("Welcome to LexumLink", $"Hi {user.FirstName}, your LexumLink account has been activated.{Table(rows)}<p style=\"margin-top:16px\">Sign in at <a href=\"https://lexumlink.co.za/signin\" style=\"color:#5E0006\">lexumlink.co.za/signin</a> and change your password as soon as possible.</p>"));
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send account-activation email to {Email}", user.Email);
                return $"The welcome email failed to send: {ex.Message}";
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

        // ── Workflow automation ──────────────────────────────────────────────

        // One email per user listing every incomplete task past its due date.
        public async Task NotifyOverdueTasksAsync(CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            var overdue = await _db.Todos
                .Where(t => !t.IsCompleted && t.DueDate != null && t.DueDate < now)
                .Include(t => t.User)
                .ToListAsync(ct);

            foreach (var group in overdue.GroupBy(t => t.UserId))
            {
                var user = group.First().User;
                if (user == null || string.IsNullOrWhiteSpace(user.Email)) continue;

                var items = group.OrderBy(t => t.DueDate).ToList();
                var rows = string.Concat(items.Select(t =>
                {
                    var days = (int)Math.Ceiling((now - t.DueDate!.Value).TotalDays);
                    return $"<li style=\"margin:4px 0\"><strong>{System.Net.WebUtility.HtmlEncode(t.Title)}</strong> — {days} day(s) overdue</li>";
                }));

                await SafeSendAsync(new[] { user.Email }, $"You have {items.Count} overdue task(s)",
                    Shell("Overdue Tasks", $"Hi {user.FirstName}, these tasks are past their due date.<ul style=\"padding-left:18px;margin:16px 0 0\">{rows}</ul>"));
            }
        }

        // Alerts the assigned handler (or org admins if unassigned) when a case has sat
        // with no activity for longer than PlatformSettings.CaseIdleDays. Only fires once
        // per idle stretch — StaleNotifiedAt tracks that so this doesn't repeat daily.
        public async Task NotifyStaleCasesAsync(CancellationToken ct = default)
        {
            var settings = await _settings.GetAsync();
            var threshold = DateTime.UtcNow.AddDays(-settings.CaseIdleDays);

            var staleCases = await _db.Cases
                .Where(c => !c.IsArchived && c.Status != "closed" && c.UpdatedAt < threshold &&
                            (c.StaleNotifiedAt == null || c.StaleNotifiedAt < c.UpdatedAt))
                .Include(c => c.Client)
                .Include(c => c.AssignedUser)
                .ToListAsync(ct);

            foreach (var c in staleCases)
            {
                var days = (int)(DateTime.UtcNow - c.UpdatedAt).TotalDays;
                var rows = new (string, string)[]
                {
                    ("Case #", c.CaseNumber),
                    ("Client", $"{c.Client.FirstName} {c.Client.LastName}".Trim()),
                    ("Status", PrettyType(c.Status)),
                    ("Last activity", $"{days} day(s) ago"),
                };

                var to = new List<string>();
                if (c.AssignedUser != null && !string.IsNullOrWhiteSpace(c.AssignedUser.Email))
                    to.Add(c.AssignedUser.Email);
                if (to.Count == 0)
                    to = await AdminEmailsAsync(c.OrganizationId);

                if (to.Count > 0)
                {
                    await SafeSendAsync(to, $"Case {c.CaseNumber} hasn't been updated in {days} days",
                        Shell("Case Needs Attention", $"This case hasn't had any activity in a while.{Table(rows)}"));
                }

                c.StaleNotifiedAt = DateTime.UtcNow;
            }

            if (staleCases.Count > 0)
                await _db.SaveChangesAsync(ct);
        }

        // Archives closed cases once they've been closed longer than
        // PlatformSettings.CaseArchiveDays. Silent — archiving isn't itself worth an email.
        public async Task ArchiveClosedCasesAsync(CancellationToken ct = default)
        {
            var settings = await _settings.GetAsync();
            var threshold = DateTime.UtcNow.AddDays(-settings.CaseArchiveDays);

            var toArchive = await _db.Cases
                .Where(c => !c.IsArchived && c.Status == "closed" && c.ClosedAt != null && c.ClosedAt < threshold)
                .ToListAsync(ct);

            foreach (var c in toArchive)
            {
                c.IsArchived = true;
                c.ArchivedAt = DateTime.UtcNow;
            }

            if (toArchive.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Auto-archived {Count} closed case(s).", toArchive.Count);
            }
        }

        // Prescription Alert: escalating reminders at 90, 30 and 7 days before a case's
        // Prescription Date (Case.DeadlineDate), plus a final alert once it has passed.
        // PrescriptionReminderStage tracks the highest stage already sent (0=none,
        // 1=90-day, 2=30-day, 3=7-day, 4=overdue) so each stage only fires once — it's
        // reset to 0 by CasesController whenever the Prescription Date itself changes.
        public async Task NotifyPrescriptionDeadlinesAsync(CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;

            var candidates = await _db.Cases
                .Where(c => !c.IsArchived && c.Status != "closed" && c.DeadlineDate != null && c.PrescriptionReminderStage < 4)
                .Include(c => c.Client)
                .Include(c => c.AssignedUser)
                .Include(c => c.SupervisorUser)
                .Include(c => c.MatterType)
                .ToListAsync(ct);

            var touched = new List<Case>();

            foreach (var c in candidates)
            {
                var daysLeft = (int)Math.Ceiling((c.DeadlineDate!.Value - now).TotalDays);

                int targetStage;
                string stageLabel;
                if (daysLeft <= 0) { targetStage = 4; stageLabel = "has reached its prescription date"; }
                else if (daysLeft <= 7) { targetStage = 3; stageLabel = $"prescribes in {daysLeft} day(s)"; }
                else if (daysLeft <= 30) { targetStage = 2; stageLabel = $"prescribes in {daysLeft} day(s)"; }
                else if (daysLeft <= 90) { targetStage = 1; stageLabel = $"prescribes in {daysLeft} day(s)"; }
                else continue; // more than 90 days out — nothing to send yet

                if (targetStage <= c.PrescriptionReminderStage) continue;

                var rows = new (string, string)[]
                {
                    ("Case #", c.CaseNumber),
                    ("Client", $"{c.Client.FirstName} {c.Client.LastName}".Trim()),
                    ("Matter type", c.MatterType?.Name ?? "—"),
                    ("Prescription date", c.DeadlineDate.Value.ToString("dd MMM yyyy")),
                };

                var to = new List<string>();
                if (c.AssignedUser != null && !string.IsNullOrWhiteSpace(c.AssignedUser.Email))
                    to.Add(c.AssignedUser.Email);
                if (c.SupervisorUser != null && !string.IsNullOrWhiteSpace(c.SupervisorUser.Email))
                    to.Add(c.SupervisorUser.Email);
                to = to.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (to.Count == 0)
                    to = await AdminEmailsAsync(c.OrganizationId);

                var urgent = targetStage >= 3;
                if (to.Count > 0)
                {
                    var subject = targetStage == 4
                        ? $"Case {c.CaseNumber} has reached its prescription date"
                        : $"Case {c.CaseNumber} {stageLabel}";
                    var intro = targetStage == 4
                        ? "This matter's prescription date has passed. Please confirm whether this has already been attended to."
                        : "This matter is approaching its prescription date. Please confirm whether this has already been attended to, to avoid further reminders.";

                    await SafeSendAsync(to, subject,
                        Shell(urgent ? "Prescription Deadline — Urgent" : "Prescription Deadline Reminder",
                            $"{intro}{Table(rows)}"));
                }

                c.PrescriptionReminderStage = targetStage;
                touched.Add(c);
            }

            if (touched.Count > 0)
                await _db.SaveChangesAsync(ct);
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

        // 'Mooxy' is the same brand font declared in the web app (index.css). Email clients
        // mostly won't fetch @font-face at all (Gmail, Outlook.com/desktop and most mobile
        // mail apps ignore it entirely and silently use the fallback stack below); the ones
        // that do honor embedded webfonts (notably Apple/iOS Mail) need the file reachable at
        // a stable, absolute URL — /fonts/mooxy.woff must exist in the deployed wwwroot
        // (copy it from lexumlinkapp.client/src/assets/fonts/mooxy.woff; it isn't part of the
        // Vite-bundled, content-hashed assets so it won't move around on rebuilds).
        private const string BrandFontStack = "'Mooxy',Segoe UI,Arial,sans-serif";

        private static string Shell(string heading, string bodyHtml)
        {
            return $@"<!DOCTYPE html><html><head>
<style>
  @font-face {{
    font-family: 'Mooxy';
    src: url('/fonts/mooxy.woff') format('woff');
    font-weight: 400;
    font-style: normal;
  }}
</style>
</head><body style=""margin:0;background:#EED9B9;font-family:{BrandFontStack}"">
<div style=""max-width:560px;margin:0 auto;padding:24px"">
  <div style=""background:#5E0006;color:#EED9B9;padding:18px 24px;border-radius:12px 12px 0 0;font-weight:800;font-size:18px;letter-spacing:.5px;font-family:{BrandFontStack}"">Lexum<span style=""color:#fff"">Link</span></div>
  <div style=""background:#FBF5EC;padding:24px;border-radius:0 0 12px 12px;color:#2A0A0C"">
    <h2 style=""margin:0 0 10px;font-size:20px;color:#5E0006;font-family:{BrandFontStack}"">{heading}</h2>
    <div style=""font-size:14px;line-height:1.6;color:#4a2e2a;font-family:{BrandFontStack}"">{bodyHtml}</div>
    <p style=""margin-top:24px;font-size:12px;color:#9C7F79"">You are receiving this because you are an operator on Lexum Link.</p>
  </div>
</div></body></html>";
        }
    }
}
