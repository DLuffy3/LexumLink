namespace LexumLinkApp.Server.Services
{
    public interface IEmailService
    {
        Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, CancellationToken ct = default);
    }
}
