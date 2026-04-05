using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Repositories;

public class PlanRepository : IPlanRepository
{
    private readonly ApplicationDbContext _db;
    public PlanRepository(ApplicationDbContext db) => _db = db;

    public async Task<IEnumerable<Plan>> GetAllActiveAsync(CancellationToken ct = default) =>
        await _db.Plans.AsNoTracking()
                 .Where(p => p.IsActive)
                 .OrderBy(p => p.DisplayOrder)
                 .ToListAsync(ct);

    public Task<Plan?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Plans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id && p.IsActive, ct);

    public Task<Plan?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        _db.Plans.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
}
