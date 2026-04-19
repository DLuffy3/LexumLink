namespace LexumLinkApp.Server.Models
{
    public class Ticket
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty; // "bug" or "feature"
        public string Status { get; set; } = "new";      // "new", "active", "critical", "complete"
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Organization Organization { get; set; } = null!;
        public User? User { get; set; }
    }
}