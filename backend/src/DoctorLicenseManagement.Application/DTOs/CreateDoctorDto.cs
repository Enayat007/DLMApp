using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs;

/// <summary>Payload for POST /api/doctors.</summary>
public class CreateDoctorDto
{
    public string       FullName          { get; init; } = string.Empty;
    public string       Email             { get; init; } = string.Empty;
    public string       Specialization    { get; init; } = string.Empty;
    public string       LicenseNumber     { get; init; } = string.Empty;
    public DateTime     LicenseExpiryDate { get; init; }

    /// <summary>
    /// Only Active or Suspended are accepted on create.
    /// Expired is auto-computed and cannot be set manually.
    /// </summary>
    public DoctorStatus Status            { get; init; } = DoctorStatus.Active;
}
