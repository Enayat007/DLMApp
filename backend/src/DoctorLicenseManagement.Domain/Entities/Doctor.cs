using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Domain.Entities;

/// <summary>
/// Represents a doctor with license management information.
/// </summary>
public class Doctor
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Specialization { get; private set; } = string.Empty;
    public string LicenseNumber { get; private set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; private set; }

    /// <summary>
    /// Stored status. Consumers should use <see cref="EffectiveStatus"/> for display.
    /// </summary>
    public DoctorStatus Status { get; private set; }

    public DateTime CreatedDate { get; private set; }
    public DateTime? UpdatedDate { get; private set; }
    public bool IsDeleted { get; private set; }

    /// <summary>
    /// Tenant this doctor belongs to. Enforces data isolation across workspaces.
    /// </summary>
    public Guid TenantId { get; private set; }

    /// <summary>
    /// The business-rule-applied status.
    /// Suspended always stays Suspended; expired licenses become Expired regardless of stored value.
    /// </summary>
    public DoctorStatus EffectiveStatus =>
        Status == DoctorStatus.Suspended
            ? DoctorStatus.Suspended
            : LicenseExpiryDate.ToUniversalTime() < DateTime.UtcNow
                ? DoctorStatus.Expired
                : Status;

    // Required by EF Core
    private Doctor() { }

    public static Doctor Create(
        Guid         tenantId,
        string       fullName,
        string       email,
        string       specialization,
        string       licenseNumber,
        DateTime     licenseExpiryDate,
        DoctorStatus status = DoctorStatus.Active)
    {
        return new Doctor
        {
            Id                = Guid.NewGuid(),
            TenantId          = tenantId,
            FullName          = fullName.Trim(),
            Email             = email.Trim().ToLowerInvariant(),
            Specialization    = specialization.Trim(),
            LicenseNumber     = licenseNumber.Trim().ToUpperInvariant(),
            LicenseExpiryDate = licenseExpiryDate.ToUniversalTime(),
            Status            = status,
            CreatedDate       = DateTime.UtcNow,
            IsDeleted         = false
        };
    }

    public void Update(
        string fullName,
        string email,
        string specialization,
        string licenseNumber,
        DateTime licenseExpiryDate,
        DoctorStatus status)
    {
        FullName          = fullName.Trim();
        Email             = email.Trim().ToLowerInvariant();
        Specialization    = specialization.Trim();
        LicenseNumber     = licenseNumber.Trim().ToUpperInvariant();
        LicenseExpiryDate = licenseExpiryDate.ToUniversalTime();
        Status            = status;
        UpdatedDate       = DateTime.UtcNow;
    }

    public void UpdateStatus(DoctorStatus status)
    {
        Status      = status;
        UpdatedDate = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted   = true;
        UpdatedDate = DateTime.UtcNow;
    }

    /// <summary>
    /// Internal factory used when hydrating from a stored-procedure result where the
    /// effective status has already been computed by the SQL query.
    /// Bypasses the standard Create factory's default-status logic.
    /// </summary>
    public static Doctor CreateFromDatabase(
        Guid         id,
        Guid         tenantId,
        string       fullName,
        string       email,
        string       specialization,
        string       licenseNumber,
        DateTime     licenseExpiryDate,
        DoctorStatus effectiveStatus,
        DateTime     createdDate,
        DateTime?    updatedDate)
    {
        return new Doctor
        {
            Id                = id,
            TenantId          = tenantId,
            FullName          = fullName,
            Email             = email,
            Specialization    = specialization,
            LicenseNumber     = licenseNumber,
            LicenseExpiryDate = licenseExpiryDate,
            Status            = effectiveStatus,  // SP already computed this
            CreatedDate       = createdDate,
            UpdatedDate       = updatedDate,
            IsDeleted         = false
        };
    }
}
