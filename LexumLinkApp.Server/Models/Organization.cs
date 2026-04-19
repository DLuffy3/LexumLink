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

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Client> Clients { get; set; } = new List<Client>();
        public ICollection<Case> Cases { get; set; } = new List<Case>();
        public ICollection<ClientClaim> Claims { get; set; } = new List<ClientClaim>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}