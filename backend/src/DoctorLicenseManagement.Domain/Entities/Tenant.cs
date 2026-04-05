namespace DoctorLicenseManagement.Domain.Entities;

/// <summary>
/// A workspace / company on the platform. Every piece of data is scoped to a Tenant.
/// Tenants are identified by their unique subdomain (e.g. "acme" → acme.app.com).
/// </summary>
public class Tenant
{
    public Guid     Id           { get; private set; }
    public string   Name         { get; private set; } = string.Empty;
    public string   Subdomain    { get; private set; } = string.Empty;
    public string?  LogoUrl      { get; private set; }
    public string?  PrimaryColor { get; private set; }  // hex, e.g. "#0d9488"
    public bool     IsActive     { get; private set; }
    public DateTime CreatedDate  { get; private set; }

    // Navigation
    public ICollection<User>                 Users         { get; private set; } = [];
    public ICollection<TenantSubscription>   Subscriptions { get; private set; } = [];

    private Tenant() { }

    public static Tenant Create(string name, string subdomain)
    {
        return new Tenant
        {
            Id          = Guid.NewGuid(),
            Name        = name.Trim(),
            Subdomain   = subdomain.Trim().ToLowerInvariant(),
            IsActive    = true,
            CreatedDate = DateTime.UtcNow
        };
    }

    public void UpdateBranding(string? logoUrl, string? primaryColor)
    {
        LogoUrl      = logoUrl;
        PrimaryColor = primaryColor;
    }
}
