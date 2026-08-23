using LexumLinkApp.Server.Models;

namespace LexumLinkApp.Server.Services
{
    public interface INotificationService
    {
        Task NotifyNewClientAsync(Client client);
        Task NotifyTaskAssignedAsync(Todo todo);
        Task NotifyDocumentUploadedAsync(Document document, string clientName);
        Task NotifyTicketCreatedAsync(Ticket ticket);
        Task SendDailyDigestsAsync(CancellationToken ct = default);

        // Workflow automation (run daily by DailyDigestService)
        Task NotifyOverdueTasksAsync(CancellationToken ct = default);
        Task NotifyStaleCasesAsync(CancellationToken ct = default);
        Task ArchiveClosedCasesAsync(CancellationToken ct = default);

        // Human-readable ticket reference derived from the ticket id.
        static string TicketNumber(Guid id) => "TKT-" + id.ToString("N").Substring(0, 8).ToUpperInvariant();
    }
}
