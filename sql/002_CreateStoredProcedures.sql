-- ============================================================
-- Migration 002: Stored Procedures
-- Doctor License Management System
-- ============================================================
-- Status enum mapping:  0 = Active | 1 = Expired | 2 = Suspended
-- Expiry rule: Suspended always stays Suspended.
--              If LicenseExpiryDate < GETUTCDATE() → Expired (1).
--              Otherwise → use stored Status.
-- ============================================================

USE [DoctorLicenseManagementDb];
GO

-- ============================================================
-- SP 1: sp_GetDoctors
--   Mandatory listing SP used by GET /api/doctors
--   Supports: search by name/license, filter by effective status,
--             and pagination with total count.
-- ============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDoctors]
    @SearchTerm  NVARCHAR(200) = NULL,   -- search by FullName or LicenseNumber
    @StatusFilter TINYINT       = NULL,   -- 0=Active 1=Expired 2=Suspended; NULL=all
    @PageNumber  INT            = 1,
    @PageSize    INT            = 10
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE applies the auto-expiry business rule in SQL,
    -- keeping Suspended intact and marking others Expired when past due.
    WITH DoctorsCTE AS (
        SELECT
            [Id],
            [FullName],
            [Email],
            [Specialization],
            [LicenseNumber],
            [LicenseExpiryDate],
            [CreatedDate],
            [UpdatedDate],
            -- Compute effective status:
            -- Suspended (2) always wins; otherwise expiry date decides.
            CASE
                WHEN [Status] = 2                              THEN 2  -- Suspended
                WHEN [LicenseExpiryDate] < GETUTCDATE()        THEN 1  -- Auto-Expired
                ELSE [Status]                                          -- Active (0)
            END AS [EffectiveStatus]
        FROM [dbo].[Doctors]
        WHERE [IsDeleted] = 0
    )
    SELECT
        [Id],
        [FullName],
        [Email],
        [Specialization],
        [LicenseNumber],
        [LicenseExpiryDate],
        [CreatedDate],
        [UpdatedDate],
        [EffectiveStatus]                       AS [Status],
        COUNT(*) OVER ()                         AS [TotalCount]   -- window fn for pagination metadata
    FROM DoctorsCTE
    WHERE
        -- Combined search: match FullName OR LicenseNumber
        (
            @SearchTerm IS NULL
            OR [FullName]       LIKE N'%' + @SearchTerm + N'%'
            OR [LicenseNumber]  LIKE N'%' + @SearchTerm + N'%'
        )
        -- Status filter operates on the *effective* (computed) status
        AND (
            @StatusFilter IS NULL
            OR [EffectiveStatus] = @StatusFilter
        )
    ORDER BY [CreatedDate] DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

PRINT 'SP [dbo].[sp_GetDoctors] created/updated successfully.';
GO

-- ============================================================
-- SP 2: sp_GetExpiredDoctors  (Bonus)
--   Returns only doctors with expired licenses.
--   Suspended doctors are excluded (they have a separate status).
-- ============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetExpiredDoctors]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [Id],
        [FullName],
        [Email],
        [Specialization],
        [LicenseNumber],
        [LicenseExpiryDate],
        [CreatedDate],
        1 AS [Status]   -- Always Expired (1) in this result set
    FROM [dbo].[Doctors]
    WHERE
        [IsDeleted]         = 0
        AND [Status]        <> 2                    -- exclude Suspended
        AND [LicenseExpiryDate] < GETUTCDATE()      -- actually expired
    ORDER BY [LicenseExpiryDate] ASC;               -- oldest first
END;
GO

PRINT 'SP [dbo].[sp_GetExpiredDoctors] created/updated successfully.';
GO
