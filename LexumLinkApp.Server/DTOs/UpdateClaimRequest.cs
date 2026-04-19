public class UpdateClaimRequest
{
    public string ClaimNumber { get; set; } = "";
    public string Status { get; set; } = "";
    public string? RafReference { get; set; }
    public decimal? AmountRequested { get; set; }
    public decimal? AmountAwarded { get; set; }
}