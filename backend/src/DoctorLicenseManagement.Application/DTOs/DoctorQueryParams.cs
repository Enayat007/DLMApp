using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs;

/// <summary>Query parameters for GET /api/doctors.</summary>
public class DoctorQueryParams
{
    public string?       Search     { get; init; }
    public DoctorStatus? Status     { get; init; }
    public int           PageNumber { get; init; } = 1;
    public int           PageSize   { get; init; } = 10;
}
