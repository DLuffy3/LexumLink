using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    // Platform-wide settings (branding, SMTP, password policy, session/lockout rules)
    // editable from the Super Admin Settings page.
    [Authorize]
    [ApiController]
    [Route("api/admin/settings")]
    public class AdminSettingsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IPlatformSettingsService _settingsService;
        private readonly IEmailService _emailService;

        public AdminSettingsController(LexumLinkDbContext context, IPlatformSettingsService settingsService, IEmailService emailService)
        {
            _context = context;
            _settingsService = settingsService;
            _emailService = emailService;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        // GET: api/admin/settings
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var s = await _settingsService.GetAsync();
            return Ok(new
            {
                s.SiteName,
                s.SupportEmail,
                s.SmtpEnabled,
                s.SmtpHost,
                s.SmtpPort,
                s.SmtpUsername,
                // Never send the actual password back to the client — just whether one is set.
                SmtpPasswordSet = !string.IsNullOrEmpty(s.SmtpPassword),
                s.SmtpUseStartTls,
                s.SmtpFromEmail,
                s.SmtpFromName,
                s.PasswordMinLength,
                s.PasswordRequireUppercase,
                s.PasswordRequireNumber,
                s.PasswordRequireSpecialChar,
                s.SessionTimeoutMinutes,
                s.MaxLoginAttempts,
                s.LockoutDurationMinutes,
                s.CaseIdleDays,
                s.CaseArchiveDays,
                s.UpdatedAt
            });
        }

        // PUT: api/admin/settings
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var s = await _settingsService.GetAsync();

            s.SiteName = request.SiteName;
            s.SupportEmail = request.SupportEmail;

            s.SmtpEnabled = request.SmtpEnabled;
            s.SmtpHost = request.SmtpHost;
            s.SmtpPort = request.SmtpPort;
            s.SmtpUsername = request.SmtpUsername;
            // Only overwrite the stored password if a new one was actually entered —
            // the client never receives the real value back, so an empty field means "unchanged".
            if (!string.IsNullOrEmpty(request.SmtpPassword))
                s.SmtpPassword = request.SmtpPassword;
            s.SmtpUseStartTls = request.SmtpUseStartTls;
            s.SmtpFromEmail = request.SmtpFromEmail;
            s.SmtpFromName = request.SmtpFromName;

            s.PasswordMinLength = request.PasswordMinLength;
            s.PasswordRequireUppercase = request.PasswordRequireUppercase;
            s.PasswordRequireNumber = request.PasswordRequireNumber;
            s.PasswordRequireSpecialChar = request.PasswordRequireSpecialChar;
            s.SessionTimeoutMinutes = request.SessionTimeoutMinutes;
            s.MaxLoginAttempts = request.MaxLoginAttempts;
            s.LockoutDurationMinutes = request.LockoutDurationMinutes;
            s.CaseIdleDays = request.CaseIdleDays;
            s.CaseArchiveDays = request.CaseArchiveDays;
            s.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings updated" });
        }

        // POST: api/admin/settings/test-email — sends a real email through the currently
        // saved SMTP config and reports back whether it actually worked. Send failures are
        // normally caught and only logged server-side (so ticket/notification emails never
        // block on a broken mail server) — this endpoint is the one place that surfaces the
        // real error back to the admin instead of swallowing it.
        [HttpPost("test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.ToEmail))
                return BadRequest(new { error = "Enter an email address to send the test to." });

            var settings = await _settingsService.GetAsync();
            if (!settings.SmtpEnabled)
                return BadRequest(new { error = "SMTP is not enabled. Tick \"Enabled\" and save before sending a test." });
            if (string.IsNullOrWhiteSpace(settings.SmtpHost))
                return BadRequest(new { error = "SMTP host is empty. Fill in and save your SMTP details before sending a test." });

            try
            {
                await _emailService.SendAsync(
                    new[] { request.ToEmail },
                    "LexumLink test email",
                    "<p>This is a test email from your LexumLink platform settings. If you received this, outgoing email is configured correctly.</p>");
                return Ok(new { message = $"Test email sent to {request.ToEmail}." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Failed to send: {ex.Message}" });
            }
        }
    }

    public class TestEmailRequest
    {
        public string ToEmail { get; set; } = "";
    }

    public class UpdateSettingsRequest
    {
        public string SiteName { get; set; } = "LexumLink";
        public string SupportEmail { get; set; } = "";

        public bool SmtpEnabled { get; set; }
        public string SmtpHost { get; set; } = "";
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = "";
        public string? SmtpPassword { get; set; }
        public bool SmtpUseStartTls { get; set; } = true;
        public string SmtpFromEmail { get; set; } = "";
        public string SmtpFromName { get; set; } = "";

        public int PasswordMinLength { get; set; } = 8;
        public bool PasswordRequireUppercase { get; set; } = true;
        public bool PasswordRequireNumber { get; set; } = true;
        public bool PasswordRequireSpecialChar { get; set; }
        public int SessionTimeoutMinutes { get; set; } = 10080;
        public int MaxLoginAttempts { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;

        public int CaseIdleDays { get; set; } = 14;
        public int CaseArchiveDays { get; set; } = 90;
    }
}
