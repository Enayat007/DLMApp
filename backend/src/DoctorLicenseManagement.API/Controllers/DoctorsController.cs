using DoctorLicenseManagement.Application.DTOs;
using DoctorLicenseManagement.Application.Interfaces;
using DoctorLicenseManagement.Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorLicenseManagement.API.Controllers;

/// <summary>
/// Doctor License Management — CRUD endpoints.
/// All endpoints require a valid JWT and resolved tenant context.
/// Write operations (POST/PUT/PATCH/DELETE) require Admin role.
/// </summary>
[ApiController]
[Route("api/doctors")]
[Produces("application/json")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _service;
    private readonly IValidator<CreateDoctorDto> _createValidator;
    private readonly IValidator<UpdateDoctorDto> _updateValidator;
    private readonly IValidator<UpdateStatusDto> _statusValidator;

    public DoctorsController(
        IDoctorService              service,
        IValidator<CreateDoctorDto> createValidator,
        IValidator<UpdateDoctorDto> updateValidator,
        IValidator<UpdateStatusDto> statusValidator)
    {
        _service         = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _statusValidator = statusValidator;
    }

    /// <summary>
    /// Returns a paged list of doctors.
    /// Uses the sp_GetDoctors stored procedure internally.
    /// Expiry logic and search/filter are handled by the SQL stored procedure.
    /// </summary>
    /// <param name="search">Search by full name or license number (optional).</param>
    /// <param name="status">Filter by status: 0=Active, 1=Expired, 2=Suspended (optional).</param>
    /// <param name="pageNumber">Page number (default 1).</param>
    /// <param name="pageSize">Items per page, max 100 (default 10).</param>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string?       search     = null,
        [FromQuery] DoctorStatus? status     = null,
        [FromQuery] int           pageNumber = 1,
        [FromQuery] int           pageSize   = 10,
        CancellationToken         ct         = default)
    {
        var query = new DoctorQueryParams
        {
            Search     = search,
            Status     = status,
            PageNumber = pageNumber,
            PageSize   = pageSize
        };

        var result = await _service.GetAllAsync(query, ct);
        return Ok(result);
    }

    /// <summary>
    /// Returns a single doctor by ID. Expiry logic is applied in C# (EffectiveStatus).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var result = await _service.GetByIdAsync(id, ct);
        if (!result.IsSuccess)
            return NotFound(new { message = result.ErrorMessage, code = result.ErrorCode });

        return Ok(result.Data);
    }

    /// <summary>
    /// Creates a new doctor. License Number must be unique among non-deleted records.
    /// Requires Admin role. Enforces plan doctor-count limits.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateDoctorDto dto, CancellationToken ct = default)
    {
        var validation = await _createValidator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var result = await _service.CreateAsync(dto, ct);
        if (!result.IsSuccess)
        {
            if (result.ErrorCode == "DUPLICATE_LICENSE")
                return Conflict(new { message = result.ErrorMessage, code = result.ErrorCode });

            return BadRequest(new { message = result.ErrorMessage });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// Replaces all editable fields of an existing doctor. Requires Admin role.
    /// License Number uniqueness is enforced (excluding this doctor).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorDto dto, CancellationToken ct = default)
    {
        var validation = await _updateValidator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var result = await _service.UpdateAsync(id, dto, ct);
        if (!result.IsSuccess)
        {
            return result.ErrorCode switch
            {
                "NOT_FOUND"        => NotFound(new { message = result.ErrorMessage, code = result.ErrorCode }),
                "DUPLICATE_LICENSE" => Conflict(new { message = result.ErrorMessage, code = result.ErrorCode }),
                _                  => BadRequest(new { message = result.ErrorMessage })
            };
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Updates only the status of a doctor (Active / Expired / Suspended).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto, CancellationToken ct = default)
    {
        var validation = await _statusValidator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var result = await _service.UpdateStatusAsync(id, dto, ct);
        if (!result.IsSuccess)
            return NotFound(new { message = result.ErrorMessage, code = result.ErrorCode });

        return Ok(result.Data);
    }

    /// <summary>
    /// Soft-deletes a doctor. The record is retained in the database with IsDeleted = true
    /// and will not appear in any listing query.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var result = await _service.DeleteAsync(id, ct);
        if (!result.IsSuccess)
            return NotFound(new { message = result.ErrorMessage, code = result.ErrorCode });

        return NoContent();
    }

    /// <summary>
    /// (Bonus) Returns all doctors with an expired license.
    /// Uses sp_GetExpiredDoctors stored procedure.
    /// </summary>
    [HttpGet("expired")]
    [ProducesResponseType(typeof(IEnumerable<DoctorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpired(CancellationToken ct = default)
    {
        var doctors = await _service.GetExpiredDoctorsAsync(ct);
        return Ok(doctors);
    }
}
