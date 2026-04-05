using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Enums;
using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using DoctorLicenseManagement.Infrastructure.Data.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly ApplicationDbContext _db;

    public DoctorRepository(ApplicationDbContext db) => _db = db;

    // ── Stored Procedure: Listing ─────────────────────────────────────────────

    public async Task<(IEnumerable<Doctor> Items, int TotalCount)> GetAllAsync(
        Guid          tenantId,
        string?       searchTerm,
        DoctorStatus? statusFilter,
        int           pageNumber,
        int           pageSize,
        CancellationToken cancellationToken = default)
    {
        var pTenant     = new SqlParameter("@TenantId",    tenantId);
        var pSearch     = new SqlParameter("@SearchTerm",  (object?)searchTerm ?? DBNull.Value);
        var pStatus     = new SqlParameter("@StatusFilter", statusFilter.HasValue ? (object)(byte)statusFilter.Value : DBNull.Value);
        var pPageNumber = new SqlParameter("@PageNumber",  pageNumber);
        var pPageSize   = new SqlParameter("@PageSize",    pageSize);

        var results = await _db.Set<DoctorSpResult>()
            .FromSqlRaw(
                "EXEC [dbo].[sp_GetDoctors] @TenantId, @SearchTerm, @StatusFilter, @PageNumber, @PageSize",
                pTenant, pSearch, pStatus, pPageNumber, pPageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        if (results.Count == 0) return ([], 0);

        var totalCount = results[0].TotalCount;
        var doctors    = results.Select(r => MapSpResult(r, tenantId));
        return (doctors, totalCount);
    }

    // ── Stored Procedure: Expired ─────────────────────────────────────────────

    public async Task<IEnumerable<Doctor>> GetExpiredDoctorsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var pTenant = new SqlParameter("@TenantId", tenantId);

        var results = await _db.Set<DoctorSpResult>()
            .FromSqlRaw("EXEC [dbo].[sp_GetExpiredDoctors] @TenantId", pTenant)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return results.Select(r => MapSpResult(r, tenantId));
    }

    // ── EF Core ───────────────────────────────────────────────────────────────

    public Task<Doctor?> GetByIdAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default) =>
        _db.Doctors.AsNoTracking()
           .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId, cancellationToken);

    public Task<int> CountByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        _db.Doctors.CountAsync(d => d.TenantId == tenantId, cancellationToken);

    public Task<bool> LicenseNumberExistsAsync(
        Guid tenantId, string licenseNumber, Guid? excludeId, CancellationToken cancellationToken = default)
    {
        var normalised = licenseNumber.Trim().ToUpperInvariant();
        return _db.Doctors.AnyAsync(d =>
            d.TenantId      == tenantId &&
            d.LicenseNumber == normalised &&
            (excludeId == null || d.Id != excludeId), cancellationToken);
    }

    public async Task AddAsync(Doctor doctor, CancellationToken cancellationToken = default) =>
        await _db.Doctors.AddAsync(doctor, cancellationToken);

    public Task UpdateAsync(Doctor doctor, CancellationToken cancellationToken = default)
    {
        _db.Doctors.Update(doctor);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static Doctor MapSpResult(DoctorSpResult r, Guid tenantId) =>
        Doctor.CreateFromDatabase(
            r.Id, tenantId, r.FullName, r.Email, r.Specialization,
            r.LicenseNumber, r.LicenseExpiryDate, r.EffectiveStatus,
            r.CreatedDate, r.UpdatedDate);
}
