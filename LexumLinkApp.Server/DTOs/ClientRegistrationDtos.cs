namespace LexumLinkApp.Server.DTOs
{
    // Submitted from the public /signup page.
    public class SubmitClientRegistrationRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? TradingName { get; set; }
        public string? CompanyRegistrationNumber { get; set; }
        public string? VatNumber { get; set; }
        public string? NatureOfBusiness { get; set; }

        public string ContactFullName { get; set; } = string.Empty;
        public string? ContactPosition { get; set; }
        public string ContactMobile { get; set; } = string.Empty;
        public string? ContactAlternateNumber { get; set; }
        public string ContactEmail { get; set; } = string.Empty;
        public string? ContactWhatsApp { get; set; }

        public string PhysicalAddress { get; set; } = string.Empty;
        public string? PostalAddress { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }

        public string ServicePackage { get; set; } = "starter";
        public string? ServicePackageOther { get; set; }
        public string? AdditionalRequirements { get; set; }
        public decimal? MonthlyServiceFee { get; set; }
        public string? PaymentDuePreference { get; set; }
        public string? PaymentDueOther { get; set; }

        public bool DeclarationAccepted { get; set; }
        public bool PopiaConsent { get; set; }
        public string ClientInitials { get; set; } = string.Empty;

        public string SignedFullName { get; set; } = string.Empty;
        public string? SignedPosition { get; set; }
        // Base64 data URL from the canvas signature pad, e.g. "data:image/png;base64,...."
        public string SignatureDataUrl { get; set; } = string.Empty;

        // The exact agreement text (with placeholders already filled in) the client saw
        // and agreed to, generated client-side from the same template used to compose
        // AgreementSnapshot — sent up so the confirmation email/receipt matches verbatim.
        public string AgreementText { get; set; } = string.Empty;
    }

    public class ClientRegistrationSummaryResponse
    {
        public Guid Id { get; set; }
        public string ClientReferenceNumber { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string ContactFullName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ServicePackage { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class ClientRegistrationDetailResponse : ClientRegistrationSummaryResponse
    {
        public string? TradingName { get; set; }
        public string? CompanyRegistrationNumber { get; set; }
        public string? VatNumber { get; set; }
        public string? NatureOfBusiness { get; set; }
        public string? ContactPosition { get; set; }
        public string ContactMobile { get; set; } = string.Empty;
        public string? ContactAlternateNumber { get; set; }
        public string? ContactWhatsApp { get; set; }
        public string PhysicalAddress { get; set; } = string.Empty;
        public string? PostalAddress { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }
        public string? ServicePackageOther { get; set; }
        public string? AdditionalRequirements { get; set; }
        public decimal? MonthlyServiceFee { get; set; }
        public string? PaymentDuePreference { get; set; }
        public string? PaymentDueOther { get; set; }
        public bool DeclarationAccepted { get; set; }
        public bool PopiaConsent { get; set; }
        public string ClientInitials { get; set; } = string.Empty;
        public string SignedFullName { get; set; } = string.Empty;
        public string? SignedPosition { get; set; }
        public string SignatureImageUrl { get; set; } = string.Empty;
        public DateTime SignedAt { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string AgreementSnapshot { get; set; } = string.Empty;
        public string? ReviewedByName { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public Guid? LinkedOrganizationId { get; set; }
    }

    public class ActivateRegistrationRequest
    {
        public string OrganizationName { get; set; } = string.Empty;
        public string Plan { get; set; } = "starter";
        public int MaxUsers { get; set; } = 1;
        public int? MaxClients { get; set; }
        public int StorageLimitGb { get; set; } = 5;

        // First admin user for the new organization — defaults to the registration's
        // contact person but editable before activating.
        public string AdminFirstName { get; set; } = string.Empty;
        public string AdminLastName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
    }

    public class RejectRegistrationRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}
