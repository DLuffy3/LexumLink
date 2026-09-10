namespace LexumLinkApp.Server.Models
{
    // A simple audit/event trail per case — mirrors the "event history" shown at the
    // bottom of a matter in Prescription Alert (e.g. "Lodged Claim (RAF1)", "Claim
    // registered by Prescription Alert"). Some events are logged automatically by the
    // system (case created, status changed, document uploaded); others can be added
    // manually by a user (e.g. "Statutory notice served", "Summons issued").
    public class CaseEvent
    {
        public Guid Id { get; set; }
        public Guid CaseId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string? Notes { get; set; }
        public Guid? AddedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Case Case { get; set; } = null!;
        public User? AddedByUser { get; set; }
    }
}
