using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace LexumLinkApp.Server.Services
{
    // Reads SMTP configuration live from PlatformSettings (DB-backed, editable on the
    // Super Admin Settings page) rather than a fixed appsettings.json snapshot, so changes
    // take effect immediately without a redeploy/restart.
    public class SmtpEmailService : IEmailService
    {
        private readonly IPlatformSettingsService _settingsService;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IPlatformSettingsService settingsService, ILogger<SmtpEmailService> logger)
        {
            _settingsService = settingsService;
            _logger = logger;
        }

        public async Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, CancellationToken ct = default)
        {
            var recipients = to.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
            if (recipients.Count == 0) return;

            var settings = await _settingsService.GetAsync();

            // Dev-safe: if disabled or unconfigured, log instead of sending.
            if (!settings.SmtpEnabled || string.IsNullOrWhiteSpace(settings.SmtpHost))
            {
                _logger.LogInformation("[Email disabled] Would send \"{Subject}\" to {Recipients}",
                    subject, string.Join(", ", recipients));
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(settings.SmtpFromName, settings.SmtpFromEmail));
            foreach (var r in recipients) message.To.Add(MailboxAddress.Parse(r));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                var socket = settings.SmtpUseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
                await client.ConnectAsync(settings.SmtpHost, settings.SmtpPort, socket, ct);
                if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
                    await client.AuthenticateAsync(settings.SmtpUsername, settings.SmtpPassword, ct);
                await client.SendAsync(message, ct);
            }
            finally
            {
                if (client.IsConnected) await client.DisconnectAsync(true, ct);
            }
        }
    }
}
