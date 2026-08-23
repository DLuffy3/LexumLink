using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordPolicyService _passwordPolicy;

        public AdminController(LexumLinkDbContext context, IJwtService jwtService, IPasswordPolicyService passwordPolicy)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordPolicy = passwordPolicy;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { error = "Email already exists" });

            var passwordErrors = await _passwordPolicy.ValidateAsync(request.Password);
            if (passwordErrors.Count > 0)
                return BadRequest(new { error = string.Join(" ", passwordErrors) });

            Guid orgId;
            if (request.CreateNewOrganization && !string.IsNullOrWhiteSpace(request.NewOrganizationName))
            {
                var newOrg = new Organization { Name = request.NewOrganizationName };
                _context.Organizations.Add(newOrg);
                await _context.SaveChangesAsync();
                orgId = newOrg.Id;
            }
            else if (request.ExistingOrganizationId.HasValue)
            {
                orgId = request.ExistingOrganizationId.Value;
                var exists = await _context.Organizations.AnyAsync(o => o.Id == orgId);
                if (!exists) return BadRequest(new { error = "Organization does not exist" });
            }
            else
            {
                return BadRequest(new { error = "Must select or create an organization" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                OrganizationId = orgId,
                IsSuperAdmin = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User created", userId = user.Id });
        }

        // GET: api/admin/users — every user across every organization, for the Super Admin Users page.
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var users = await _context.Users
                .Include(u => u.Organization)
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.IsSuperAdmin,
                    u.IsActive,
                    u.CreatedAt,
                    OrganizationId = u.OrganizationId,
                    OrganizationName = u.Organization != null ? u.Organization.Name : null,
                    IsLocked = u.LockedUntil != null && u.LockedUntil > DateTime.UtcNow
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/admin/users/{id} — single user for the edit page.
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var user = await _context.Users.Include(u => u.Organization).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.IsSuperAdmin,
                user.IsActive,
                user.CreatedAt,
                OrganizationId = user.OrganizationId,
                OrganizationName = user.Organization != null ? user.Organization.Name : null
            });
        }

        // PUT: api/admin/users/{id} — edit a user's details, org assignment, super-admin flag and active status.
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase) &&
                await _context.Users.AnyAsync(u => u.Id != id && u.Email == request.Email))
            {
                return BadRequest(new { error = "Email already exists" });
            }

            if (request.OrganizationId.HasValue)
            {
                var orgExists = await _context.Organizations.AnyAsync(o => o.Id == request.OrganizationId.Value);
                if (!orgExists) return BadRequest(new { error = "Organization does not exist" });
            }

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            user.OrganizationId = request.OrganizationId;
            user.IsSuperAdmin = request.IsSuperAdmin;
            user.IsActive = request.IsActive;

            // Unlocking a locked-out account from the admin edit page.
            if (!request.IsActive || request.ResetLockout)
            {
                user.FailedLoginAttempts = 0;
                user.LockedUntil = null;
            }

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                var passwordErrors = await _passwordPolicy.ValidateAsync(request.NewPassword);
                if (passwordErrors.Count > 0)
                    return BadRequest(new { error = string.Join(" ", passwordErrors) });
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated" });
        }

        // GET: api/admin/dashboard — platform-wide totals, capacity and trend data for the
        // Super Admin Dashboard: what needs attention, right now, across every organization.
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var totalOrganizations = await _context.Organizations.CountAsync();
            var totalUsers = await _context.Users.CountAsync();
            var totalClients = await _context.Clients.CountAsync();
            var totalCases = await _context.Cases.CountAsync();
            var totalClaims = await _context.Claims.CountAsync();
            var openTickets = await _context.Tickets.CountAsync(t => t.Status != "complete");
            var criticalTickets = await _context.Tickets.CountAsync(t => t.Status == "critical");
            var totalStorageUsedBytes = await _context.Documents.SumAsync(d => (long?)d.FileSize) ?? 0;

            var recentSignups = await _context.Users
                .Include(u => u.Organization)
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.CreatedAt,
                    OrganizationName = u.Organization != null ? u.Organization.Name : null
                })
                .ToListAsync();

            // Signups per day for the last 14 days, zero-filled so the trend chart has no gaps.
            var since = DateTime.UtcNow.Date.AddDays(-13);
            var signupsRaw = await _context.Users
                .Where(u => u.CreatedAt >= since)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();
            var signupTrend = Enumerable.Range(0, 14)
                .Select(i => since.AddDays(i))
                .Select(d => new
                {
                    date = d.ToString("yyyy-MM-dd"),
                    count = signupsRaw.FirstOrDefault(s => s.Date == d)?.Count ?? 0
                })
                .ToList();

            // Ticket volume by status, for a platform-wide breakdown chart.
            var ticketsByStatusRaw = await _context.Tickets
                .GroupBy(t => t.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();
            var ticketsByStatus = new
            {
                @new = ticketsByStatusRaw.FirstOrDefault(t => t.Status == "new")?.Count ?? 0,
                active = ticketsByStatusRaw.FirstOrDefault(t => t.Status == "active")?.Count ?? 0,
                critical = ticketsByStatusRaw.FirstOrDefault(t => t.Status == "critical")?.Count ?? 0,
                complete = ticketsByStatusRaw.FirstOrDefault(t => t.Status == "complete")?.Count ?? 0
            };

            // Per-organization capacity: usage vs plan limits for users, clients and storage,
            // plus active/inactive user split and open/critical ticket counts, so a super admin
            // can spot at a glance which organizations are near capacity or need support.
            var organizations = await _context.Organizations
                .OrderBy(o => o.Name)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Plan,
                    o.IsActive,
                    o.MaxUsers,
                    o.MaxClients,
                    o.StorageLimitGb,
                    UserCount = o.Users.Count,
                    ActiveUserCount = o.Users.Count(u => u.IsActive),
                    ClientCount = o.Clients.Count,
                    StorageUsedBytes = o.Documents.Sum(d => (long?)d.FileSize) ?? 0,
                    OpenTickets = o.Tickets.Count(t => t.Status != "complete"),
                    CriticalTickets = o.Tickets.Count(t => t.Status == "critical")
                })
                .ToListAsync();

            return Ok(new
            {
                totals = new
                {
                    organizations = totalOrganizations,
                    users = totalUsers,
                    clients = totalClients,
                    cases = totalCases,
                    claims = totalClaims,
                    openTickets,
                    criticalTickets,
                    storageUsedBytes = totalStorageUsedBytes
                },
                recentSignups,
                signupTrend,
                ticketsByStatus,
                organizations
            });
        }
    }

    public class CreateUserRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public bool CreateNewOrganization { get; set; }
        public string? NewOrganizationName { get; set; }
        public Guid? ExistingOrganizationId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public Guid? OrganizationId { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool IsActive { get; set; } = true;
        public bool ResetLockout { get; set; }
        public string? NewPassword { get; set; }
    }
}