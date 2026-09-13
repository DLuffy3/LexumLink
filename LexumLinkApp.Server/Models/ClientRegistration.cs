namespace LexumLinkApp.Server.Models
{
    // A prospective law-firm customer's self-service submission of the LexumLink
    // "Client Registration & Service Agreement" — captured via the public /signup page,
    // digitally signed, and reviewed/activated by LexumLink staff (Super Admin) into a
    // real Organization + first admin User. Mirrors the paper form's sections 1-4 and
    // 9-11; billing/banking (sections 5-8) are confirmed by staff during activation
    // rather than collected from the client at signup.
    public class ClientRegistration
    {
        public Guid Id { get; set; }

        // Assigned on submission — LXL-{year}-{seq}, matches the "Client Reference Number"
        // field on the paper form.
        public string ClientReferenceNumber { get; set; } = string.Empty;

        // Section 1 — Client / Company details
        public string CompanyName { get; set; } = string.Empty;
        public string? TradingName { get; set; }
        public string? CompanyRegistrationNumber { get; set; }
        public string? VatNumber { get; set; }
        public string? NatureOfBusiness { get; set; }

        // Section 2 — Contact person
        public string ContactFullName { get; set; } = string.Empty;
        public string? ContactPosition { get; set; }
        public string ContactMobile { get; set; } = string.Empty;
        public string? ContactAlternateNumber { get; set; }
        public string ContactEmail { get; set; } = string.Empty;
        public string? ContactWhatsApp { get; set; }

        // Section 3 — Company address
        public string PhysicalAddress { get; set; } = string.Empty;
        public string? PostalAddress { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }

        // Section 4 — Service required
        // "starter" | "professional" | "enterprise" | "other"
        public string ServicePackage { get; set; } = "starter";
        public string? ServicePackageOther { get; set; }
        public string? AdditionalRequirements { get; set; }

        // Section 5 — Client account (fee is per-user list price at signup time; the
        // actual monthly total is confirmed by staff at activation based on seat count).
        public decimal? MonthlyServiceFee { get; set; }
        // "1st" | "7th" | "15th" | "Other"
        public string? PaymentDuePreference { get; set; }
        public string? PaymentDueOther { get; set; }

        // Section 9/10 — Declaration & POPIA consent
        public bool DeclarationAccepted { get; set; }
        public bool PopiaConsent { get; set; }
        public string ClientInitials { get; set; } = string.Empty;

        // Section 11 — Client signature
        public string SignedFullName { get; set; } = string.Empty;
        public string? SignedPosition { get; set; }
        public string SignatureImageUrl { get; set; } = string.Empty;
        public DateTime SignedAt { get; set; }

        // E-signature audit trail (ECT Act — evidence of who/when/where signed)
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        // The fully composed agreement text (placeholders filled in) exactly as it was
        // presented to and signed by the client — kept as a permanent record even if the
        // live template text changes later.
        public string AgreementSnapshot { get; set; } = string.Empty;

        // Review / activation (section 12/13 — LexumLink office use)
        // "pending" | "activated" | "rejected"
        public string Status { get; set; } = "pending";
        public Guid? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public Guid? LinkedOrganizationId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? ReviewedByUser { get; set; }
        public Organization? LinkedOrganization { get; set; }
    }
}
