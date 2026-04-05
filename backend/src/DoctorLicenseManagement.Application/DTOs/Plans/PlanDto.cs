namespace DoctorLicenseManagement.Application.DTOs.Plans;

public class PlanDto
{
    public Guid     Id           { get; init; }
    public string   Name         { get; init; } = string.Empty;
    public string   Slug         { get; init; } = string.Empty;
    public decimal  PriceMonthly { get; init; }
    public int      MaxDoctors   { get; init; }   // -1 = unlimited
    public string[] Features     { get; init; } = [];
    public int      DisplayOrder { get; init; }
    public bool     IsPopular    => Slug == "pro";
    public string   PriceDisplay => PriceMonthly == 0 ? "Free" : $"${PriceMonthly}/mo";
    public string   DoctorLimit  => MaxDoctors == -1 ? "Unlimited" : MaxDoctors.ToString();
}
