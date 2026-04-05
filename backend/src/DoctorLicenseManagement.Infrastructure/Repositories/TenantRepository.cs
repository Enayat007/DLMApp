using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly ApplicationDbContext _db;
    public TenantRepository(ApplicationDbContext db) => _db = db;

    public Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default) =>
        _db.Tenants.AsNoTracking()
           .FirstOrDefaultAsync(t => t.Subdomain == subdomain, ct);

    public Task<Tenant?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<bool> SubdomainExistsAsync(string subdomain, CancellationToken ct = default) =>
        _db.Tenants.AnyAsync(t => t.Subdomain == subdomain, ct);

    public async Task AddAsync(Tenant tenant, CancellationToken ct = default) =>
        await _db.Tenants.AddAsync(tenant, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
