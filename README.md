# Doctor License Management (DLM)

A **multi-tenant Medical SaaS** platform for managing doctor licenses, built with **.NET 8 Clean Architecture** backend and **Next.js 14 App Router** frontend. Supports subdomain-based tenancy, JWT authentication with role-based access, subscription plans, and a full public marketing + onboarding flow.

---

## Table of Contents
- [SaaS architecture](#saas-architecture)
- [Architecture overview](#architecture-overview)
- [Key design decisions](#key-design-decisions)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [SQL migrations](#sql-migrations)
- [API reference](#api-reference)
- [Bonus features implemented](#bonus-features-implemented)

---

## SaaS architecture

### Multi-tenancy

| Concern | Implementation |
|---------|---------------|
| **Isolation** | Single database, shared tables. Every tenant-scoped row has a `TenantId` (`uniqueidentifier`). |
| **Routing** | Subdomain-based: `acme.nibrasgroups.com` resolves to tenant `acme`. |
| **Tenant resolution** | `TenantResolutionMiddleware` reads the `X-Tenant-Subdomain` request header (set by the frontend) or parses the `Host` header. It populates the scoped `ICurrentTenantService`. |
| **Doctor scoping** | All SP calls and EF queries include `@TenantId` / `.Where(d => d.TenantId == tenantId)`. |
| **Plan capacity** | `DoctorService.CreateAsync` calls `plan.HasDoctorCapacity(currentCount)` before inserting. |

### Authentication

- **JWT Bearer** (`MapInboundClaims = false`, `RoleClaimType = "role"`)
- Payload claims: `sub`, `email`, `tenant_id`, `tenant_subdomain`, `tenant_name`, `role`, `plan`, `full_name`
- Passwords hashed with **BCrypt** (work factor 12)
- Signup atomically creates Tenant → User → TenantSubscription in one `SaveChanges`

### Role-based access

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on doctors, access to all write endpoints |
| **Viewer** | Read-only — POST/PUT/PATCH/DELETE return 403 |

`[Authorize(Roles = "Admin")]` is applied to write endpoints on `DoctorsController`.

### Subscription plans

| Plan | Max Doctors | Slug |
|------|-------------|------|
| Free | 5 | `free` |
| Pro | 50 | `pro` |
| Enterprise | Unlimited (−1) | `enterprise` |

Plans are seeded by `sql/005_SeedPlans.sql` with fixed GUIDs.

### Frontend flow

```
/                      → Marketing landing page
/pricing               → Plan comparison page (fetches live from API)
/signup                → 3-step stepper: User info → Workspace → Plan
/login                 → Email + password + subdomain
acme.app.com/dashboard → Tenant dashboard (stats, expired licenses, plan usage)
acme.app.com/doctors   → Doctor management table (role-aware: hide edit/delete for Viewer)
```

Next.js Edge Middleware (`middleware.ts`) handles:
- Subdomain extraction from the `Host` header
- Auth cookie (`dlm_token`) guard — redirects to `/login` if missing on protected routes
- Forwarding `x-tenant-subdomain` header to server components

---

## Architecture overview

```
DLM/
├── backend/
│   ├── DoctorLicenseManagement.sln
│   └── src/
│       ├── Domain/          – Entities, enums, repository interfaces
│       ├── Application/     – DTOs, FluentValidation, service interfaces, service impls
│       ├── Infrastructure/  – EF Core DbContext, DoctorRepository (SP calls)
│       └── API/             – ASP.NET Web API controllers, middleware, Swagger
├── frontend/
│   └── dlm-web/             – Next.js 14 App Router + Tailwind CSS
└── sql/
    ├── 001_CreateDoctorsTable.sql
    └── 002_CreateStoredProcedures.sql
```

Clean Architecture layers have strict dependency rules:
- `Domain` has zero external dependencies.
- `Application` depends on `Domain` only.
- `Infrastructure` depends on `Domain` + `Application`.
- `API` depends on `Application` + `Infrastructure` (composition root only).

---

## Key design decisions

### Why a stored procedure for listing?

The spec requires `GET /api/doctors` to use a stored procedure. Beyond compliance, the SP approach:

1. **Applies expiry logic in SQL** — the CASE expression computes `EffectiveStatus` as part of the SELECT, so the database itself decides whether a license is expired. This avoids pulling all rows into application memory to filter.
2. **Single round-trip for pagination metadata** — `COUNT(*) OVER()` (a window function) returns the total count alongside each row, so paging info costs zero extra queries.
3. **Centralised search/filter** — the same SP handles name/license search and status filter together, keeping the controller thin.

### How auto-expiry is handled

Two layers enforce the expiry rule:

| Layer | Mechanism |
|-------|-----------|
| **SQL (listing)** | `CASE WHEN Status = 2 THEN 2 WHEN LicenseExpiryDate < GETUTCDATE() THEN 1 ELSE Status END` in `sp_GetDoctors` |
| **C# (single get)** | `Doctor.EffectiveStatus` computed property: Suspended wins, then expiry date decides |

`Expired` cannot be stored directly by API clients — it's a computed value. The domain entity rejects it in `Create` and validators reject it in the DTOs.

### Soft delete

Records are never physically removed. `IsDeleted = 1` hides them from EF Core via a global query filter (`HasQueryFilter`) and from the stored procedure via `WHERE IsDeleted = 0`. The filtered unique index on `LicenseNumber WHERE IsDeleted = 0` means a deleted license number can be re-registered.

### Validation strategy

FluentValidation runs at the API layer (controller calls validator before calling the service). The service layer performs business-rule checks (duplicate license) that require a DB round-trip. This keeps pure rules in validators and data-aware rules in services.

### Status enum values

| Int | Name      | Settable by API? |
|-----|-----------|-----------------|
| 0   | Active    | Yes             |
| 1   | Expired   | No (computed)   |
| 2   | Suspended | Yes             |

---

## Backend setup

### Prerequisites
- .NET 8 SDK
- SQL Server (LocalDB, Express, or full)

### 1. Configure connection string

Edit `backend/src/DoctorLicenseManagement.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=DoctorLicenseManagementDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Adjust `Server=.` for your SQL Server instance (e.g., `Server=localhost\\SQLEXPRESS`).

### 2. Run SQL migrations

Open SSMS or `sqlcmd` and run **in order**:

```sql
-- Step 1: create the database first
CREATE DATABASE DoctorLicenseManagementDb;
GO

-- Step 2: create the table
-- (run sql/001_CreateDoctorsTable.sql)

-- Step 3: create stored procedures
-- (run sql/002_CreateStoredProcedures.sql)
```

> **EF Core migrations** are also supported if you prefer code-first.
> From `backend/src/DoctorLicenseManagement.API/`:
> ```bash
> dotnet ef migrations add InitialCreate --project ../DoctorLicenseManagement.Infrastructure
> dotnet ef database update
> ```
> Note: the stored procedures must still be created via the SQL scripts (EF does not generate SPs).

### 3. Restore & run

```bash
cd backend
dotnet restore
dotnet run --project src/DoctorLicenseManagement.API
```

Swagger UI is available at the root: **http://api.nibrasgroups.com/**

---

## Frontend setup

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn

### 1. Configure environment

```bash
cd frontend/dlm-web
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://api.nibrasgroups.com
```

### 2. Install & run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## SQL migrations

| File | Description |
|------|-------------|
| `sql/001_CreateDoctorsTable.sql` | Creates `Doctors` table with filtered unique index on `LicenseNumber` and performance indexes. |
| `sql/002_CreateStoredProcedures.sql` | Creates `sp_GetDoctors` (listing with search/filter/pagination/expiry logic) and `sp_GetExpiredDoctors` (bonus). |
| `sql/003_MultiTenantSchema.sql` | Creates `Plans`, `Tenants`, `Users`, `TenantSubscriptions` tables for multi-tenant SaaS. |
| `sql/004_AlterDoctors_AddTenantId.sql` | Adds `TenantId` FK to `Doctors`; updates both SPs to accept `@TenantId` parameter. |
| `sql/005_SeedPlans.sql` | Seeds Free / Pro / Enterprise plan rows with fixed GUIDs. |

Run scripts in order (001 → 005) against a fresh `DLMDb` database.

### sp_GetDoctors parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `@TenantId` | UNIQUEIDENTIFIER | required | Scopes results to the calling tenant |
| `@SearchTerm` | NVARCHAR(200) | NULL | Search in FullName or LicenseNumber |
| `@StatusFilter` | TINYINT | NULL | 0=Active, 1=Expired, 2=Suspended |
| `@PageNumber` | INT | 1 | 1-based page number |
| `@PageSize` | INT | 10 | Items per page |

---

## API reference

All endpoints return JSON. Enums are serialised as strings (`"Active"`, `"Expired"`, `"Suspended"`).

#### Auth (public — no token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create tenant + user + subscription. Body: `RegisterDto` |
| `POST` | `/api/auth/login` | Authenticate and receive JWT. Body: `LoginDto` |

#### Plans (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/plans` | List all plans (Free, Pro, Enterprise) |
| `GET` | `/api/plans/{id}` | Single plan by ID |

#### Doctors (requires `Authorization: Bearer <token>` + `X-Tenant-Subdomain` header)

| Method | Endpoint | Auth required | Description |
|--------|----------|--------------|-------------|
| `GET` | `/api/doctors` | Any role | Paged list via SP. Query: `search`, `status`, `pageNumber`, `pageSize` |
| `GET` | `/api/doctors/{id}` | Any role | Single doctor |
| `POST` | `/api/doctors` | Admin only | Create |
| `PUT` | `/api/doctors/{id}` | Admin only | Full update |
| `PATCH` | `/api/doctors/{id}/status` | Admin only | Status-only update |
| `DELETE` | `/api/doctors/{id}` | Admin only | Soft delete |
| `GET` | `/api/doctors/expired` | Any role | Calls `sp_GetExpiredDoctors` |

### Error responses

| Status | Meaning |
|--------|---------|
| 400 | Validation failure — body is `ValidationProblemDetails` with field-level errors |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but insufficient role (Viewer attempting a write) |
| 404 | Resource not found |
| 409 | Duplicate license number or subdomain already taken |
| 500 | Unexpected error (detail shown only in Development) |

---

## Bonus features implemented

### Core module
- [x] `sp_GetExpiredDoctors` stored procedure + `GET /api/doctors/expired` endpoint
- [x] Pagination on both backend (SP + window function `TotalCount`) and frontend (page number nav with ellipsis)
- [x] Read-only doctor detail modal (click doctor name in table)
- [x] Debounced search (400 ms)
- [x] Expired rows highlighted with subtle red background
- [x] Quick stats bar (total / active / expired / suspended counts)
- [x] Fully responsive table with horizontal scroll on mobile

### SaaS enhancements
- [x] Public landing page (`/`) with hero, feature cards, and CTA
- [x] Pricing page (`/pricing`) — fetches live plan data from API; highlights the Pro plan
- [x] 3-step signup stepper: user info → workspace name (auto-generates subdomain slug) → plan selection
- [x] Atomic registration: Tenant + User + TenantSubscription created in a single `SaveChanges`
- [x] JWT payload carries `tenant_id`, `tenant_subdomain`, `role`, and `plan` — no extra DB round-trips after login
- [x] `[Authorize(Roles = "Admin")]` on all write endpoints; Viewer role sees read-only UI (edit/delete buttons hidden)
- [x] Plan capacity enforcement — `DoctorService.CreateAsync` rejects the request if tenant has reached their plan's doctor limit
- [x] Dashboard shows expired licenses list and plan usage progress bar
- [x] Next.js Edge Middleware handles subdomain routing and auth cookie guard at the edge
