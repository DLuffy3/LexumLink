using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.DTOs;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace LexumLinkApp.Server.Controllers
{
    // Super Admin review of public sign-ups submitted via ClientRegistrationController —
    // the "LexumLink office use" step (section 12/13 of the paper agreement): verify the
    // details, then activate (creates the real Organization + first admin User) or reject.
    [Authorize]
    [ApiController]
    [Route("api/admin/client-registrations")]
    public class AdminClientRegistrationsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly INotificationService _notify;

        public AdminClientRegistrationsController(LexumLinkDbContext context, INotificationService notify)
        {
            _context = context;
            _notify = notify;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Cryptographically random password guaranteed to include upper/lower/digit/symbol,
        // so it satisfies any reasonable password policy regardless of current settings.
        private static string GenerateTempPassword()
        {
            const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string lower = "abcdefghijkmnopqrstuvwxyz";
            const string digits = "23456789";
            const string special = "!@#$%^&*";
            const string all = upper + lower + digits + special;

            char Pick(string alphabet) => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];

            var chars = new List<char> { Pick(upper), Pick(lower), Pick(digits), Pick(special) };
            for (var i = 0; i < 10; i++) chars.Add(Pick(all));

            // Shuffle (Fisher-Yates) so the guaranteed characters aren't always in the same position.
            for (var i = chars.Count - 1; i > 0; i--)
            {
                var j = RandomNumberGenerator.GetInt32(i + 1);
                (chars[i], chars[j]) = (chars[j], chars[i]);
            }

            return new string(chars.ToArray());
        }

        // GET: api/admin/client-registrations
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!await IsSuperAdmin()) return Forbid();

            var registrations = await _context.ClientRegistrations
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ClientRegistrationSummaryResponse
                {
                    Id = r.Id,
                    ClientReferenceNumber = r.ClientReferenceNumber,
                    CompanyName = r.CompanyName,
                    ContactFullName = r.ContactFullName,
                    ContactEmail = r.ContactEmail,
                    ServicePackage = r.ServicePackage,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(registrations);
        }

        // GET: api/admin/client-registrations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(Guid id)
        {
            if (!await IsSuperAdmin()) return Forbid();

            var r = await _context.ClientRegistrations
                .Include(x => x.ReviewedByUser)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (r == null) return NotFound();

            return Ok(new ClientRegistrationDetailResponse
            {
                Id = r.Id,
                ClientReferenceNumber = r.ClientReferenceNumber,
                CompanyName = r.CompanyName,
                ContactFullName = r.ContactFullName,
                ContactEmail = r.ContactEmail,
                ServicePackage = r.ServicePackage,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                TradingName = r.TradingName,
                CompanyRegistrationNumber = r.CompanyRegistrationNumber,
                VatNumber = r.VatNumber,
                NatureOfBusiness = r.NatureOfBusiness,
                ContactPosition = r.ContactPosition,
                ContactMobile = r.ContactMobile,
                ContactAlternateNumber = r.ContactAlternateNumber,
                ContactWhatsApp = r.ContactWhatsApp,
                PhysicalAddress = r.PhysicalAddress,
                PostalAddress = r.PostalAddress,
                Province = r.Province,
                PostalCode = r.PostalCode,
                ServicePackageOther = r.ServicePackageOther,
                AdditionalRequirements = r.AdditionalRequirements,
                MonthlyServiceFee = r.MonthlyServiceFee,
                PaymentDuePreference = r.PaymentDuePreference,
                PaymentDueOther = r.PaymentDueOther,
                DeclarationAccepted = r.DeclarationAccepted,
                PopiaConsent = r.PopiaConsent,
                ClientInitials = r.ClientInitials,
                SignedFullName = r.SignedFullName,
                SignedPosition = r.SignedPosition,
                SignatureImageUrl = r.SignatureImageUrl,
                SignedAt = r.SignedAt,
                IpAddress = r.IpAddress,
                UserAgent = r.UserAgent,
                AgreementSnapshot = r.AgreementSnapshot,
                ReviewedByName = r.ReviewedByUser != null ? $"{r.ReviewedByUser.FirstName} {r.ReviewedByUser.LastName}" : null,
                ReviewedAt = r.ReviewedAt,
                RejectionReason = r.RejectionReason,
                LinkedOrganizationId = r.LinkedOrganizationId
            });
        }

        // POST: api/admin/client-registrations/{id}/activate
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> Activate(Guid id, [FromBody] ActivateRegistrationRequest request)
        {
            if (!await IsSuperAdmin()) return Forbid();

            var registration = await _context.ClientRegistrations.FirstOrDefaultAsync(r => r.Id == id);
            if (registration == null) return NotFound();
            if (registration.Status == "activated")
                return BadRequest(new { error = "This registration has already been activated." });

            if (string.IsNullOrWhiteSpace(request.OrganizationName))
                return BadRequest(new { error = "Organization name is required." });
            if (string.IsNullOrWhiteSpace(request.AdminEmail) || string.IsNullOrWhiteSpace(request.AdminFirstName) || string.IsNullOrWhiteSpace(request.AdminLastName))
                return BadRequest(new { error = "Admin first name, last name and email are required." });
            if (await _context.Users.AnyAsync(u => u.Email == request.AdminEmail))
                return BadRequest(new { error = "A user with that email already exists." });

            var org = new Organization
            {
                Id = Guid.NewGuid(),
                Name = request.OrganizationName,
                Plan = request.Plan,
                MaxUsers = request.MaxUsers,
                MaxClients = request.MaxClients,
                StorageLimitGb = request.StorageLimitGb,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Organizations.Add(org);

            var tempPassword = GenerateTempPassword();
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Email = request.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                FirstName = request.AdminFirstName,
                LastName = request.AdminLastName,
                OrganizationId = org.Id,
                IsSuperAdmin = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(adminUser);

            registration.Status = "activated";
            registration.ReviewedByUserId = GetUserId();
            registration.ReviewedAt = DateTime.UtcNow;
            registration.LinkedOrganizationId = org.Id;

            await _context.SaveChangesAsync();

            var emailWarning = await _notify.NotifyAccountActivatedAsync(adminUser, org.Name, tempPassword);

            return Ok(new
            {
                message = "Registration activated",
                organizationId = org.Id,
                userId = adminUser.Id,
                emailWarning
            });
        }

        // POST: api/admin/client-registrations/{id}/reject
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRegistrationRequest request)
        {
            if (!await IsSuperAdmin()) return Forbid();

            var registration = await _context.ClientRegistrations.FirstOrDefaultAsync(r => r.Id == id);
            if (registration == null) return NotFound();
            if (registration.Status == "activated")
                return BadRequest(new { error = "This registration has already been activated and can't be rejected." });

            registration.Status = "rejected";
            registration.RejectionReason = request.Reason;
            registration.ReviewedByUserId = GetUserId();
            registration.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Registration rejected" });
        }
    }
}
