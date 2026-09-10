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
        // DeadlineDate doubles as the Prescription Date for cases registered with a matter
        // type (see PrescriptionAlert below) — it already drives the daily digest and
        // analytics "upcoming deadline" figures, so prescription tracking reuses it rather
        // than adding a second, competing date field.
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

        // Prescription Alert tracking (modelled on LPIIF's Prescription Alert system).
        // IncidentDate above doubles as the "Occurrence Date". DeadlineDate above doubles
        // as the "Prescription Date" — auto-calculated from IncidentDate + the matter
        // type's default period when both are set, but always manually overridable.
        public Guid? MatterTypeId { get; set; }
        public DateTime? LodgementDate { get; set; }
        public DateTime? StatutoryNoticeDate { get; set; }
        public DateTime? SummonsServedDate { get; set; }
        public Guid? SupervisorUserId { get; set; }
        // Tracks which escalating prescription reminder (0=none, 1=90-day, 2=30-day,
        // 3=7-day, 4=overdue) has last been sent, so the daily job only sends each stage
        // once. Reset to 0 whenever DeadlineDate changes.
        public int PrescriptionReminderStage { get; set; }

        public Organization Organization { get; set; } = null!;
        public Client Client { get; set; } = null!;
        public User? AssignedUser { get; set; }
        public PrescriptionMatterType? MatterType { get; set; }
        public User? SupervisorUser { get; set; }
        public ICollection<ClientClaim> Claims { get; set; } = new List<ClientClaim>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<CaseEvent> Events { get; set; } = new List<CaseEvent>();
    }
}