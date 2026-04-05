using DoctorLicenseManagement.Domain.Entities;

namespace DoctorLicenseManagement.Domain.Interfaces;

public interface IPlanRepository
{
    Task<IEnumerable<Plan>> GetAllActiveAsync(CancellationToken ct = default);
    Task<Plan?>             GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Plan?>             GetBySlugAsync(string slug, CancellationToken ct = default);
}
