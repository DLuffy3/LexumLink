using System.Reflection.Metadata;
using System.Security.Claims;

namespace LexumLinkApp.Server.Models
{
    public class Case
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid ClientId { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "open";
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Analytics support
        public DateTime? DeadlineDate { get; set; }
        public DateTime? ClosedAt { get; set; }
        public Guid? AssignedUserId { get; set; }

        // Workflow automation
        public bool IsArchived { get; set; }
        public DateTime? ArchivedAt { get; set; }
        // Set when a stale-case alert email goes out, so the daily job doesn't
        // re-notify every single day — only once per idle period, and again if the
        // case gets touched and then goes stale a second time.
        public DateTime? StaleNotifiedAt { get; set; }

        public Organization Organization { get; set; } = null!;
        public Client Client { get; set; } = null!;
        public User? AssignedUser { get; set; }
        public ICollection<ClientClaim> Claims { get; set; } = new List<ClientClaim>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}