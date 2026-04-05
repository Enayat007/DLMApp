using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Enums;
using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly ApplicationDbContext _db;
    public SubscriptionRepository(ApplicationDbContext db) => _db = db;

    public async Task AddAsync(TenantSubscription subscription, CancellationToken ct = default) =>
        await _db.TenantSubscriptions.AddAsync(subscription, ct);

    public Task<TenantSubscription?> GetActiveByTenantAsync(Guid tenantId, CancellationToken ct = default) =>
        _db.TenantSubscriptions
           .Include(s => s.Plan)
           .Where(s => s.TenantId == tenantId && s.Status == SubscriptionStatus.Active)
           .OrderByDescending(s => s.StartDate)
           .FirstOrDefaultAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
