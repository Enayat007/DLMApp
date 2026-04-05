using DoctorLicenseManagement.Domain.Entities;
using DoctorLicenseManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DoctorLicenseManagement.Infrastructure.Data.Configurations;

public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToTable("Doctors");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
               .HasDefaultValueSql("NEWID()");

        builder.Property(d => d.FullName)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(d => d.Email)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(d => d.Specialization)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(d => d.LicenseNumber)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(d => d.LicenseExpiryDate)
               .IsRequired();

        builder.Property(d => d.Status)
               .IsRequired()
               .HasConversion<byte>()        // stored as TINYINT
               .HasDefaultValue(DoctorStatus.Active);

        builder.Property(d => d.CreatedDate)
               .IsRequired()
               .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(d => d.UpdatedDate)
               .IsRequired(false);

        builder.Property(d => d.IsDeleted)
               .IsRequired()
               .HasDefaultValue(false);

        builder.Property(d => d.TenantId).IsRequired();

        // Filtered unique index — matches the SQL migration script
        builder.HasIndex(d => d.LicenseNumber)
               .IsUnique()
               .HasFilter("[IsDeleted] = 0")
               .HasDatabaseName("UX_Doctors_LicenseNumber");

        builder.HasIndex(d => d.TenantId)
               .HasFilter("[IsDeleted] = 0")
               .HasDatabaseName("IX_Doctors_TenantId");

        // Query filter: globally exclude soft-deleted records from EF Core queries
        builder.HasQueryFilter(d => !d.IsDeleted);
    }
}
