using DoctorLicenseManagement.Application.DTOs.Auth;
using FluentValidation;

namespace DoctorLicenseManagement.Application.Validators;

public class RegisterValidator : AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(200);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one number.");

        RuleFor(x => x.WorkspaceName)
            .NotEmpty().WithMessage("Workspace name is required.")
            .MaximumLength(200);

        RuleFor(x => x.Subdomain)
            .NotEmpty().WithMessage("Subdomain is required.")
            .MaximumLength(100)
            .Matches(@"^[a-z][a-z0-9\-]{1,98}[a-z0-9]$")
            .WithMessage("Subdomain must start with a letter, contain only lowercase letters, digits, and hyphens, and be 3–100 characters.");

        RuleFor(x => x.PlanSlug)
            .NotEmpty()
            .Must(s => s is "free" or "pro" or "enterprise")
            .WithMessage("Plan must be 'free', 'pro', or 'enterprise'.");
    }
}
