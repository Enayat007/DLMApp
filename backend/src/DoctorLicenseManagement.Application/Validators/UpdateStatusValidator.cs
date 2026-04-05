using DoctorLicenseManagement.Application.DTOs;
using DoctorLicenseManagement.Domain.Enums;
using FluentValidation;

namespace DoctorLicenseManagement.Application.Validators;

public class UpdateStatusValidator : AbstractValidator<UpdateStatusDto>
{
    public UpdateStatusValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status must be a valid value: 0 (Active), 1 (Expired), 2 (Suspended).");
    }
}
