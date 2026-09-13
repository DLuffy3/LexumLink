using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Security.Authentication;

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

            // A hung/unreachable/rate-limiting mail server would otherwise stall silently
            // until IIS's own ~120s reverse-proxy timeout kills the request, surfacing a
            // generic "Operation timed out after 120000 milliseconds" with no indication of
            // what actually happened. Fail fast (20s) with a clearer message instead.
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(20));
            var linkedCt = timeoutCts.Token;

            using var client = new SmtpClient
            {
                // Some older shared-hosting mail stacks (cPanel/Exim) don't cleanly reject a
                // TLS 1.3 ClientHello from newer .NET clients — they just go quiet instead of
                // erroring, which shows up as a hang during ConnectAsync (TCP succeeds, the
                // handshake never completes) rather than a clear failure. Pinning to TLS 1.2
                // avoids offering a version the server can't handle gracefully.
                SslProtocols = SslProtocols.Tls12,
                // Certificate revocation checking (CRL/OCSP) makes an extra outbound call to
                // the CA during the handshake; if that specific destination is blocked or
                // unreachable (common behind restrictive firewalls/proxies) it can stall the
                // whole handshake even though the connection to the mail server itself is
                // fine. Skip it — the cert's trust chain and hostname are still validated.
                CheckCertificateRevocation = false
            };
            try
            {
                // Raw TCP reaching the host proves the port itself isn't blocked, so a hang
                // at ConnectAsync means the client and server disagree about who speaks
                // first. SecureSocketOptions.Auto is supposed to infer this from the port,
                // but relying on that guess is exactly the kind of ambiguity that produces a
                // silent standoff — an implicit-TLS-only port like 465 expects the TLS
                // handshake to start immediately, with no plaintext greeting first, so if
                // Auto picks the wrong mode both sides just wait for bytes the other one
                // isn't sending. Decide explicitly instead of trusting Auto to guess right.
                SecureSocketOptions socket;
                if (settings.SmtpUseStartTls)
                    socket = SecureSocketOptions.StartTls;
                else if (settings.SmtpPort == 465)
                    socket = SecureSocketOptions.SslOnConnect;
                else
                    socket = SecureSocketOptions.Auto;

                await client.ConnectAsync(settings.SmtpHost, settings.SmtpPort, socket, linkedCt);
                if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
                    await client.AuthenticateAsync(settings.SmtpUsername, settings.SmtpPassword, linkedCt);
                await client.SendAsync(message, linkedCt);
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                throw new TimeoutException($"Connection to {settings.SmtpHost}:{settings.SmtpPort} timed out after 20 seconds. The mail server may be temporarily unreachable, rate-limiting this connection, or blocking this port — try again in a minute, or check with your host if it keeps happening.");
            }
            finally
            {
                if (client.IsConnected) await client.DisconnectAsync(true, CancellationToken.None);
            }
        }
    }
}
