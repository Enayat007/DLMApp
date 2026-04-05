using DoctorLicenseManagement.Domain.Entities;

namespace DoctorLicenseManagement.Domain.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default);
    Task<Tenant?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool>    SubdomainExistsAsync(string subdomain, CancellationToken ct = default);
    Task          AddAsync(Tenant tenant, CancellationToken ct = default);
    Task          SaveChangesAsync(CancellationToken ct = default);
}
