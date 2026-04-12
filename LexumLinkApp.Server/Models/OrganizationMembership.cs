namespace LexumLinkApp.Server.Models
{
    public class OrganizationMembership
    {
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }
        public string Role { get; set; } = "viewer"; // admin, operator, viewer
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Organization Organization { get; set; } = null!;
    }
}