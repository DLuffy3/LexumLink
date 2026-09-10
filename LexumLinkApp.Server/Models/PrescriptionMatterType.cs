namespace LexumLinkApp.Server.Models
{
    // Reference list of "matter types" a case can be registered under for prescription
    // tracking, modelled on the claim types used by LPIIF's Prescription Alert system.
    // DefaultPeriodMonths drives the automatic Prescription Date calculation on a Case
    // (OccurrenceDate + DefaultPeriodMonths). It is left null for matter types where the
    // period genuinely depends on case-specific facts (exactly as the source guide warns:
    // "It should not be assumed that the prescription period is three (3) years in all
    // cases") — for those, the firm must set the Prescription Date manually.
    //
    // These defaults are a starting point only, not legal advice. Firms should verify and
    // adjust them (via the Super Admin > Matter Types screen) for their own practice.
    public class PrescriptionMatterType
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? DefaultPeriodMonths { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }
}
