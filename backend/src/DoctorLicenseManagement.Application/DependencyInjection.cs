using DoctorLicenseManagement.Application.Interfaces;
using DoctorLicenseManagement.Application.Services;
using DoctorLicenseManagement.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace DoctorLicenseManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IAuthService,   AuthService>();
        services.AddScoped<IPlanService,   PlanService>();

        // Register all FluentValidation validators from this assembly
        services.AddValidatorsFromAssemblyContaining<CreateDoctorValidator>();

        return services;
    }
}
