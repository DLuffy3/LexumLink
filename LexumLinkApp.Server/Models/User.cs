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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid? OrganizationId { get; set; }           
        public Organization? Organization { get; set; }  
        public bool IsSuperAdmin { get; set; }
        public ICollection<Document> UploadedDocuments { get; set; } = new List<Document>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}