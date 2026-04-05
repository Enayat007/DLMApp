using System.Text.Json;
using DoctorLicenseManagement.Application.DTOs.Plans;
using DoctorLicenseManagement.Application.Interfaces;
using DoctorLicenseManagement.Domain.Interfaces;

namespace DoctorLicenseManagement.Application.Services;

public class PlanService : IPlanService
{
    private readonly IPlanRepository _plans;

    public PlanService(IPlanRepository plans) => _plans = plans;

    public async Task<IEnumerable<PlanDto>> GetAllAsync(CancellationToken ct = default)
    {
        var plans = await _plans.GetAllActiveAsync(ct);
        return plans.OrderBy(p => p.DisplayOrder).Select(Map);
    }

    public async Task<PlanDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var plan = await _plans.GetByIdAsync(id, ct);
        return plan is null ? null : Map(plan);
    }

    private static PlanDto Map(Domain.Entities.Plan p) => new()
    {
        Id           = p.Id,
        Name         = p.Name,
        Slug         = p.Slug,
        PriceMonthly = p.PriceMonthly,
        MaxDoctors   = p.MaxDoctors,
        Features     = JsonSerializer.Deserialize<string[]>(p.Features) ?? [],
        DisplayOrder = p.DisplayOrder
    };
}
