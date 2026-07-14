using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;

namespace LexumLinkApp.Server.Controllers
{
    public class AnalyticsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;

        // Documents considered required before a case is "document complete".
        private static readonly string[] RequiredDocTypes =
            { "raf_form", "police_report", "medical", "identity" };

        public AnalyticsController(LexumLinkDbContext context)
        {
            _context = context;
        }

        // GET: api/analytics/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var orgId = GetOrganizationId();
            if (orgId == Guid.Empty) return Unauthorized(new { error = "No organization context" });

            var now = DateTime.UtcNow;
            var weekAgo = now.AddDays(-7);
            var deadlineWindow = now.AddDays(14);

            // Pull org-scoped data once, then aggregate in memory (per-org volumes are modest).
            var clients = await _context.Clients.Where(c => c.OrganizationId == orgId).ToListAsync();
            var cases = await _context.Cases.Where(c => c.OrganizationId == orgId).ToListAsync();
            var claims = await _context.Claims.Where(c => c.OrganizationId == orgId).ToListAsync();
            var docs = await _context.Documents.Where(d => d.OrganizationId == orgId).ToListAsync();
            var todos = await _context.Todos.Where(t => t.OrganizationId == orgId).ToListAsync();
            var users = await _context.Users.Where(u => u.OrganizationId == orgId).ToListAsync();

            var clientNames = clients.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}".Trim());
            var openCases = cases.Where(c => c.Status != "closed").ToList();

            // Distinct document types uploaded per case
            var docTypesByCase = docs
                .Where(d => d.CaseId.HasValue)
                .GroupBy(d => d.CaseId!.Value)
                .ToDictionary(g => g.Key, g => g.Select(d => d.DocumentType).Distinct().ToHashSet());

            bool IsAwaitingDocs(Guid caseId)
            {
                var have = docTypesByCase.TryGetValue(caseId, out var set) ? set : new HashSet<string>();
                return RequiredDocTypes.Any(r => !have.Contains(r));
            }

            var awaitingCases = openCases.Where(c => IsAwaitingDocs(c.Id)).ToList();
            var clientsAwaitingDocuments = awaitingCases.Select(c => c.ClientId).Distinct().Count();

            var closedCases = cases.Where(c => c.ClosedAt.HasValue).ToList();
            var avgCompletionDays = closedCases.Count > 0
                ? Math.Round(closedCases.Average(c => (c.ClosedAt!.Value - c.CreatedAt).TotalDays), 1)
                : 0;

            // Last 6 calendar months (oldest -> newest)
            var firstOfThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthlyGrowth = Enumerable.Range(0, 6)
                .Select(i => firstOfThisMonth.AddMonths(-5 + i))
                .Select(m => new
                {
                    month = m.ToString("MMM"),
                    clients = clients.Count(c => c.CreatedAt.Year == m.Year && c.CreatedAt.Month == m.Month),
                    cases = cases.Count(c => c.CreatedAt.Year == m.Year && c.CreatedAt.Month == m.Month),
                })
                .ToList();

            var teamPerformance = users
                .Select(u => new
                {
                    name = $"{u.FirstName} {u.LastName}".Trim(),
                    clients = clients.Count(c => c.UserId == u.Id),
                    tasksCompleted = todos.Count(t => t.UserId == u.Id && t.IsCompleted),
                    casesClosed = cases.Count(c => c.AssignedUserId == u.Id && c.ClosedAt.HasValue),
                })
                .OrderByDescending(x => x.clients + x.tasksCompleted + x.casesClosed)
                .Take(8)
                .ToList();

            var upcomingDeadlines = openCases
                .Where(c => c.DeadlineDate.HasValue)
                .OrderBy(c => c.DeadlineDate!.Value)
                .Take(6)
                .Select(c => new
                {
                    caseNumber = c.CaseNumber,
                    clientName = clientNames.TryGetValue(c.ClientId, out var n) ? n : "",
                    deadline = c.DeadlineDate,
                    daysLeft = (int)Math.Ceiling((c.DeadlineDate!.Value - now).TotalDays),
                })
                .ToList();

            var overdueTaskList = todos
                .Where(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value < now)
                .OrderBy(t => t.DueDate!.Value)
                .Take(6)
                .Select(t => new
                {
                    title = t.Title,
                    dueDate = t.DueDate,
                    daysOverdue = (int)Math.Ceiling((now - t.DueDate!.Value).TotalDays),
                })
                .ToList();

            string Titleize(string s) => string.IsNullOrEmpty(s)
                ? s
                : char.ToUpper(s[0]) + s.Substring(1).Replace('_', ' ');

            var casesByStatus = cases
                .GroupBy(c => c.Status)
                .Select(g => new { name = Titleize(g.Key), value = g.Count() })
                .ToList();

            var claimsByStatus = claims
                .GroupBy(c => c.Status)
                .Select(g => new { name = Titleize(g.Key), value = g.Count() })
                .ToList();

            var documentsStatus = new[]
            {
                new { name = "Awaiting Docs", value = awaitingCases.Count },
                new { name = "Complete", value = openCases.Count - awaitingCases.Count },
            };

            return Ok(new
            {
                summary = new
                {
                    newClientsThisWeek = clients.Count(c => c.CreatedAt >= weekAgo),
                    overdueTasks = todos.Count(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value < now),
                    casesNearingDeadline = openCases.Count(c => c.DeadlineDate.HasValue && c.DeadlineDate.Value <= deadlineWindow),
                    clientsAwaitingDocuments,
                    avgCompletionDays,
                    openCases = openCases.Count,
                    totalCases = cases.Count,
                    totalClients = clients.Count,
                },
                casesByStatus,
                claimsByStatus,
                documentsStatus,
                monthlyGrowth,
                teamPerformance,
                upcomingDeadlines,
                overdueTaskList,
            });
        }
    }
}
