using System.ComponentModel.DataAnnotations;

namespace LexumLinkApp.Server.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid? OrganizationId { get; set; }           
        public Organization? Organization { get; set; }  
        public bool IsSuperAdmin { get; set; }
        public bool IsActive { get; set; } = true;

        // Login lockout tracking (enforced in AuthController using PlatformSettings).
        public int FailedLoginAttempts { get; set; }
        public DateTime? LockedUntil { get; set; }

        public ICollection<Document> UploadedDocuments { get; set; } = new List<Document>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}