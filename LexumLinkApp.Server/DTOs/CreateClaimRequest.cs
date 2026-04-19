public class CreateClaimRequest
{
    public Guid CaseId { get; set; }
    public string ClaimNumber { get; set; } = "";
    public string Status { get; set; } = "in_progress";
    public string? RafReference { get; set; }
    public decimal? AmountRequested { get; set; }
    public decimal? AmountAwarded { get; set; }
}