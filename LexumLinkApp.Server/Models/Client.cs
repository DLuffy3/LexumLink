using System.Reflection.Metadata;

namespace LexumLinkApp.Server.Models
{
    public class Client
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? IdNumber { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public ICollection<Case> Cases { get; set; } = new List<Case>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}