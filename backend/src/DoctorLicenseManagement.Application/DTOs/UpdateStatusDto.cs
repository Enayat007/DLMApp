using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs;

/// <summary>Payload for PATCH /api/doctors/{id}/status.</summary>
public class UpdateStatusDto
{
    public DoctorStatus Status { get; init; }
}
