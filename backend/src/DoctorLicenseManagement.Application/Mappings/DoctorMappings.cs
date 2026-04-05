using DoctorLicenseManagement.Application.DTOs;
using DoctorLicenseManagement.Domain.Entities;

namespace DoctorLicenseManagement.Application.Mappings;

/// <summary>
/// Manual mappings between domain entities and application DTOs.
/// Deliberately avoiding AutoMapper to keep dependencies minimal and mappings explicit.
/// </summary>
public static class DoctorMappings
{
    public static DoctorDto ToDto(this Doctor doctor) => new()
    {
        Id                = doctor.Id,
        FullName          = doctor.FullName,
        Email             = doctor.Email,
        Specialization    = doctor.Specialization,
        LicenseNumber     = doctor.LicenseNumber,
        LicenseExpiryDate = doctor.LicenseExpiryDate,
        Status            = doctor.EffectiveStatus,   // business-rule-applied status
        CreatedDate       = doctor.CreatedDate,
        UpdatedDate       = doctor.UpdatedDate
    };
}
