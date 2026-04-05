namespace DoctorLicenseManagement.Domain.Enums;

/// <summary>
/// Represents the operational status of a doctor's license.
/// </summary>
public enum DoctorStatus
{
    /// <summary>License is valid and within its expiry date.</summary>
    Active = 0,

    /// <summary>
    /// License has passed its expiry date.
    /// This value is auto-computed at read time; the database may still store Active.
    /// </summary>
    Expired = 1,

    /// <summary>License has been administratively suspended.</summary>
    Suspended = 2
}
