namespace LexumLinkApp.Server.Models
{
    public class CalendarEvent
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string Title { get; set; } = string.Empty;

        // appointment, follow_up, court_date, medical_assessment
        public string EventType { get; set; } = "appointment";

        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public bool AllDay { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }

        public Guid? ClientId { get; set; }
        public Guid? CaseId { get; set; }
        public Guid? AssignedUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public Client? Client { get; set; }
        public Case? Case { get; set; }
        public User? AssignedUser { get; set; }
    }
}
