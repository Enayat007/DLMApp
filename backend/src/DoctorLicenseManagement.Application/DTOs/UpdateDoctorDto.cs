using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs;

/// <summary>Payload for PUT /api/doctors/{id}.</summary>
public class UpdateDoctorDto
{
    public string       FullName          { get; init; } = string.Empty;
    public string       Email             { get; init; } = string.Empty;
    public string       Specialization    { get; init; } = string.Empty;
    public string       LicenseNumber     { get; init; } = string.Empty;
    public DateTime     LicenseExpiryDate { get; init; }
    public DoctorStatus Status            { get; init; } = DoctorStatus.Active;
}
