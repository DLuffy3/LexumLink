using System.ComponentModel.DataAnnotations;
using System.Net.Sockets;
using System.Reflection.Metadata;
using System.Security.Claims;

namespace LexumLinkApp.Server.Models
{
    public class Organization
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Plan/limits — set by a super admin from the Organizations admin page.
        // Plan is a free-form string ("starter" | "professional" | "custom") rather than
        // an enum so new tiers can be added without a migration.
        public string Plan { get; set; } = "starter";
        public int MaxUsers { get; set; } = 1;
        public int? MaxClients { get; set; } = 25; // null = unlimited (custom plan)
        public int StorageLimitGb { get; set; } = 5;
        public bool IsActive { get; set; } = true;

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Client> Clients { get; set; } = new List<Client>();
        public ICollection<Case> Cases { get; set; } = new List<Case>();
        public ICollection<ClientClaim> Claims { get; set; } = new List<ClientClaim>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}