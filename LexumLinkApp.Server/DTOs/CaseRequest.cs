namespace LexumLinkApp.Server.DTOs
{
    public class CaseRequest
    {
        public Guid ClientId { get; set; }
        // Case numbers are now assigned automatically (see CasesController.GenerateCaseNumberAsync)
        // and are immutable once set, so this request no longer carries one.
        public string Status { get; set; } = "open";
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }

        // Assignment
        public Guid? AssignedUserId { get; set; }

        // Prescription Alert tracking
        public Guid? MatterTypeId { get; set; }
        // If provided, used as-is; otherwise the server auto-calculates it from
        // IncidentDate + MatterType.DefaultPeriodMonths when both are available.
        public DateTime? PrescriptionDate { get; set; }
        public DateTime? LodgementDate { get; set; }
        public DateTime? StatutoryNoticeDate { get; set; }
        public DateTime? SummonsServedDate { get; set; }
        public Guid? SupervisorUserId { get; set; }
    }
}
