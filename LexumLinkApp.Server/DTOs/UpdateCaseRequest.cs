public class UpdateCaseRequest
{
    public string CaseNumber { get; set; } = "";
    public Guid ClientId { get; set; }
    public string Status { get; set; } = "open";
    public DateTime? IncidentDate { get; set; }
    public string? Description { get; set; }
}