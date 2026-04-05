using DoctorLicenseManagement.Application.DTOs.Auth;
using FluentValidation;

namespace DoctorLicenseManagement.Application.Validators;

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");

        RuleFor(x => x.Subdomain)
            .NotEmpty().WithMessage("Workspace subdomain is required.");
    }
}
