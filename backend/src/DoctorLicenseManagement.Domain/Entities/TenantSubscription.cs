using DoctorLicenseManagement.Domain.Enums;

namespace DoctorLicenseManagement.Domain.Entities;

/// <summary>
/// Links a Tenant to its active Plan. One active subscription per tenant.
/// </summary>
public class TenantSubscription
{
    public Guid               Id          { get; private set; }
    public Guid               TenantId    { get; private set; }
    public Guid               PlanId      { get; private set; }
    public SubscriptionStatus Status      { get; private set; }
    public DateTime           StartDate   { get; private set; }
    public DateTime?          EndDate     { get; private set; }
    public DateTime           CreatedDate { get; private set; }

    // Navigations
    public Tenant? Tenant { get; private set; }
    public Plan?   Plan   { get; private set; }

    private TenantSubscription() { }

    public static TenantSubscription Create(Guid tenantId, Guid planId)
    {
        return new TenantSubscription
        {
            Id          = Guid.NewGuid(),
            TenantId    = tenantId,
            PlanId      = planId,
            Status      = SubscriptionStatus.Active,
            StartDate   = DateTime.UtcNow,
            CreatedDate = DateTime.UtcNow
        };
    }

    public void Cancel()
    {
        Status  = SubscriptionStatus.Cancelled;
        EndDate = DateTime.UtcNow;
    }
}
