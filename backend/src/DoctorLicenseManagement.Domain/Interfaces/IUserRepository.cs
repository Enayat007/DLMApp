using DoctorLicenseManagement.Domain.Entities;

namespace DoctorLicenseManagement.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAndTenantAsync(string email, Guid tenantId, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool>  EmailExistsInTenantAsync(string email, Guid tenantId, CancellationToken ct = default);
    Task        AddAsync(User user, CancellationToken ct = default);
    Task        SaveChangesAsync(CancellationToken ct = default);
}
