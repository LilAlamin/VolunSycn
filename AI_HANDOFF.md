# VolunSync — AI Agent Handoff & Context Guide

> **Read this file FIRST before scanning the repository.**
> It summarizes the exact implementation state as of **2026-11-24** (including CV/contact application workflow, clickable peer directory, clean Organizer sidebar, and Event-First Screening Portal), architectural choices, file map, gotchas, and remaining Priority 2 / optional tasks so you do not need to re-read the entire codebase.

---

## 1. Project & Architecture Snapshot

* **Project:** VolunSync (*System Management for Volunteer Event*) — STACK 2026 by GDGoC ITB (Case 2)
* **Repo:** `https://github.com/LilAlamin/VolunSycn.git` (`main`)
* **Architecture:** Single Modern Monolith — **Laravel 13** (`PHP 8.3+`) + **Inertia.js v3** + **React 19** + **TypeScript** + **Tailwind CSS v4** + **Dens-UI v0.2.0**
* **Database:** 7 core tables (`users`, `events`, `divisions`, `applications`, `shifts` + `shift_user`, `attendance_logs`, `documents`). Default local `.env` uses SQLite (`database/database.sqlite`).
* **Design System:** Dens-UI (`resources/css/styles/dens-ui.css`), customized to a **crisp white default (`light` mode)** matching the VolunSync logo (`public/images/volunsync-logo.jpg`, `public/images/volunsync-mark.jpg`). Default appearance is `'light'` in `HandleAppearance.php`, `app.blade.php`, and `use-appearance.tsx`.

---

## 2. Critical Technical Gotchas (Do NOT Break These!)

1. **QR Generation Package:** We use **`bacon/bacon-qr-code` v3** (already installed via `laravel/fortify`) inside `App\Services\QrCodeService` instead of `simplesoftwareio/simple-qrcode` (which conflicts with `bacon/bacon-qr-code` v3 in Composer).
2. **React 19 Compiler + `motion/react`:** `vite.config.ts` enables `babel-plugin-react-compiler`. Any component using `motion/react` hooks (`useScroll`, `useTransform`, `motion.*`) **MUST** include `'use no memo';` at the top of the function (already applied in `resources/js/pages/welcome.tsx`).
3. **TanStack Table Version:** Locked to **`@tanstack/react-table@^8.21.2`** (v8). Do not upgrade to v9 alpha.
4. **Starter Kit Sidebar Removed:** All default Laravel React Starter Kit sidebar/shell files (`app-layout.tsx`, `app-sidebar.tsx`, etc.) were intentionally deleted. `resources/js/app.tsx` maps `auth/*` to `AuthLayout`, `settings/*` to `[ConsoleLayout, SettingsLayout]` (`resources/js/layouts/console-layout.tsx` auto-picks `AdminLayout` or `VolunteerLayout` by role), and all other pages define their own layout (`AdminLayout` or `VolunteerLayout`).
5. **Avatar File Uploads with `PATCH`:** Because PHP does not populate `$_FILES` on raw `PATCH` requests, `resources/js/pages/settings/profile.tsx` submits `useForm` via `form.post(update.url(), { forceFormData: true })` with `_method: 'patch'`. Always ensure `php artisan storage:link` is linked.
6. **Case-Insensitive Login:** `App\Providers\FortifyServiceProvider` uses `Fortify::authenticateUsing` with `LOWER(email)` so uppercase/lowercase email login works on SQLite/PostgreSQL/MySQL.

---

## 3. What Is Already Implemented (100% Complete — Priority 1 MVP)

### A. Public & Auth
- **Landing Page (`/` — `resources/js/pages/welcome.tsx`):** Latent/27-inspired editorial white grid layout, `motion/react` scroll progress + parallax hero (`public/images/hero-community.jpg`), live DB metrics, Role Access Passes, and FAQ accordion. Shared navbar in `resources/js/components/public-navbar.tsx`.
- **Two-Role Public Registration (`/register` — `CreateNewUser.php`, `pages/auth/register.tsx`):**
  - Only `volunteer` and `organizer` (`organization_name` required, `organization_description` optional) are allowed on public `/register`.
  - Public registration as `coordinator` is strictly rejected (`Rule::in(['volunteer', 'organizer'])`).
- **Event Explorer (`/events` — `EventExplorerController.php`, `pages/volunteer/Events.tsx`):**
  - Shows `PublicNavbar` when logged out and `VolunteerLayout` when logged in.
  - Per-event catalog cards (search, status filter, organization name, overall quota bar, participation badge) -> click **"Inspect Divisions & Apply"** to view all divisions & apply via modal (supports motivation, contact phone, Instagram, LinkedIn, and private PDF/DOCX CV upload). Supports `?event=<id>` deep-linking.

