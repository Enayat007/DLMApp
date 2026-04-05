using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Domain.Entities;

/// <summary>
/// Application user, always scoped to exactly one Tenant.
/// Password is stored as a BCrypt hash — never plain text.
/// </summary>
public class User
{
    public Guid     Id           { get; private set; }
    public Guid     TenantId     { get; private set; }
    public string   Email        { get; private set; } = string.Empty;
    public string   PasswordHash { get; private set; } = string.Empty;
    public string   FirstName    { get; private set; } = string.Empty;
    public string   LastName     { get; private set; } = string.Empty;
    public UserRole Role         { get; private set; }
    public bool     IsActive     { get; private set; }
    public DateTime CreatedDate  { get; private set; }

    // Navigation
    public Tenant? Tenant { get; private set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool   IsAdmin  => Role == UserRole.Admin;

    private User() { }

    public static User Create(
        Guid     tenantId,
        string   email,
        string   passwordHash,
        string   firstName,
        string   lastName,
        UserRole role = UserRole.Admin)
    {
        return new User
        {
            Id           = Guid.NewGuid(),
            TenantId     = tenantId,
            Email        = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName    = firstName.Trim(),
            LastName     = lastName.Trim(),
            Role         = role,
            IsActive     = true,
            CreatedDate  = DateTime.UtcNow
        };
    }

    public void Deactivate() => IsActive = false;
}
