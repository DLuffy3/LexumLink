namespace LexumLinkApp.Server.DTOs
{
    public class CaseEventResponse
    {
        public Guid Id { get; set; }
        public string EventType { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string? Notes { get; set; }
        public string? AddedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CaseEventRequest
    {
        public string EventType { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string? Notes { get; set; }
    }
}
