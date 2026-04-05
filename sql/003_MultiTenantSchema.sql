-- ============================================================
-- Migration 003: Multi-Tenant Schema
-- Adds Plans, Tenants, Users, TenantSubscriptions tables.
-- Strategy: single-database, shared tables, TenantId isolation.
-- ============================================================

USE [DLMDb];
GO

-- ── Plans ─────────────────────────────────────────────────────────────────────
-- Static subscription tiers. Seeded in 005_SeedPlans.sql.
CREATE TABLE [dbo].[Plans] (
    [Id]             UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Plans_Id]          DEFAULT (NEWID()),
    [Name]           NVARCHAR(50)     NOT NULL,
    [Slug]           NVARCHAR(50)     NOT NULL,   -- 'free' | 'pro' | 'enterprise'
    [PriceMonthly]   DECIMAL(10,2)    NOT NULL,   -- 0 for Free
    [MaxDoctors]     INT              NOT NULL,   -- -1 = unlimited
    [Features]       NVARCHAR(MAX)    NOT NULL,   -- JSON array of feature strings
    [IsActive]       BIT              NOT NULL    CONSTRAINT [DF_Plans_IsActive]  DEFAULT (1),
    [DisplayOrder]   INT              NOT NULL    CONSTRAINT [DF_Plans_Order]     DEFAULT (0),

    CONSTRAINT [PK_Plans] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

CREATE UNIQUE INDEX [UX_Plans_Slug] ON [dbo].[Plans] ([Slug]);
GO

-- ── Tenants ───────────────────────────────────────────────────────────────────
-- Each tenant is a workspace (company). Identified by unique subdomain.
CREATE TABLE [dbo].[Tenants] (
    [Id]           UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Tenants_Id]          DEFAULT (NEWID()),
    [Name]         NVARCHAR(200)    NOT NULL,   -- Company / workspace display name
    [Subdomain]    NVARCHAR(100)    NOT NULL,   -- e.g. "acme" → acme.app.com
    [LogoUrl]      NVARCHAR(500)    NULL,
    [PrimaryColor] NVARCHAR(20)     NULL,       -- hex, e.g. "#0d9488" for custom branding
    [IsActive]     BIT              NOT NULL    CONSTRAINT [DF_Tenants_IsActive]  DEFAULT (1),
    [CreatedDate]  DATETIME2(7)     NOT NULL    CONSTRAINT [DF_Tenants_Created]   DEFAULT (GETUTCDATE()),

    CONSTRAINT [PK_Tenants] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- Subdomain must be globally unique
CREATE UNIQUE INDEX [UX_Tenants_Subdomain] ON [dbo].[Tenants] ([Subdomain]);
GO

-- ── Users ─────────────────────────────────────────────────────────────────────
-- Application users, always scoped to a single tenant.
-- Role: 0=Admin (full CRUD), 1=Viewer (read-only)
CREATE TABLE [dbo].[Users] (
    [Id]           UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Users_Id]           DEFAULT (NEWID()),
    [TenantId]     UNIQUEIDENTIFIER NOT NULL,
    [Email]        NVARCHAR(200)    NOT NULL,
    [PasswordHash] NVARCHAR(500)    NOT NULL,
    [FirstName]    NVARCHAR(100)    NOT NULL,
    [LastName]     NVARCHAR(100)    NOT NULL,
    [Role]         TINYINT          NOT NULL    CONSTRAINT [DF_Users_Role]       DEFAULT (0),  -- 0=Admin
    [IsActive]     BIT              NOT NULL    CONSTRAINT [DF_Users_IsActive]   DEFAULT (1),
    [CreatedDate]  DATETIME2(7)     NOT NULL    CONSTRAINT [DF_Users_Created]    DEFAULT (GETUTCDATE()),

    CONSTRAINT [PK_Users]            PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Users_Tenants]    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id])
);
GO

-- Email unique per tenant (same email allowed across different tenants)
CREATE UNIQUE INDEX [UX_Users_TenantEmail]
    ON [dbo].[Users] ([TenantId], [Email]);
GO

CREATE NONCLUSTERED INDEX [IX_Users_TenantId]
    ON [dbo].[Users] ([TenantId]);
GO

-- ── TenantSubscriptions ───────────────────────────────────────────────────────
-- Tracks which plan each tenant is on.
-- Status: 0=Active, 1=Cancelled, 2=Expired
CREATE TABLE [dbo].[TenantSubscriptions] (
    [Id]          UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Sub_Id]      DEFAULT (NEWID()),
    [TenantId]    UNIQUEIDENTIFIER NOT NULL,
    [PlanId]      UNIQUEIDENTIFIER NOT NULL,
    [Status]      TINYINT          NOT NULL CONSTRAINT [DF_Sub_Status]  DEFAULT (0),
    [StartDate]   DATETIME2(7)     NOT NULL,
    [EndDate]     DATETIME2(7)     NULL,      -- NULL = ongoing/unlimited
    [CreatedDate] DATETIME2(7)     NOT NULL   CONSTRAINT [DF_Sub_Created] DEFAULT (GETUTCDATE()),

    CONSTRAINT [PK_TenantSubscriptions]         PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Sub_Tenants]                 FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]),
    CONSTRAINT [FK_Sub_Plans]                   FOREIGN KEY ([PlanId])   REFERENCES [dbo].[Plans]([Id])
);
GO

CREATE NONCLUSTERED INDEX [IX_Sub_TenantId] ON [dbo].[TenantSubscriptions] ([TenantId]);
GO

PRINT 'Multi-tenant schema created successfully.';
GO
