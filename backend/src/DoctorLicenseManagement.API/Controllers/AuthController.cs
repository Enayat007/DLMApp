using DoctorLicenseManagement.Application.DTOs.Auth;
using DoctorLicenseManagement.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DoctorLicenseManagement.API.Controllers;

/// <summary>
/// Public authentication endpoints — no tenant context required.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService               _auth;
    private readonly IValidator<RegisterDto>    _registerValidator;
    private readonly IValidator<LoginDto>       _loginValidator;

    public AuthController(
        IAuthService            auth,
        IValidator<RegisterDto> registerValidator,
        IValidator<LoginDto>    loginValidator)
    {
        _auth              = auth;
        _registerValidator = registerValidator;
        _loginValidator    = loginValidator;
    }

    /// <summary>
    /// Registers a new tenant (workspace) with an initial admin user and subscription.
    /// This is the full SaaS onboarding in one request:
    /// User info + workspace name + subdomain + plan selection.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(TokenResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct = default)
    {
        var validation = await _registerValidator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var result = await _auth.RegisterAsync(dto, ct);
        if (!result.IsSuccess)
        {
            return result.ErrorCode switch
            {
                "SUBDOMAIN_TAKEN" => Conflict(new { message = result.ErrorMessage, code = result.ErrorCode }),
                "INVALID_PLAN"    => BadRequest(new { message = result.ErrorMessage, code = result.ErrorCode }),
                _                 => BadRequest(new { message = result.ErrorMessage })
            };
        }

        return StatusCode(StatusCodes.Status201Created, result.Data);
    }

    /// <summary>
    /// Authenticates a user within a specific tenant workspace.
    /// Returns a JWT access token with tenant and role claims.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(TokenResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct = default)
    {
        var validation = await _loginValidator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var result = await _auth.LoginAsync(dto, ct);
        if (!result.IsSuccess)
            return Unauthorized(new { message = result.ErrorMessage, code = result.ErrorCode });

        return Ok(result.Data);
    }
}
