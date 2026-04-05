using DoctorLicenseManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DoctorLicenseManagement.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWID()");
        builder.Property(t => t.Name).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Subdomain).IsRequired().HasMaxLength(100);
        builder.Property(t => t.LogoUrl).HasMaxLength(500);
        builder.Property(t => t.PrimaryColor).HasMaxLength(20);
        builder.Property(t => t.IsActive).HasDefaultValue(true);
        builder.Property(t => t.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(t => t.Subdomain)
               .IsUnique()
               .HasDatabaseName("UX_Tenants_Subdomain");

        builder.HasMany(t => t.Users)
               .WithOne(u => u.Tenant)
               .HasForeignKey(u => u.TenantId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Subscriptions)
               .WithOne(s => s.Tenant)
               .HasForeignKey(s => s.TenantId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
