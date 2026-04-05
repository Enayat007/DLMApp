using DoctorLicenseManagement.Domain.Interfaces;

namespace DoctorLicenseManagement.API.Middleware;

/// <summary>
/// Resolves the current tenant from the incoming HTTP request and populates ICurrentTenantService.
///
/// Resolution order:
///   1. X-Tenant-Subdomain header  (easy for Postman / direct API testing)
///   2. Host subdomain              (production: acme.app.com → "acme")
///
/// Endpoints that do NOT require a tenant context (auth/register, plans, swagger)
/// set [AllowWithoutTenant] or are excluded by path prefix matching below.
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    // Paths that are public and don't need tenant context
    private static readonly HashSet<string> _publicPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth",
        "/api/plans",
        "/swagger",
        "/health"
    };

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Skip tenant resolution for public endpoints
        if (_publicPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var subdomain = ExtractSubdomain(context);

        if (string.IsNullOrWhiteSpace(subdomain))
        {
            // Tenant-required routes without a subdomain get 400
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Tenant subdomain is required. " +
                          "Send via 'X-Tenant-Subdomain' header or use a subdomain host.",
                code = "TENANT_REQUIRED"
            });
            return;
        }

        // Resolve tenant from DB (ITenantRepository is scoped)
        var tenantRepo      = context.RequestServices.GetRequiredService<ITenantRepository>();
        var currentTenant   = context.RequestServices.GetRequiredService<ICurrentTenantService>();

        var tenant = await tenantRepo.GetBySubdomainAsync(subdomain);

        if (tenant is null || !tenant.IsActive)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new
            {
                message = $"Workspace '{subdomain}' was not found or is inactive.",
                code    = "TENANT_NOT_FOUND"
            });
            return;
        }

        currentTenant.Set(tenant.Id, tenant.Subdomain);
        _logger.LogDebug("Tenant resolved: {Subdomain} ({TenantId})", subdomain, tenant.Id);

        await _next(context);
    }

    private static string? ExtractSubdomain(HttpContext context)
    {
        // 1. Explicit header (for API testing / Postman)
        if (context.Request.Headers.TryGetValue("X-Tenant-Subdomain", out var headerVal))
            return headerVal.ToString().Trim().ToLowerInvariant();

        // 2. Parse from Host header: "acme.localhost" or "acme.app.com"
        var host = context.Request.Host.Host;  // excludes port

        var parts = host.Split('.');
        if (parts.Length >= 2)
        {
            var subdomain = parts[0];
            // Ignore common non-tenant prefixes
            if (!string.IsNullOrEmpty(subdomain) &&
                !subdomain.Equals("www", StringComparison.OrdinalIgnoreCase) &&
                !subdomain.Equals("api", StringComparison.OrdinalIgnoreCase))
            {
                return subdomain.ToLowerInvariant();
            }
        }

        return null;
    }
}
