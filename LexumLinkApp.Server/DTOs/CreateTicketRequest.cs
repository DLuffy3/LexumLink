public class CreateTicketRequest
{
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Type { get; set; } = "bug"; // "bug" or "feature"
}