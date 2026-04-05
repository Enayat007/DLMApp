using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Infrastructure.Data.Configurations;
using DoctorLicenseManagement.Infrastructure.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace DoctorLicenseManagement.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Doctor>             Doctors             => Set<Doctor>();
    public DbSet<Tenant>             Tenants             => Set<Tenant>();
    public DbSet<User>               Users               => Set<User>();
    public DbSet<Plan>               Plans               => Set<Plan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new DoctorConfiguration());
        modelBuilder.ApplyConfiguration(new TenantConfiguration());
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new PlanConfiguration());
        modelBuilder.ApplyConfiguration(new TenantSubscriptionConfiguration());

        // Keyless entity for stored-procedure result materialisation
        modelBuilder.Entity<DoctorSpResult>().HasNoKey();
    }
}
