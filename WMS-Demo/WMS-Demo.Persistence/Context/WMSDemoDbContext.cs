using WMSDemo.Domain.Auth;
using WMSDemo.Domain.Production;
using Microsoft.EntityFrameworkCore;

namespace WMSDemo.Persistence.Context;

public class WMSDemoDbContext : DbContext
{
    public WMSDemoDbContext(DbContextOptions<WMSDemoDbContext> options) : base(options)
    {
    }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<WarehouseLocation> Locations => Set<WarehouseLocation>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<PicCard> PicCards => Set<PicCard>();
    public DbSet<ShiftMaster> ShiftMasters => Set<ShiftMaster>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Username).HasColumnName("username").HasMaxLength(80).IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(150);
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(x => x.PasswordSalt).HasColumnName("password_salt").HasMaxLength(255).IsRequired();
            entity.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(x => x.Username).IsUnique();
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Part>(entity =>
        {
            entity.ToTable("parts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PartNumber).HasColumnName("part_number").HasMaxLength(80).IsRequired();
            entity.Property(x => x.PartName).HasColumnName("part_name").HasMaxLength(200).IsRequired();
            entity.Property(x => x.LocationId).HasColumnName("location_id");
            entity.Property(x => x.Timestamp).HasColumnName("timestamp");
            entity.HasOne(x => x.LocationRef).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => x.PartNumber).IsUnique();
            entity.HasIndex(x => x.LocationId);
            entity.HasIndex(x => x.Timestamp);
        });

        modelBuilder.Entity<WarehouseLocation>(entity =>
        {
            entity.ToTable("locations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.LocationCode).HasColumnName("location_code").HasMaxLength(80).IsRequired();
            entity.Property(x => x.LocationName).HasColumnName("location_name").HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(255);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(x => x.LocationCode).IsUnique();
            entity.HasIndex(x => x.IsActive);
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.ToTable("stock_movements");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.MovementType).HasColumnName("movement_type").HasConversion<string>().HasMaxLength(10).IsRequired();
            entity.Property(x => x.PartId).HasColumnName("part_id");
            entity.Property(x => x.LocationId).HasColumnName("location_id");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.CustomerName).HasColumnName("customer_name").HasMaxLength(200);
            entity.Property(x => x.Timestamp).HasColumnName("timestamp");
            entity.HasOne(x => x.Part).WithMany().HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.LocationRef).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => x.MovementType);
            entity.HasIndex(x => x.PartId);
            entity.HasIndex(x => x.LocationId);
            entity.HasIndex(x => x.Timestamp);
        });

        modelBuilder.Entity<PicCard>(entity =>
        {
            entity.ToTable("pic_cards");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CardUid).HasColumnName("card_uid").HasMaxLength(80).IsRequired();
            entity.Property(x => x.EmployeeNo).HasColumnName("employee_no").HasMaxLength(50).IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
            entity.Property(x => x.Department).HasColumnName("department").HasMaxLength(100).IsRequired();
            entity.Property(x => x.ShiftId).HasColumnName("shift_id");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.LastScannedAt).HasColumnName("last_scanned_at");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.ShiftRef).WithMany().HasForeignKey(x => x.ShiftId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => x.CardUid).IsUnique();
            entity.HasIndex(x => x.EmployeeNo).IsUnique();
            entity.HasIndex(x => x.ShiftId);
        });

        modelBuilder.Entity<ShiftMaster>(entity =>
        {
            entity.ToTable("shift_masters");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ShiftCode).HasColumnName("shift_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.ShiftName).HasColumnName("shift_name").HasMaxLength(100).IsRequired();
            entity.Property(x => x.SortOrder).HasColumnName("sort_order");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(x => x.ShiftCode).IsUnique();
            entity.HasIndex(x => x.SortOrder);
        });

    }
}
