using DoctorLicenseManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DoctorLicenseManagement.Infrastructure.Data.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Plans");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWID()");
        builder.Property(p => p.Name).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(50);
        builder.Property(p => p.PriceMonthly).IsRequired().HasColumnType("decimal(10,2)");
        builder.Property(p => p.MaxDoctors).IsRequired();
        builder.Property(p => p.Features).IsRequired();
        builder.Property(p => p.IsActive).HasDefaultValue(true);
        builder.Property(p => p.DisplayOrder).HasDefaultValue(0);

        builder.HasIndex(p => p.Slug).IsUnique().HasDatabaseName("UX_Plans_Slug");
    }
}
