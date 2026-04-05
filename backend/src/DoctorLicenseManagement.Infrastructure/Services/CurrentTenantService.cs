using DoctorLicenseManagement.Domain.Interfaces;

namespace DoctorLicenseManagement.Infrastructure.Services;

/// <summary>
/// Scoped service populated by TenantResolutionMiddleware.
/// Every request that passes through the middleware will have
/// TenantId/Subdomain available for the entire request lifetime.
/// </summary>
public class CurrentTenantService : ICurrentTenantService
{
    public Guid   TenantId   { get; private set; }
    public string Subdomain  { get; private set; } = string.Empty;
    public bool   IsResolved { get; private set; }

    public void Set(Guid tenantId, string subdomain)
    {
        TenantId   = tenantId;
        Subdomain  = subdomain;
        IsResolved = true;
    }
}
