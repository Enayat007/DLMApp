using DoctorLicenseManagement.Domain.Entities;

namespace DoctorLicenseManagement.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task AddAsync(TenantSubscription subscription, CancellationToken ct = default);
    Task<TenantSubscription?> GetActiveByTenantAsync(Guid tenantId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
