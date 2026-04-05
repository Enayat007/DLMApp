namespace DoctorLicenseManagement.Application.DTOs.Tenants;

public class TenantDto
{
    public Guid    Id           { get; init; }
    public string  Name         { get; init; } = string.Empty;
    public string  Subdomain    { get; init; } = string.Empty;
    public string? LogoUrl      { get; init; }
    public string? PrimaryColor { get; init; }
    public bool    IsActive     { get; init; }
    public DateTime CreatedDate { get; init; }
}
