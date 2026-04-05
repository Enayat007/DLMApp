using DoctorLicenseManagement.Application.DTOs.Plans;
using DoctorLicenseManagement.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DoctorLicenseManagement.API.Controllers;

/// <summary>
/// Public endpoint — returns available subscription plans for the pricing/signup page.
/// No authentication or tenant context required.
/// </summary>
[ApiController]
[Route("api/plans")]
[Produces("application/json")]
public class PlansController : ControllerBase
{
    private readonly IPlanService _plans;
    public PlansController(IPlanService plans) => _plans = plans;

    /// <summary>Returns all active subscription plans ordered by display order.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var plans = await _plans.GetAllAsync(ct);
        return Ok(plans);
    }

    /// <summary>Returns a single plan by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var plan = await _plans.GetByIdAsync(id, ct);
        return plan is null ? NotFound() : Ok(plan);
    }
}
