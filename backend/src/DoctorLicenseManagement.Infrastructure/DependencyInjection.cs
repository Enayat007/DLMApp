using DoctorLicenseManagement.Domain.Interfaces;
using DoctorLicenseManagement.Infrastructure.Data;
using DoctorLicenseManagement.Infrastructure.Repositories;
using DoctorLicenseManagement.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DoctorLicenseManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration          configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped<IDoctorRepository,        DoctorRepository>();
        services.AddScoped<ITenantRepository,        TenantRepository>();
        services.AddScoped<IUserRepository,          UserRepository>();
        services.AddScoped<IPlanRepository,          PlanRepository>();
        services.AddScoped<ISubscriptionRepository,  SubscriptionRepository>();

        // Scoped tenant context — one instance per request, set by TenantResolutionMiddleware
        services.AddScoped<ICurrentTenantService, CurrentTenantService>();

        return services;
    }
}