### B. Volunteer Console (`VolunteerLayout.tsx` — Sticky `h-screen` Sidebar)
- **Volunteer Dashboard (`/volunteer/dashboard` — `Volunteer\DashboardController.php`, `pages/volunteer/Dashboard.tsx`):**
  - Live active check-in banner (with instant Check-Out button), 4 KPI cards (`Verified Service Hours`, `Active Workspaces`, `Upcoming Shifts`, `Pending Screening`), upcoming assigned shifts, quick workspace cards, application status snapshot, and open initiatives.
  - `/dashboard` redirects `organizer|coordinator` → `admin.dashboard`, `volunteer` → `volunteer.dashboard`.
- **My Applications & Timeline (`/volunteer/applications` — `Volunteer\ApplicationController.php`, `pages/volunteer/Applications.tsx`):**
  - Filter tabs (`All`, `Accepted`, `In Progress`, `Not Selected`), 3-step visual horizontal stepper, motivation & coordinator feedback cards.
- **Multi-Event Workspaces (`/volunteer/workspaces` — `WorkspaceController@index`, `pages/volunteer/Workspaces.tsx`):**
  - Lists every accepted division across multiple events and flags overlapping event dates while assuring shift-level protection.
- **Per-Division Workspace (`/volunteer/workspace/{division}` — `WorkspaceController@show`, `pages/volunteer/Workspace.tsx`):**
  - Tabs: **Overview & Briefings**, **Peer Directory** (with clickable `mailto:` email and `tel:` phone links), **Shifts & QR Check-In** (scoped `html5-qrcode` camera scanner + auto GPS + OpenStreetMap geofence map + Check-Out), and **Documents (`P2`)** (scoped `Event-Wide` vs `Division-Only` preview).
  - Global `QR Check-In` link was intentionally removed from the Volunteer sidebar so volunteers never confuse which event/division they are checking into (`/volunteer/check-in` still works as a fallback route).
- **Profile & Identity Verification (`/settings/profile` — `ProfileController.php`, `pages/settings/profile.tsx`):**
  - Clickable profile card at the bottom of both Volunteer & Admin sidebars (`resources/js/layouts/console-layout.tsx`).
  - Supports **avatar photo upload** (`public/avatars`), phone, DOB, city, address, skills, bio, and emergency contact.
  - Auto-sets `profile_verified_at` when `phone`, `city`, `address`, `emergency_contact_name`, and `emergency_contact_phone` are filled.

### C. OpenStreetMap + Geolocation Engine
- **`resources/js/components/venue-map.tsx`:** Reusable Leaflet + OpenStreetMap + Nominatim search component:
  - `mode="picker"` (Admin Events modal): search address, click map, drag pin, or click `My GPS` + live radius circle preview.
  - `mode="checkin"` (Volunteer Workspace & CheckIn): displays venue pin, radius circle, volunteer pin (`You`), dashed distance line, and live Haversine distance badge (`m` / `km`).
- **`resources/js/lib/geolocation.ts`:** 3-tier `detectUserCoordinates()` (high-accuracy GPS → Wi-Fi/Network geolocation → IP geolocation fallback via `geojs.io` / `ipapi.co` with macOS/localhost diagnostics).
- **Server-Side Verification:** `App\Services\AttendanceVerificationService` enforces Haversine radius validation and computes `verified_hours` on check-out.

### D. Organizer & Coordinator Admin Console (`AdminLayout.tsx` — Multi-Org & Division Scoped)
- **Strict Scoping & Clean Sidebar (`AdminLayout.tsx`):** Organizers only see/manage their own events (`events.organizer_id = auth()->id()`). Coordinators only see/manage their assigned divisions (`divisions.coordinator_id = auth()->id()`). Enforced in `EventPolicy`, `DivisionPolicy`, `ApplicationPolicy`, `ShiftPolicy`, and FormRequests. `Public Event Explorer` switch-view link was intentionally removed from the Admin sidebar to avoid role confusion.
- **Admin Dashboard (`/admin/dashboard`):** Scoped KPIs + recent applications + Priority 2 analytics placeholder card.
- **Events & Divisions (`/admin/events`):** Event CRUD (with OpenStreetMap picker) & Division CRUD.
- **Coordinators (`/admin/coordinators` — Organizer only):** Full CRUD (`CoordinatorController.php`, `pages/admin/coordinators/Index.tsx`) to provision new Coordinator accounts (`created_by_organizer_id`), edit/reset password, multi-select assigned divisions, assign existing users, or delete/unassign.
- **Screening Portal (`/admin/applications` — `Admin\ApplicationController.php`, `pages/admin/applications/Index.tsx`):**
  - **2-Level Event-First UX:** Starts with an Event Overview Grid (KPI summary strip + per-event cards showing pending screening count, division quota progress bar, and division chips) + optional `All Applicants` cross-event toggle.
  - Clicking an event opens its **Focused Screening Queue** with breadcrumb, quick Event Switcher dropdown, interactive **Division Quick-Filter Pills** (showing `filled/quota` and pending badges), **Status Filter Tabs** (`All`, `Needs Screening`, `Submitted`, `Under Review`, `Accepted`, `Rejected`), TanStack Table v8, and Review Modal (motivation, phone, Instagram/LinkedIn, private CV view/download via `ApplicationCvController`, and division quota enforcement).
