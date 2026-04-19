namespace LexumLinkApp.Server.DTOs
{
    public class CaseRequest
    {
        public Guid ClientId { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "open";
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }
    }
}