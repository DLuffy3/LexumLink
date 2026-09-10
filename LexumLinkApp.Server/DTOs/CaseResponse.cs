namespace LexumLinkApp.Server.DTOs
{
    public class CaseResponse
    {
        public Guid Id { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string? ClientPhotoUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsArchived { get; set; }

        // Assignment
        public Guid? AssignedUserId { get; set; }
        public string? AssignedUserName { get; set; }

        // Prescription Alert tracking
        public Guid? MatterTypeId { get; set; }
        public string? MatterTypeName { get; set; }
        public DateTime? PrescriptionDate { get; set; } // = Case.DeadlineDate
        public DateTime? LodgementDate { get; set; }
        public DateTime? StatutoryNoticeDate { get; set; }
        public DateTime? SummonsServedDate { get; set; }
        public Guid? SupervisorUserId { get; set; }
        public string? SupervisorUserName { get; set; }
    }
}