- **Shifts & QR Codes (`/admin/shifts`):** Create shifts (auto-generates unique `qr_token`), display SVG QR modal, assign/unassign volunteers guarded by `App\Services\ShiftConflictService` (0% double-booking across all events/divisions).
- **Attendance Logs (`/admin/attendance`):** TanStack Table of QR/GPS check-ins, coordinates, verified hours, and admin force check-out.

---

## 4. Database Migrations & Seeded Demo Data

Migrations (all run cleanly via `php artisan migrate:fresh --seed`):
- `2026_11_23_144029_create_permission_tables.php` (Spatie RBAC)
- `2026_11_23_150000_add_profile_fields_to_users_table.php` (`phone`, `avatar_url`, `bio`)
- `2026_11_23_150001_create_events_table.php`
- `2026_11_23_150002_create_divisions_table.php`
- `2026_11_23_150003_create_applications_table.php`
- `2026_11_23_150004_create_shifts_table.php` (`shifts` + `shift_user`)
- `2026_11_23_150005_create_attendance_logs_table.php`
- `2026_11_23_150006_create_documents_table.php`
- `2026_11_24_000001_add_organization_fields_to_users_table.php` (`organization_name`, `organization_description`, `created_by_organizer_id`)
- `2026_11_24_000002_add_verification_profile_fields_to_users_table.php` (`city`, `address`, `date_of_birth`, `emergency_contact_name`, `emergency_contact_phone`, `skills`, `profile_verified_at`)
- `2026_11_24_000003_add_cv_and_contact_fields_to_applications_table.php` (`phone`, `instagram`, `linkedin`, `cv_path`, `cv_original_name`)

Seeded Accounts (`DatabaseSeeder.php` — password for all: `password`):
- **Organizer 1:** `organizer@volunsync.test` (SIPA Cultural & Civic Collective)
- **Organizer 2:** `organizer2@volunsync.test` (Nusantara Eco & Health Network)
- **Coordinators:** `coordinator@volunsync.test`, `coordinator2@volunsync.test`, `coordinator3@volunsync.test`
- **Verified Volunteer (Accepted + Shift Ready):** `volunteer@volunsync.test`
- Plus **105+ simulated volunteers**, **5 mock events**, multi-division shifts, and attendance logs.

---

## 5. Verification Commands

Run these after making any changes:
```bash
php artisan test          # Currently: 55 passed (281 assertions)
npm run types:check       # tsc --noEmit (0 errors)
npm run build             # Vite production build
```

Test suites added for VolunSync (`tests/Feature/VolunSync/`):
- `ShiftConflictServiceTest.php`
- `AttendanceVerificationTest.php`
- `RoleAccessAndWorkflowTest.php`
- `RegistrationAndMultiOrgTest.php`
- `ApplicationCvAndContactTest.php`
- Plus `tests/Feature/Settings/ProfileUpdateTest.php` (includes avatar + verification details test).

---

## 6. What Remains To Do

### Priority 2 — Reserved for Final Day Build Session (16 December 2026)
> Do **not** prematurely build these unless explicitly instructed for the Final Day session:
1. **Integrated Document Archiving Repository:** Wire upload/download/delete endpoints using Laravel `Storage` on the `documents` table, surfacing files inside `Workspace.tsx` (`Documents` tab) and Admin event/division views respecting `visibility` (`event_all`, `division_only`, `organizers_only`).
2. **Automated Email Queue & Multi-Channel Alerts:** Configure Laravel Mailables + Queued Jobs (`ShouldQueue`) for application status updates and shift reminders.
3. **Organizer Analytics Dashboard:** Replace the Priority 2 placeholder card in `pages/admin/Dashboard.tsx` with charts for division quota fulfillment, turnout rates, and total verified hours.

### Optional Pre-Demo Polish (If Requested)
- **Offline Check-In Auto-Sync:** `Workspace.tsx` & `CheckIn.tsx` save offline payloads to `localStorage`; you can add an automatic `online` listener / "Sync Pending Check-In" button to flush queued check-ins when connectivity returns.
- **Duplicate Event Structure Button:** Add a 1-click "Duplicate Event + Divisions" action in `Admin\EventController` & `admin/events/Index.tsx` to match proposal Sec 6.3.3.
- **Production DBMS Switch:** Update `.env` from `sqlite` to `mysql` or `pgsql` if deploying to production.

