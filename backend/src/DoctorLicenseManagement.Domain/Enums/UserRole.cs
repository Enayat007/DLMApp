namespace DoctorLicenseManagement.Domain.Enums;

public enum UserRole
{
    /// <summary>Full CRUD access within the tenant.</summary>
    Admin  = 0,

    /// <summary>Read-only access — cannot create, update, or delete.</summary>
    Viewer = 1
}
