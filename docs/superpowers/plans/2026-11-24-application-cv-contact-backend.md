# Application CV & Contact Fields (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add required CV upload (private storage) and phone number plus optional Instagram and LinkedIn fields to the volunteer division application backend, with policy-gated CV access.

**Architecture:** Store `cv_path`, `cv_original_name`, `phone`, `instagram`, and `linkedin` as nullable columns on `applications` (enforcing `cv` and `phone` as required in `StoreApplicationRequest`). Persist CV files on Laravel's private `local` disk (`storage/app/private/cvs/{user_id}/...`) and serve them through an authenticated `GET /applications/{application}/cv` endpoint authorized by `ApplicationPolicy::viewCv`.

**Tech Stack:** Laravel 13 (PHP 8.3+), Inertia.js v3, Spatie Permission, SQLite/PHPUnit.

**Spec:** `docs/superpowers/specs/2026-11-24-application-cv-contact-backend-design.md`

## Global Constraints

- Backend-only change; do not modify React UI components.
- New DB columns on `applications` must be nullable so existing/seeded records remain valid.
- CV files must be stored on the private `local` disk, never on the `public` disk.
- CV access is strictly limited to the applicant (`$application->user_id === $user->id`), the event organizer, and the assigned division coordinator.
- `cv` must accept `pdf,doc,docx` up to `5120` KB (5 MB); `phone` max 30 chars; `instagram` and `linkedin` optional max 255 chars.

## Review Focus

- Submitting an application with `phone` when `$user->phone` is already populated must NOT overwrite `$user->phone`.
- Submitting an application with an invalid CV file type (e.g. `.png`) or > 5 MB must fail validation with errors on `cv`.
- Requesting `/applications/{application}/cv` for an older/seeded application where `cv_path` is `null` or the file is missing on disk must return `404`.
- Another volunteer, another organizer, or an unassigned coordinator requesting `/applications/{application}/cv` must receive `403`.
- Submitting an application without `instagram` and `linkedin` must succeed and store `null`.

---

### Task 1: Database Migration & `Application` Model

**Files:**
- Create: `database/migrations/2026_11_24_000003_add_cv_and_contact_fields_to_applications_table.php`
- Modify: `app/Models/Application.php`

**Interfaces:**
- Produces: nullable columns `cv_path`, `cv_original_name`, `phone`, `instagram`, `linkedin` on `applications` and corresponding `$fillable` entries on `App\Models\Application`.

- [ ] **Step 1:** Create migration adding `cv_path`, `cv_original_name`, `phone` (30), `instagram` (255), `linkedin` (255) as nullable strings after `motivation`.
- [ ] **Step 2:** Update `App\Models\Application` `$fillable` and PHPDoc `@property` annotations.

### Task 2: Validation, Private CV Storage, Phone Sync & Inertia Props

**Files:**
- Modify: `app/Http/Requests/StoreApplicationRequest.php`
- Modify: `app/Http/Controllers/Volunteer/ApplicationController.php`
- Modify: `app/Http/Controllers/Admin/ApplicationController.php`

**Interfaces:**
- Consumes: `Application` fillable columns from Task 1, named route `applications.cv` from Task 3.
- Produces: validated `cv`, `phone`, `instagram`, `linkedin` handling in `Volunteer\ApplicationController@store`, and `phone`, `instagram`, `linkedin`, `cv_original_name`, `cv_url` in Inertia payloads.

- [ ] **Step 1:** Add `cv`, `phone`, `instagram`, `linkedin` rules to `StoreApplicationRequest::rules()`.
- [ ] **Step 2:** Update `Volunteer\ApplicationController@store` to store `cv` on `local` disk under `cvs/{$user->id}`, persist fields on `Application`, and populate `$user->phone` if blank.
- [ ] **Step 3:** Expose `phone`, `instagram`, `linkedin`, `cv_original_name`, `cv_url` in both `Volunteer\ApplicationController@index` and `Admin\ApplicationController@index`.

### Task 3: CV Authorization Policy, Private Serving Route & Feature Tests

**Files:**
- Modify: `app/Policies/ApplicationPolicy.php`
- Create: `app/Http/Controllers/ApplicationCvController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/VolunSync/RoleAccessAndWorkflowTest.php`
- Create: `tests/Feature/VolunSync/ApplicationCvAndContactTest.php`

**Interfaces:**
- Consumes: `ApplicationPolicy::review()`, `applications.cv_path`, `applications.cv_original_name`.
- Produces: `ApplicationPolicy::viewCv(User $user, Application $application): bool`, route `GET /applications/{application}/cv` (`applications.cv`).

- [ ] **Step 1:** Add `viewCv` to `ApplicationPolicy`.
- [ ] **Step 2:** Create invokable `ApplicationCvController` authorizing `viewCv`, aborting 404 if missing, and returning `Storage::disk('local')->download(...)` (or inline response).
- [ ] **Step 3:** Register `GET /applications/{application}/cv` in `routes/web.php` under `auth` middleware.
- [ ] **Step 4:** Update `RoleAccessAndWorkflowTest.php` to include fake `cv` and `phone`.
- [ ] **Step 5:** Write `ApplicationCvAndContactTest.php` covering upload, validation, optional social fields, phone sync, private access control (owner/organizer/coordinator vs unauthorized users), missing CV 404, and Inertia props.
- [ ] **Step 6:** Run `php artisan migrate` and `php artisan test` to verify all tests pass, then commit.
