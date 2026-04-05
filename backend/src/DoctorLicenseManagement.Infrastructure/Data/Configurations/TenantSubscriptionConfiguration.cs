using DoctorLicenseManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DoctorLicenseManagement.Infrastructure.Data.Configurations;

public class TenantSubscriptionConfiguration : IEntityTypeConfiguration<TenantSubscription>
{
    public void Configure(EntityTypeBuilder<TenantSubscription> builder)
    {
        builder.ToTable("TenantSubscriptions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("NEWID()");
        builder.Property(s => s.Status).IsRequired().HasConversion<byte>();
        builder.Property(s => s.StartDate).IsRequired();
        builder.Property(s => s.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(s => s.Plan)
               .WithMany()
               .HasForeignKey(s => s.PlanId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
