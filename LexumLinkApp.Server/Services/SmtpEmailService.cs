using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace LexumLinkApp.Server.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IOptions<EmailSettings> options, ILogger<SmtpEmailService> logger)
        {
            _settings = options.Value;
            _logger = logger;
        }

        public async Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, CancellationToken ct = default)
        {
            var recipients = to.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
            if (recipients.Count == 0) return;

            // Dev-safe: if disabled or unconfigured, log instead of sending.
            if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.Host))
            {
                _logger.LogInformation("[Email disabled] Would send \"{Subject}\" to {Recipients}",
                    subject, string.Join(", ", recipients));
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
            foreach (var r in recipients) message.To.Add(MailboxAddress.Parse(r));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                var socket = _settings.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
                await client.ConnectAsync(_settings.Host, _settings.Port, socket, ct);
                if (!string.IsNullOrWhiteSpace(_settings.Username))
                    await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);
                await client.SendAsync(message, ct);
            }
            finally
            {
                if (client.IsConnected) await client.DisconnectAsync(true, ct);
            }
        }
    }
}
