using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _db;
    public UserRepository(ApplicationDbContext db) => _db = db;

    public Task<User?> GetByEmailAndTenantAsync(string email, Guid tenantId, CancellationToken ct = default) =>
        _db.Users.AsNoTracking()
           .FirstOrDefaultAsync(u => u.Email == email && u.TenantId == tenantId, ct);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> EmailExistsInTenantAsync(string email, Guid tenantId, CancellationToken ct = default) =>
        _db.Users.AnyAsync(u => u.Email == email && u.TenantId == tenantId, ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await _db.Users.AddAsync(user, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
