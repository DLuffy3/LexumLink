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
    }
}