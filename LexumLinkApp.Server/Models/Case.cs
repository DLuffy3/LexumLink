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
        public string Status { get; set; } = "open"; // open, in_progress, closed, critical
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public Client Client { get; set; } = null!;
        public ICollection<ClientClaim> Claims { get; set; } = new List<ClientClaim>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}