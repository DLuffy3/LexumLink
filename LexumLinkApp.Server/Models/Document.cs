namespace LexumLinkApp.Server.Models
{
    public class Document
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? CaseId { get; set; }
        public Guid? ClientId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // raf_form, police_report, medical, financial, identity, litigation
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public Guid? UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public Organization Organization { get; set; } = null!;
        public Case? Case { get; set; }
        public Client? Client { get; set; }
        public User? Uploader { get; set; }
    }
}