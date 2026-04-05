-- ============================================================
-- Migration 005: Seed subscription plans
-- Run once after 003_MultiTenantSchema.sql
-- ============================================================

USE [DLMDb];
GO

INSERT INTO [dbo].[Plans] ([Id], [Name], [Slug], [PriceMonthly], [MaxDoctors], [Features], [DisplayOrder])
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Free',
    'free',
    0.00,
    5,
    '["Up to 5 doctors","License expiry tracking","Basic search & filter","Email support"]',
    1
),
(
    '10000000-0000-0000-0000-000000000002',
    'Pro',
    'pro',
    29.00,
    50,
    '["Up to 50 doctors","Everything in Free","Advanced filtering","CSV export","Priority support","Subdomain branding"]',
    2
),
(
    '10000000-0000-0000-0000-000000000003',
    'Enterprise',
    'enterprise',
    99.00,
    -1,
    '["Unlimited doctors","Everything in Pro","Custom branding & logo","SSO / SAML","Audit log","Dedicated support","SLA guarantee"]',
    3
);
GO

PRINT 'Plans seeded successfully.';
GO
