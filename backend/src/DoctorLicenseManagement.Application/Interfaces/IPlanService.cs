using DoctorLicenseManagement.Application.DTOs.Plans;

namespace DoctorLicenseManagement.Application.Interfaces;

public interface IPlanService
{
    Task<IEnumerable<PlanDto>> GetAllAsync(CancellationToken ct = default);
    Task<PlanDto?>             GetByIdAsync(Guid id, CancellationToken ct = default);
}
