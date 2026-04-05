-- ============================================================
-- Migration 001: Create Doctors Table
-- Doctor License Management System
-- ============================================================

USE [DoctorLicenseManagementDb];
GO

-- Create table
CREATE TABLE [dbo].[Doctors] (
    [Id]                UNIQUEIDENTIFIER    NOT NULL CONSTRAINT [DF_Doctors_Id] DEFAULT (NEWID()),
    [FullName]          NVARCHAR(200)       NOT NULL,
    [Email]             NVARCHAR(200)       NOT NULL,
    [Specialization]    NVARCHAR(200)       NOT NULL,
    [LicenseNumber]     NVARCHAR(100)       NOT NULL,
    [LicenseExpiryDate] DATETIME2(7)        NOT NULL,
    -- Status: 0 = Active, 1 = Expired, 2 = Suspended
    -- NOTE: Status stored in DB may say Active but business logic
    --       auto-computes Expired when LicenseExpiryDate < today.
    [Status]            TINYINT             NOT NULL CONSTRAINT [DF_Doctors_Status] DEFAULT (0),
    [CreatedDate]       DATETIME2(7)        NOT NULL CONSTRAINT [DF_Doctors_CreatedDate] DEFAULT (GETUTCDATE()),
    [UpdatedDate]       DATETIME2(7)        NULL,
    [IsDeleted]         BIT                 NOT NULL CONSTRAINT [DF_Doctors_IsDeleted] DEFAULT (0),

    CONSTRAINT [PK_Doctors] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- Filtered unique index: no two *non-deleted* doctors can share a license number
CREATE UNIQUE NONCLUSTERED INDEX [UX_Doctors_LicenseNumber]
    ON [dbo].[Doctors] ([LicenseNumber])
    WHERE ([IsDeleted] = 0);
GO

-- Index for search performance
CREATE NONCLUSTERED INDEX [IX_Doctors_FullName]
    ON [dbo].[Doctors] ([FullName])
    WHERE ([IsDeleted] = 0);
GO

CREATE NONCLUSTERED INDEX [IX_Doctors_Status_IsDeleted]
    ON [dbo].[Doctors] ([Status], [IsDeleted])
    INCLUDE ([LicenseExpiryDate]);
GO

PRINT 'Table [dbo].[Doctors] created successfully.';
GO
