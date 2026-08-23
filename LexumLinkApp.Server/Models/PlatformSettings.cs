namespace LexumLinkApp.Server.Models
{
    // Singleton row (there's always exactly one) holding platform-wide configuration
    // editable from the Super Admin Settings page, instead of only appsettings.json.
    public class PlatformSettings
    {
        public Guid Id { get; set; }

        // Branding
        public string SiteName { get; set; } = "LexumLink";
        public string SupportEmail { get; set; } = "support@lexumlink.co.za";

        // Email / SMTP
        public bool SmtpEnabled { get; set; }
        public string SmtpHost { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public bool SmtpUseStartTls { get; set; } = true;
        public string SmtpFromEmail { get; set; } = "no-reply@lexumlink.co.za";
        public string SmtpFromName { get; set; } = "LexumLink";

        // Security / password policy
        public int PasswordMinLength { get; set; } = 8;
        public bool PasswordRequireUppercase { get; set; } = true;
        public bool PasswordRequireNumber { get; set; } = true;
        public bool PasswordRequireSpecialChar { get; set; } = false;
        public int SessionTimeoutMinutes { get; set; } = 10080; // 7 days, matches prior hardcoded JWT expiry
        public int MaxLoginAttempts { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;

        // Workflow automation
        // Days a case can sit with no activity before its handler (or org admins) gets an alert.
        public int CaseIdleDays { get; set; } = 14;
        // Days after a case is closed before it's automatically archived.
        public int CaseArchiveDays { get; set; } = 90;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
