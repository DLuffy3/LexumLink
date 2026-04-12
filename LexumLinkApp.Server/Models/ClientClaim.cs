namespace LexumLinkApp.Server.Models
{
    public class ClientClaim
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid CaseId { get; set; }
        public string ClaimNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "in_progress"; // in_progress, completed, critical
        public string? RafReference { get; set; }
        public decimal? AmountRequested { get; set; }
        public decimal? AmountAwarded { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public Case Case { get; set; } = null!;
    }
}