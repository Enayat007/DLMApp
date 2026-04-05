namespace DoctorLicenseManagement.Application.DTOs.Auth;

/// <summary>
/// Multi-step registration payload.
/// Step 1: user details. Step 2: workspace details. Step 3: plan selection.
/// All three steps are submitted together as a single request.
/// </summary>
public class RegisterDto
{
    // ── Step 1: User info ─────────────────────────────────────────────────────
    public string FirstName { get; init; } = string.Empty;
    public string LastName  { get; init; } = string.Empty;
    public string Email     { get; init; } = string.Empty;
    public string Password  { get; init; } = string.Empty;

    // ── Step 2: Workspace ─────────────────────────────────────────────────────
    /// <summary>Company / workspace display name (e.g. "Acme Medical").</summary>
    public string WorkspaceName { get; init; } = string.Empty;

    /// <summary>
    /// URL-safe subdomain slug (e.g. "acme" → acme.app.com).
    /// Only lowercase letters, digits, and hyphens; must start with a letter.
    /// </summary>
    public string Subdomain { get; init; } = string.Empty;

    // ── Step 3: Plan ──────────────────────────────────────────────────────────
    /// <summary>Plan slug: "free" | "pro" | "enterprise".</summary>
    public string PlanSlug { get; init; } = "free";
}
