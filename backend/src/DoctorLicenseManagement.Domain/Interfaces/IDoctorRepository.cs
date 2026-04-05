using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Domain.Interfaces;

/// <summary>
/// Persistence contract for the Doctor aggregate.
/// </summary>
public interface IDoctorRepository
{
    // ── Queries ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns a paged doctor list via the listing stored procedure.
    /// Expiry logic and search/filter are handled inside the SP.
    /// All results are scoped to <paramref name="tenantId"/>.
    /// </summary>
    Task<(IEnumerable<Doctor> Items, int TotalCount)> GetAllAsync(
        Guid          tenantId,
        string?       searchTerm,
        DoctorStatus? statusFilter,
        int           pageNumber,
        int           pageSize,
        CancellationToken cancellationToken = default);

    Task<Doctor?> GetByIdAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>Returns count of non-deleted doctors for a tenant (used for plan limit check).</summary>
    Task<int> CountByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>Returns true when a non-deleted doctor in this tenant already owns this license number.</summary>
    Task<bool> LicenseNumberExistsAsync(
        Guid   tenantId,
        string licenseNumber,
        Guid?  excludeId = null,
        CancellationToken cancellationToken = default);

    /// <summary>Bonus: calls sp_GetExpiredDoctors.</summary>
    Task<IEnumerable<Doctor>> GetExpiredDoctorsAsync(Guid tenantId, CancellationToken cancellationToken = default);

    // ── Commands ─────────────────────────────────────────────────────────────

    Task AddAsync(Doctor doctor, CancellationToken cancellationToken = default);
    Task UpdateAsync(Doctor doctor, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
