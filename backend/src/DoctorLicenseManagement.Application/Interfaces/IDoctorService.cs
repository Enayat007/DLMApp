using DoctorLicenseManagement.Application.Common;
using DoctorLicenseManagement.Application.DTOs;

namespace DoctorLicenseManagement.Application.Interfaces;

/// <summary>
/// Application service contract for doctor management.
/// All business logic lives here; the controller is a thin adapter.
/// </summary>
public interface IDoctorService
{
    Task<PagedResult<DoctorDto>> GetAllAsync(DoctorQueryParams query, CancellationToken ct = default);
    Task<ServiceResult<DoctorDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ServiceResult<DoctorDto>> CreateAsync(CreateDoctorDto dto, CancellationToken ct = default);
    Task<ServiceResult<DoctorDto>> UpdateAsync(Guid id, UpdateDoctorDto dto, CancellationToken ct = default);
    Task<ServiceResult<DoctorDto>> UpdateStatusAsync(Guid id, UpdateStatusDto dto, CancellationToken ct = default);
    Task<ServiceResult> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<DoctorDto>> GetExpiredDoctorsAsync(CancellationToken ct = default);
}
