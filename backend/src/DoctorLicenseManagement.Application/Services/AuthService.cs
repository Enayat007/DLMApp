using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using DoctorLicenseManagement.Application.Common;
using DoctorLicenseManagement.Application.DTOs.Auth;
using DoctorLicenseManagement.Application.Interfaces;
using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DoctorLicenseManagement.Application.Services;

public class AuthService : IAuthService
{
    private readonly ITenantRepository       _tenants;
    private readonly IUserRepository         _users;
    private readonly IPlanRepository         _plans;
    private readonly ISubscriptionRepository _subscriptions;
    private readonly IConfiguration          _config;

    public AuthService(
        ITenantRepository       tenants,
        IUserRepository         users,
        IPlanRepository         plans,
        ISubscriptionRepository subscriptions,
        IConfiguration          config)
    {
        _tenants       = tenants;
        _users         = users;
        _plans         = plans;
        _subscriptions = subscriptions;
        _config        = config;
    }

    // ── Register ──────────────────────────────────────────────────────────────

    public async Task<ServiceResult<TokenResponseDto>> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        // Subdomain uniqueness
        if (await _tenants.SubdomainExistsAsync(dto.Subdomain.ToLowerInvariant(), ct))
            return ServiceResult<TokenResponseDto>.Failure(
                $"The subdomain '{dto.Subdomain}' is already taken. Please choose another.",
                "SUBDOMAIN_TAKEN");

        // Resolve plan
        var plan = await _plans.GetBySlugAsync(dto.PlanSlug, ct);
        if (plan is null)
            return ServiceResult<TokenResponseDto>.Failure("Selected plan does not exist.", "INVALID_PLAN");

        // Create tenant
        var tenant = Tenant.Create(dto.WorkspaceName, dto.Subdomain);
        await _tenants.AddAsync(tenant, ct);

        // Hash password using BCrypt
        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);

        // Create initial admin user
        var user = User.Create(tenant.Id, dto.Email, hash, dto.FirstName, dto.LastName);
        await _users.AddAsync(user, ct);

        // Create subscription and persist via its own repository
        var subscription = TenantSubscription.Create(tenant.Id, plan.Id);
        await _subscriptions.AddAsync(subscription, ct);

        await _users.SaveChangesAsync(ct);   // one SaveChanges commits all tracked entities (shared DbContext)

        var token = BuildToken(user, tenant, plan.Name);
        return ServiceResult<TokenResponseDto>.Success(new TokenResponseDto
        {
            AccessToken = token,
            ExpiresIn   = GetExpirySeconds(),
            User        = MapUser(user),
            Tenant      = MapTenant(tenant, plan.Name, plan.MaxDoctors)
        });
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<TokenResponseDto>> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var tenant = await _tenants.GetBySubdomainAsync(dto.Subdomain.ToLowerInvariant(), ct);
        if (tenant is null || !tenant.IsActive)
            return ServiceResult<TokenResponseDto>.Failure(
                "Workspace not found or inactive.", "WORKSPACE_NOT_FOUND");

        var user = await _users.GetByEmailAndTenantAsync(dto.Email.ToLowerInvariant(), tenant.Id, ct);
        if (user is null || !user.IsActive)
            return ServiceResult<TokenResponseDto>.Failure(
                "Invalid email or password.", "INVALID_CREDENTIALS");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return ServiceResult<TokenResponseDto>.Failure(
                "Invalid email or password.", "INVALID_CREDENTIALS");

        // Load active subscription to get plan info
        var plan = await GetActivePlanForTenantAsync(tenant.Id, ct);
        var planName     = plan?.Name      ?? "Free";
        var maxDoctors   = plan?.MaxDoctors ?? 5;

        var token = BuildToken(user, tenant, planName);
        return ServiceResult<TokenResponseDto>.Success(new TokenResponseDto
        {
            AccessToken = token,
            ExpiresIn   = GetExpirySeconds(),
            User        = MapUser(user),
            Tenant      = MapTenant(tenant, planName, maxDoctors)
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string BuildToken(User user, Tenant tenant, string planName)
    {
        var jwtSettings = _config.GetSection("Jwt");
        var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry      = DateTime.UtcNow.AddSeconds(GetExpirySeconds());

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim("tenant_id",        tenant.Id.ToString()),
            new Claim("tenant_subdomain", tenant.Subdomain),
            new Claim("tenant_name",      tenant.Name),
            new Claim("role",             user.Role.ToString()),
            new Claim("plan",             planName),
            new Claim("full_name",        user.FullName),
        };

        var token = new JwtSecurityToken(
            issuer:   jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims:   claims,
            expires:  expiry,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int GetExpirySeconds()
    {
        var raw = _config["Jwt:ExpiryMinutes"];
        return int.TryParse(raw, out var mins) ? mins * 60 : 900;   // default 15 min
    }

    private static UserProfile MapUser(User user) => new()
    {
        Id       = user.Id,
        FullName = user.FullName,
        Email    = user.Email,
        Role     = user.Role
    };

    private static TenantInfo MapTenant(Tenant tenant, string planName, int maxDoctors) => new()
    {
        Id           = tenant.Id,
        Name         = tenant.Name,
        Subdomain    = tenant.Subdomain,
        PrimaryColor = tenant.PrimaryColor,
        LogoUrl      = tenant.LogoUrl,
        PlanName     = planName,
        MaxDoctors   = maxDoctors
    };

    // Loads the active subscription's plan for a tenant.
    private async Task<Plan?> GetActivePlanForTenantAsync(Guid tenantId, CancellationToken ct)
    {
        var subscription = await _subscriptions.GetActiveByTenantAsync(tenantId, ct);
        return subscription?.Plan;
    }
}
