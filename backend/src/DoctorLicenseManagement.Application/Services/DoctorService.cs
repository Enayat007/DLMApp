using DoctorLicenseManagement.Application.Common;
using DoctorLicenseManagement.Application.DTOs;
using DoctorLicenseManagement.Application.Interfaces;
using DoctorLicenseManagement.Application.Mappings;
using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Interfaces;

namespace DoctorLicenseManagement.Application.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository     _repository;
    private readonly ICurrentTenantService _tenant;
    private readonly IPlanRepository       _plans;

    public DoctorService(
        IDoctorRepository     repository,
        ICurrentTenantService tenant,
        IPlanRepository       plans)
    {
        _repository = repository;
        _tenant     = tenant;
        _plans      = plans;
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    public async Task<PagedResult<DoctorDto>> GetAllAsync(DoctorQueryParams query, CancellationToken ct = default)
    {
        var pageNumber = Math.Max(1, query.PageNumber);
        var pageSize   = Math.Clamp(query.PageSize, 1, 100);

        var (items, totalCount) = await _repository.GetAllAsync(
            _tenant.TenantId, query.Search, query.Status, pageNumber, pageSize, ct);

        return PagedResult<DoctorDto>.Create(items.Select(d => d.ToDto()), totalCount, pageNumber, pageSize);
    }

    public async Task<ServiceResult<DoctorDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var doctor = await _repository.GetByIdAsync(id, _tenant.TenantId, ct);
        if (doctor is null)
            return ServiceResult<DoctorDto>.Failure($"Doctor with ID '{id}' was not found.", "NOT_FOUND");

        return ServiceResult<DoctorDto>.Success(doctor.ToDto());
    }

    // ── Commands ─────────────────────────────────────────────────────────────

    public async Task<ServiceResult<DoctorDto>> CreateAsync(CreateDoctorDto dto, CancellationToken ct = default)
    {
        // Plan capacity check: fetch active plan and compare current doctor count.
        var currentCount = await _repository.CountByTenantAsync(_tenant.TenantId, ct);
        var plan         = await GetActivePlanAsync(ct);
        if (plan is not null && !plan.HasDoctorCapacity(currentCount))
            return ServiceResult<DoctorDto>.Failure(
                $"Your {plan.Name} plan allows a maximum of {plan.MaxDoctors} doctors. " +
                "Please upgrade to add more.",
                "PLAN_LIMIT_REACHED");

        // Duplicate license within this tenant
        if (await _repository.LicenseNumberExistsAsync(_tenant.TenantId, dto.LicenseNumber, null, ct))
            return ServiceResult<DoctorDto>.Failure(
                $"License number '{dto.LicenseNumber}' is already registered to another doctor.",
                "DUPLICATE_LICENSE");

        var doctor = Doctor.Create(
            _tenant.TenantId,
            dto.FullName, dto.Email, dto.Specialization,
            dto.LicenseNumber, dto.LicenseExpiryDate, dto.Status);

        await _repository.AddAsync(doctor, ct);
        await _repository.SaveChangesAsync(ct);

        return ServiceResult<DoctorDto>.Success(doctor.ToDto());
    }

    public async Task<ServiceResult<DoctorDto>> UpdateAsync(Guid id, UpdateDoctorDto dto, CancellationToken ct = default)
    {
        var doctor = await _repository.GetByIdAsync(id, _tenant.TenantId, ct);
        if (doctor is null)
            return ServiceResult<DoctorDto>.Failure($"Doctor with ID '{id}' was not found.", "NOT_FOUND");

        if (await _repository.LicenseNumberExistsAsync(_tenant.TenantId, dto.LicenseNumber, id, ct))
            return ServiceResult<DoctorDto>.Failure(
                $"License number '{dto.LicenseNumber}' is already registered to another doctor.",
                "DUPLICATE_LICENSE");

        doctor.Update(dto.FullName, dto.Email, dto.Specialization,
                      dto.LicenseNumber, dto.LicenseExpiryDate, dto.Status);
        await _repository.UpdateAsync(doctor, ct);
        await _repository.SaveChangesAsync(ct);

        return ServiceResult<DoctorDto>.Success(doctor.ToDto());
    }

    public async Task<ServiceResult<DoctorDto>> UpdateStatusAsync(Guid id, UpdateStatusDto dto, CancellationToken ct = default)
    {
        var doctor = await _repository.GetByIdAsync(id, _tenant.TenantId, ct);
        if (doctor is null)
            return ServiceResult<DoctorDto>.Failure($"Doctor with ID '{id}' was not found.", "NOT_FOUND");

        doctor.UpdateStatus(dto.Status);
        await _repository.UpdateAsync(doctor, ct);
        await _repository.SaveChangesAsync(ct);

        return ServiceResult<DoctorDto>.Success(doctor.ToDto());
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var doctor = await _repository.GetByIdAsync(id, _tenant.TenantId, ct);
        if (doctor is null)
            return ServiceResult.Failure($"Doctor with ID '{id}' was not found.", "NOT_FOUND");

        doctor.SoftDelete();
        await _repository.UpdateAsync(doctor, ct);
        await _repository.SaveChangesAsync(ct);

        return ServiceResult.Success();
    }

    public async Task<IEnumerable<DoctorDto>> GetExpiredDoctorsAsync(CancellationToken ct = default)
    {
        var doctors = await _repository.GetExpiredDoctorsAsync(_tenant.TenantId, ct);
        return doctors.Select(d => d.ToDto());
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private Task<Domain.Entities.Plan?> GetActivePlanAsync(CancellationToken ct) =>
        _plans.GetBySlugAsync("free", ct);  // simplified; production joins TenantSubscriptions
}
