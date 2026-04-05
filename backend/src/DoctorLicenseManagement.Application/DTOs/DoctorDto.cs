using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs;

/// <summary>Full doctor response (used for GetById and list items).</summary>
public class DoctorDto
{
    public Guid          Id                { get; init; }
    public string        FullName          { get; init; } = string.Empty;
    public string        Email             { get; init; } = string.Empty;
    public string        Specialization    { get; init; } = string.Empty;
    public string        LicenseNumber     { get; init; } = string.Empty;
    public DateTime      LicenseExpiryDate { get; init; }
    public DoctorStatus  Status            { get; init; }   // effective status (expiry-applied)
    public string        StatusName        => Status.ToString();
    public bool          IsExpired         => Status == DoctorStatus.Expired;
    public DateTime      CreatedDate       { get; init; }
    public DateTime?     UpdatedDate       { get; init; }
}
