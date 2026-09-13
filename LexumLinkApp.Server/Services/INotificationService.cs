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

        // Prescription Alert: escalating 90/30/7-day reminders ahead of a case's
        // Prescription Date (Case.DeadlineDate).
        Task NotifyPrescriptionDeadlinesAsync(CancellationToken ct = default);

        // Public sign-up: notifies LexumLink's sales team of a new client registration
        // awaiting review, and sends the registrant a confirmation with their reference number.
        Task NotifyClientRegistrationAsync(ClientRegistration registration);

        // Sent once a Super Admin activates a registration — gives the new organization's
        // first admin user their login and a generated temporary password. Returns null on
        // success, or a human-readable reason the email didn't go out (SMTP not configured,
        // send failure, etc.) so the caller can surface it instead of failing silently.
        Task<string?> NotifyAccountActivatedAsync(User user, string organizationName, string tempPassword);

        // Human-readable ticket reference derived from the ticket id.
        static string TicketNumber(Guid id) => "TKT-" + id.ToString("N").Substring(0, 8).ToUpperInvariant();
    }
}
