namespace LexumLinkApp.Server.Models
{
    public class Ticket
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty; // bug, feature
        public string Status { get; set; } = "open"; // open, in_progress, resolved, closed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public User? User { get; set; }
    }
}