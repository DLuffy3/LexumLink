namespace LexumLinkApp.Server.DTOs
{
    public class MatterTypeResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? DefaultPeriodMonths { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class UpdateMatterTypeRequest
    {
        public int? DefaultPeriodMonths { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
