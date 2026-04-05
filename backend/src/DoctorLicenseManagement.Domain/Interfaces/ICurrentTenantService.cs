namespace DoctorLicenseManagement.Domain.Interfaces;

/// <summary>
/// Scoped service that carries the resolved tenant for the current HTTP request.
/// Populated by TenantResolutionMiddleware before any controller code runs.
/// </summary>
public interface ICurrentTenantService
{
    Guid    TenantId   { get; }
    string  Subdomain  { get; }
    bool    IsResolved { get; }

    /// <summary>Called once by middleware after the tenant is resolved from the DB.</summary>
    void Set(Guid tenantId, string subdomain);
}
