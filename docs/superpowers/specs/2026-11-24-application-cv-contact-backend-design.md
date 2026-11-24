# Application CV & Contact Fields (Backend) — Design

**Date:** 2026-11-24
**Scope:** Small change (backend only)

## Intent & Why

When volunteers apply to a division (`POST /volunteer/applications`), organizers and coordinators need the applicant's CV, phone number, and optional social profiles (Instagram, LinkedIn) to screen candidates and contact them effectively.

## Goals, Non-Goals & Anti-Goals

- **Goals:**
  - Accept CV upload (`cv`), `phone`, `instagram`, and `linkedin` when a volunteer submits a division application.
  - Enforce `cv` and `phone` as required; keep `instagram` and `linkedin` optional.
  - Store CVs privately and restrict access strictly to the applicant (CV owner) and authorized reviewers (event organizer and assigned division coordinator).
  - Expose application contact fields and CV download/view URL in both volunteer and admin application Inertia payloads.
- **Non-Goals:**
  - Frontend React UI changes (explicitly deferred; backend only).
  - Adding CV/Instagram/LinkedIn to the general `/settings/profile` flow.
- **Anti-Goals:**
  - Exposing CV files via unauthenticated public URLs under `/storage/...`.
  - Breaking existing seeded applications that do not have CV or contact columns populated.

## Constraints

- Laravel 13 + Inertia v3 monolith (`VolunSycn`), SQLite default local DB.
- Strict multi-org and division scoping enforced via `ApplicationPolicy`.
- Existing database rows / seeders must remain valid (new columns on `applications` are nullable at the DB level; requiredness is enforced in `StoreApplicationRequest`).

## Approaches Considered

1. **Approach A — Per-application fields on `applications` + private CV storage (Chosen)**
   - Store `cv_path`, `cv_original_name`, `phone`, `instagram`, and `linkedin` on `applications`.
   - Save CV files on the private `local` disk (`storage/app/private/cvs/...`) and serve them through an authorized route guarded by `ApplicationPolicy`.
   - *Trade-off:* Adds one route and policy method, but protects PII in CVs, aligns with VolunSync's strict scoping, and lets volunteers submit tailored CVs per division.
2. **Approach B — Per-application fields + `public` disk (like `avatar`)**
   - Simpler (direct `/storage/cvs/...` link), but exposes sensitive personal CV files publicly without authorization.
3. **Approach C — Store on `users` profile table and update during apply**
   - Avoids re-entry across applications, but prevents division-specific CVs and mutates historical application snapshots when a user updates their CV.

**Decision:** Approach A was chosen by the user so CV access is strictly limited to the CV owner (applicant) and the event/division owner (organizer/coordinator).

## Decided Design

- **Database Migration (`applications` table):**
  - Add nullable columns: `cv_path` (`string`), `cv_original_name` (`string`), `phone` (`string`, max 30), `instagram` (`string`, max 255), `linkedin` (`string`, max 255).
- **Model (`App\Models\Application`):**
  - Add the 5 new columns to `$fillable` and PHPDoc properties.
- **Validation (`App\Http\Requests\StoreApplicationRequest`):**
  - `cv`: `required`, `file`, `mimes:pdf,doc,docx`, `max:5120` (5 MB).
  - `phone`: `required`, `string`, `max:30`.
  - `instagram`: `nullable`, `string`, `max:255`.
  - `linkedin`: `nullable`, `string`, `max:255`.
- **Submission (`Volunteer\ApplicationController@store`):**
  - Store uploaded CV on `local` disk under `cvs/` (e.g. `cvs/{user_id}` or `cvs`).
  - Save `cv_path`, `cv_original_name`, `phone`, `instagram`, `linkedin` on `Application`.
  - If `$user->phone` is currently empty, populate it with the submitted `phone` without overwriting an existing user phone number.
- **Authorization & CV Serving:**
  - Add `ApplicationPolicy::viewCv(User $user, Application $application): bool`: returns `true` if `$application->user_id === $user->id` OR `$this->review($user, $application)` (event organizer or division coordinator).
  - Add authenticated route `GET /applications/{application}/cv` (`applications.cv`) that authorizes `viewCv`, returns 404 if `cv_path` is missing or file does not exist on `local` disk, and streams/downloads the file with `cv_original_name`.
- **Inertia Payloads:**
  - Include `phone`, `instagram`, `linkedin`, `cv_original_name`, and `cv_url` (pointing to `route('applications.cv', $app)` when `cv_path` is present, else `null`) in both `Volunteer\ApplicationController@index` and `Admin\ApplicationController@index`.

## Left to the Builder

- Exact storage path/filename convention under `local` disk `cvs/` (e.g., hashed filename via Laravel `store()`).
- Exact HTTP response disposition (`response()->file()` vs `Storage::disk('local')->download()` with optional `?download=1`).
- Input normalization/format checks for `instagram` (handle or URL) and `linkedin` (URL), plus updating existing feature tests that post to `volunteer.applications.store`.
