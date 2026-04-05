-- ============================================================
-- Migration 004: Add TenantId to Doctors table
-- Updates stored procedures to filter by TenantId.
-- ============================================================

USE [DLMDb];
GO

-- ── Add TenantId column ───────────────────────────────────────────────────────
ALTER TABLE [dbo].[Doctors]
    ADD [TenantId] UNIQUEIDENTIFIER NULL
        CONSTRAINT [FK_Doctors_Tenants] REFERENCES [dbo].[Tenants]([Id]);
GO

-- For any existing rows (demo data), assign a placeholder — in practice
-- this migration runs on a fresh DB where the tenant is set at insert time.
-- UPDATE [dbo].[Doctors] SET [TenantId] = '<your-tenant-id-here>' WHERE [TenantId] IS NULL;

-- Make non-nullable once data is backfilled
ALTER TABLE [dbo].[Doctors]
    ALTER COLUMN [TenantId] UNIQUEIDENTIFIER NOT NULL;
GO

-- Index for fast per-tenant queries
CREATE NONCLUSTERED INDEX [IX_Doctors_TenantId]
    ON [dbo].[Doctors] ([TenantId])
    WHERE [IsDeleted] = 0;
GO

-- ── Update sp_GetDoctors to accept TenantId ───────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDoctors]
    @TenantId    UNIQUEIDENTIFIER,                -- required; isolates tenant data
    @SearchTerm  NVARCHAR(200) = NULL,
    @StatusFilter TINYINT      = NULL,
    @PageNumber  INT           = 1,
    @PageSize    INT           = 10
AS
BEGIN
    SET NOCOUNT ON;

    WITH DoctorsCTE AS (
        SELECT
            [Id], [FullName], [Email], [Specialization],
            [LicenseNumber], [LicenseExpiryDate], [CreatedDate], [UpdatedDate],
            CASE
                WHEN [Status] = 2                         THEN 2   -- Suspended
                WHEN [LicenseExpiryDate] < GETUTCDATE()   THEN 1   -- Auto-Expired
                ELSE [Status]
            END AS [EffectiveStatus]
        FROM [dbo].[Doctors]
        WHERE [IsDeleted] = 0
          AND [TenantId]  = @TenantId   -- ← tenant isolation
    )
    SELECT
        [Id], [FullName], [Email], [Specialization],
        [LicenseNumber], [LicenseExpiryDate], [CreatedDate], [UpdatedDate],
        [EffectiveStatus]        AS [Status],
        COUNT(*) OVER ()         AS [TotalCount]
    FROM DoctorsCTE
    WHERE
        (@SearchTerm IS NULL
            OR [FullName]      LIKE N'%' + @SearchTerm + N'%'
            OR [LicenseNumber] LIKE N'%' + @SearchTerm + N'%')
        AND (@StatusFilter IS NULL OR [EffectiveStatus] = @StatusFilter)
    ORDER BY [CreatedDate] DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- ── Update sp_GetExpiredDoctors ────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[sp_GetExpiredDoctors]
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [Id], [FullName], [Email], [Specialization],
        [LicenseNumber], [LicenseExpiryDate], [CreatedDate],
        1 AS [Status]
    FROM [dbo].[Doctors]
    WHERE [IsDeleted]             = 0
      AND [TenantId]              = @TenantId
      AND [Status]                <> 2
      AND [LicenseExpiryDate]     < GETUTCDATE()
    ORDER BY [LicenseExpiryDate] ASC;
END;
GO

PRINT 'Doctors.TenantId added and stored procedures updated.';
GO
