using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.DTOs;
using LexumLinkApp.Server.Models;
using LexumLinkApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LexumLinkApp.Server.Controllers
{
    // Public, unauthenticated endpoint behind the marketing site's /signup page. A
    // prospective law firm submits its details, digitally signs the Client Registration &
    // Service Agreement (drawn signature), and lands here as a "pending" record for staff
    // to review and activate — see AdminClientRegistrationsController.
    [ApiController]
    [Route("api/client-registrations")]
    public class ClientRegistrationController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly INotificationService _notify;

        public ClientRegistrationController(LexumLinkDbContext context, IWebHostEnvironment environment, INotificationService notify)
        {
            _context = context;
            _environment = environment;
            _notify = notify;
        }

        private string WebRoot() => _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        // Global (not per-org, since no Organization exists yet at this point) sequence,
        // resetting yearly: LXL-{year}-{seq}.
        private async Task<string> GenerateReferenceNumberAsync()
        {
            var prefix = $"LXL-{DateTime.UtcNow.Year}-";
            var existing = await _context.ClientRegistrations
                .Where(r => r.ClientReferenceNumber.StartsWith(prefix))
                .Select(r => r.ClientReferenceNumber)
                .ToListAsync();

            var nextSeq = existing
                .Select(n => int.TryParse(n.AsSpan(prefix.Length), out var seq) ? seq : 0)
                .DefaultIfEmpty(0)
                .Max() + 1;

            return $"{prefix}{nextSeq:D4}";
        }

        // Signature-pad drawings always come through as PNG, but a browsed/uploaded file
        // (SignatureUpload.tsx) can be PNG, JPEG or WEBP — read the real mime type out of
        // the data URL prefix so the stored file's extension actually matches its bytes.
        private static readonly Dictionary<string, string> SignatureMimeExtensions = new()
        {
            ["image/png"] = ".png",
            ["image/jpeg"] = ".jpg",
            ["image/jpg"] = ".jpg",
            ["image/webp"] = ".webp",
        };

        private string? SaveSignatureImage(string dataUrl)
        {
            if (string.IsNullOrWhiteSpace(dataUrl)) return null;

            var commaIndex = dataUrl.IndexOf(',');
            var header = commaIndex >= 0 ? dataUrl[..commaIndex] : string.Empty;
            var base64 = commaIndex >= 0 ? dataUrl[(commaIndex + 1)..] : dataUrl;

            var ext = ".png";
            var mimeStart = header.IndexOf("data:", StringComparison.OrdinalIgnoreCase);
            if (mimeStart >= 0)
            {
                var mimeEnd = header.IndexOf(';', mimeStart);
                var mime = mimeEnd >= 0 ? header[(mimeStart + 5)..mimeEnd] : header[(mimeStart + 5)..];
                if (SignatureMimeExtensions.TryGetValue(mime.Trim().ToLowerInvariant(), out var mappedExt))
                    ext = mappedExt;
            }

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64);
            }
            catch (FormatException)
            {
                return null;
            }

            var folder = Path.Combine(WebRoot(), "uploads", "signatures");
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(folder, fileName);
            System.IO.File.WriteAllBytes(filePath, bytes);

            return $"/uploads/signatures/{fileName}";
        }

        // POST: api/client-registrations
        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] SubmitClientRegistrationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CompanyName))
                return BadRequest(new { error = "Company / client name is required." });
            if (string.IsNullOrWhiteSpace(request.ContactFullName) || string.IsNullOrWhiteSpace(request.ContactMobile) || string.IsNullOrWhiteSpace(request.ContactEmail))
                return BadRequest(new { error = "Contact name, mobile number and email are required." });
            if (string.IsNullOrWhiteSpace(request.PhysicalAddress))
                return BadRequest(new { error = "Physical address is required." });
            if (!request.DeclarationAccepted)
                return BadRequest(new { error = "You must accept the client declaration to continue." });
            if (!request.PopiaConsent || string.IsNullOrWhiteSpace(request.ClientInitials))
                return BadRequest(new { error = "POPIA consent and initials are required." });
            if (string.IsNullOrWhiteSpace(request.SignedFullName))
                return BadRequest(new { error = "Please type your full name in the signature block." });
            if (string.IsNullOrWhiteSpace(request.SignatureDataUrl))
                return BadRequest(new { error = "Please draw your signature before submitting." });

            var signatureUrl = SaveSignatureImage(request.SignatureDataUrl);
            if (signatureUrl == null)
                return BadRequest(new { error = "Signature image could not be processed. Please try signing again." });

            var referenceNumber = await GenerateReferenceNumberAsync();

            var registration = new ClientRegistration
            {
                Id = Guid.NewGuid(),
                ClientReferenceNumber = referenceNumber,
                CompanyName = request.CompanyName,
                TradingName = request.TradingName,
                CompanyRegistrationNumber = request.CompanyRegistrationNumber,
                VatNumber = request.VatNumber,
                NatureOfBusiness = request.NatureOfBusiness,
                ContactFullName = request.ContactFullName,
                ContactPosition = request.ContactPosition,
                ContactMobile = request.ContactMobile,
                ContactAlternateNumber = request.ContactAlternateNumber,
                ContactEmail = request.ContactEmail,
                ContactWhatsApp = request.ContactWhatsApp,
                PhysicalAddress = request.PhysicalAddress,
                PostalAddress = request.PostalAddress,
                Province = request.Province,
                PostalCode = request.PostalCode,
                ServicePackage = request.ServicePackage,
                ServicePackageOther = request.ServicePackageOther,
                AdditionalRequirements = request.AdditionalRequirements,
                MonthlyServiceFee = request.MonthlyServiceFee,
                PaymentDuePreference = request.PaymentDuePreference,
                PaymentDueOther = request.PaymentDueOther,
                DeclarationAccepted = request.DeclarationAccepted,
                PopiaConsent = request.PopiaConsent,
                ClientInitials = request.ClientInitials,
                SignedFullName = request.SignedFullName,
                SignedPosition = request.SignedPosition,
                SignatureImageUrl = signatureUrl,
                SignedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString(),
                AgreementSnapshot = request.AgreementText,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.ClientRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            await _notify.NotifyClientRegistrationAsync(registration);

            return Ok(new { message = "Registration submitted", clientReferenceNumber = referenceNumber });
        }
    }
}
