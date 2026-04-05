using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Application.DTOs.Auth;

public class TokenResponseDto
{
    public string      AccessToken  { get; init; } = string.Empty;
    public int         ExpiresIn    { get; init; }  // seconds
    public UserProfile User         { get; init; } = null!;
    public TenantInfo  Tenant       { get; init; } = null!;
}

public class UserProfile
{
    public Guid     Id        { get; init; }
    public string   FullName  { get; init; } = string.Empty;
    public string   Email     { get; init; } = string.Empty;
    public UserRole Role      { get; init; }
    public string   RoleName  => Role.ToString();
}

public class TenantInfo
{
    public Guid    Id           { get; init; }
    public string  Name         { get; init; } = string.Empty;
    public string  Subdomain    { get; init; } = string.Empty;
    public string? PrimaryColor { get; init; }
    public string? LogoUrl      { get; init; }
    public string  PlanName     { get; init; } = string.Empty;
    public int     MaxDoctors   { get; init; }
}
