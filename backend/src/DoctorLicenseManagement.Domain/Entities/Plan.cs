namespace DoctorLicenseManagement.Domain.Entities;

/// <summary>
/// Subscription tier available on the platform (Free / Pro / Enterprise).
/// Plans are static configuration; they are seeded, not created via the API.
/// </summary>
public class Plan
{
    public Guid     Id            { get; private set; }
    public string   Name          { get; private set; } = string.Empty;
    public string   Slug          { get; private set; } = string.Empty;  // "free" | "pro" | "enterprise"
    public decimal  PriceMonthly  { get; private set; }
    /// <summary>-1 means unlimited.</summary>
    public int      MaxDoctors    { get; private set; }
    /// <summary>JSON-serialised string array of feature bullet points.</summary>
    public string   Features      { get; private set; } = "[]";
    public bool     IsActive      { get; private set; }
    public int      DisplayOrder  { get; private set; }

    private Plan() { }

    public bool HasDoctorCapacity(int currentCount) =>
        MaxDoctors == -1 || currentCount < MaxDoctors;
}
