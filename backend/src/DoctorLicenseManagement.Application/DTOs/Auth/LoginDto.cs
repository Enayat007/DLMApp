namespace DoctorLicenseManagement.Application.DTOs.Auth;

public class LoginDto
{
    public string Email     { get; init; } = string.Empty;
    public string Password  { get; init; } = string.Empty;
    /// <summary>
    /// Subdomain of the tenant the user is logging into.
    /// Required because the same email can exist in multiple tenants.
    /// </summary>
    public string Subdomain { get; init; } = string.Empty;
}
