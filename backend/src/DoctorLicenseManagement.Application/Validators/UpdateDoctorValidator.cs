using DoctorLicenseManagement.Application.DTOs;
using DoctorLicenseManagement.Domain.Enums;
using FluentValidation;

namespace DoctorLicenseManagement.Application.Validators;

public class UpdateDoctorValidator : AbstractValidator<UpdateDoctorDto>
{
    public UpdateDoctorValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(200).WithMessage("Full name must not exceed 200 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(200).WithMessage("Email must not exceed 200 characters.");

        RuleFor(x => x.Specialization)
            .NotEmpty().WithMessage("Specialization is required.")
            .MaximumLength(200).WithMessage("Specialization must not exceed 200 characters.");

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required.")
            .MaximumLength(100).WithMessage("License number must not exceed 100 characters.")
            .Matches(@"^[A-Za-z0-9\-]+$").WithMessage("License number may only contain letters, digits, and hyphens.");

        RuleFor(x => x.LicenseExpiryDate)
            .NotEmpty().WithMessage("License expiry date is required.")
            .GreaterThan(DateTime.MinValue).WithMessage("A valid license expiry date is required.");

        RuleFor(x => x.Status)
            .Must(s => s == DoctorStatus.Active || s == DoctorStatus.Suspended)
            .WithMessage("Status must be Active or Suspended. Expired is computed automatically.");
    }
}
