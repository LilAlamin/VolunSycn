<?php

namespace Tests\Feature\VolunSync;

use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApplicationCvAndContactTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        Role::firstOrCreate(['name' => 'organizer']);
        Role::firstOrCreate(['name' => 'coordinator']);
        Role::firstOrCreate(['name' => 'volunteer']);
    }

    /**
     * @return array{organizer: User, coordinator: User, division: Division, event: Event}
     */
    private function createOpenEventAndDivision(): array
    {
        $this->seedRoles();

        $organizer = User::factory()->create();
        $organizer->assignRole('organizer');

        $coordinator = User::factory()->create();
        $coordinator->assignRole('coordinator');

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'VolunSync Tech Summit',
            'slug' => 'volunsync-tech-summit-'.uniqid(),
            'description' => 'Community summit event',
            'venue_name' => 'Sabuga ITB',
            'venue_lat' => -6.8857,
            'venue_lng' => 107.6085,
            'checkin_radius_meters' => 250,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(6),
            'status' => Event::STATUS_OPEN,
        ]);

        $division = Division::create([
            'event_id' => $event->id,
            'coordinator_id' => $coordinator->id,
            'name' => 'Operations',
            'quota' => 10,
        ]);

        return [
            'organizer' => $organizer,
            'coordinator' => $coordinator,
            'event' => $event,
            'division' => $division,
        ];
    }

    public function test_volunteer_can_submit_application_with_cv_phone_and_optional_socials(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        ['division' => $division] = $this->createOpenEventAndDivision();

        $volunteer = User::factory()->create(['phone' => null]);
        $volunteer->assignRole('volunteer');

        $cv = UploadedFile::fake()->create('raka-cv.pdf', 250, 'application/pdf');

        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'I have experience managing event operations and volunteer logistics.',
                'phone' => '+62 812-3456-7890',
                'instagram' => '@rakapratama',
                'linkedin' => 'https://linkedin.com/in/rakapratama',
                'cv' => $cv,
            ])
            ->assertRedirect('/volunteer/applications');

        $application = Application::firstOrFail();

        $this->assertSame('+62 812-3456-7890', $application->phone);
        $this->assertSame('@rakapratama', $application->instagram);
        $this->assertSame('https://linkedin.com/in/rakapratama', $application->linkedin);
        $this->assertSame('raka-cv.pdf', $application->cv_original_name);
        $this->assertNotNull($application->cv_path);

        Storage::disk('local')->assertExists($application->cv_path);
        Storage::disk('public')->assertMissing($application->cv_path);

        // User's empty phone is auto-filled on submit
        $this->assertSame('+62 812-3456-7890', $volunteer->fresh()->phone);
    }

    public function test_optional_socials_can_be_omitted_and_existing_user_phone_is_not_overwritten(): void
    {
        Storage::fake('local');

        ['division' => $division] = $this->createOpenEventAndDivision();

        $volunteer = User::factory()->create(['phone' => '081111111111']);
        $volunteer->assignRole('volunteer');

        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'Excited to contribute to the operations team on event day.',
                'phone' => '089999999999',
                'cv' => UploadedFile::fake()->create('resume.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            ])
            ->assertRedirect('/volunteer/applications');

        $application = Application::firstOrFail();

        $this->assertSame('089999999999', $application->phone);
        $this->assertNull($application->instagram);
        $this->assertNull($application->linkedin);
        $this->assertSame('081111111111', $volunteer->fresh()->phone);
    }

    public function test_validation_enforces_required_cv_and_phone_and_cv_constraints(): void
    {
        Storage::fake('local');

        ['division' => $division] = $this->createOpenEventAndDivision();

        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');

        // Missing cv and phone
        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'I want to join this event division to help the community.',
            ])
            ->assertSessionHasErrors(['cv', 'phone']);

        // Invalid mime type (png)
        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'I want to join this event division to help the community.',
                'phone' => '081234567890',
                'cv' => UploadedFile::fake()->image('photo.png'),
            ])
            ->assertSessionHasErrors(['cv']);

        // Oversized file (> 5 MB)
        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'I want to join this event division to help the community.',
                'phone' => '081234567890',
                'cv' => UploadedFile::fake()->create('huge.pdf', 6000, 'application/pdf'),
            ])
            ->assertSessionHasErrors(['cv']);
    }

    public function test_private_cv_access_is_restricted_to_owner_event_organizer_and_division_coordinator(): void
    {
        Storage::fake('local');

        ['organizer' => $organizer, 'coordinator' => $coordinator, 'division' => $division] = $this->createOpenEventAndDivision();

        $applicant = User::factory()->create();
        $applicant->assignRole('volunteer');

        $otherVolunteer = User::factory()->create();
        $otherVolunteer->assignRole('volunteer');

        $otherOrganizer = User::factory()->create();
        $otherOrganizer->assignRole('organizer');

        $otherCoordinator = User::factory()->create();
        $otherCoordinator->assignRole('coordinator');

        $this->actingAs($applicant)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'I want to contribute to the operations team for the whole summit.',
                'phone' => '081234567890',
                'instagram' => '@applicant',
                'cv' => UploadedFile::fake()->create('applicant-cv.pdf', 150, 'application/pdf'),
            ])
            ->assertRedirect('/volunteer/applications');

        $application = Application::firstOrFail();
        $cvRoute = route('applications.cv', $application);

        // Authorized: applicant (CV owner), event organizer, assigned coordinator
        $this->actingAs($applicant)->get($cvRoute)->assertOk();
        $this->actingAs($applicant)->get($cvRoute.'?download=1')
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=applicant-cv.pdf');
        $this->actingAs($organizer)->get($cvRoute)->assertOk();
        $this->actingAs($coordinator)->get($cvRoute)->assertOk();

        // Unauthorized: other volunteer, other organizer, unassigned coordinator
        $this->actingAs($otherVolunteer)->get($cvRoute)->assertForbidden();
        $this->actingAs($otherOrganizer)->get($cvRoute)->assertForbidden();
        $this->actingAs($otherCoordinator)->get($cvRoute)->assertForbidden();

        // Guest redirected to login
        auth()->logout();
        $this->get($cvRoute)->assertRedirect('/login');
    }

    public function test_cv_endpoint_returns_404_when_cv_is_missing_or_file_not_found(): void
    {
        Storage::fake('local');

        ['organizer' => $organizer, 'event' => $event, 'division' => $division] = $this->createOpenEventAndDivision();

        $applicant = User::factory()->create();
        $applicant->assignRole('volunteer');

        $applicationWithoutCv = Application::create([
            'user_id' => $applicant->id,
            'event_id' => $event->id,
            'division_id' => $division->id,
            'motivation' => 'Legacy seeded application without CV attached.',
            'status' => Application::STATUS_SUBMITTED,
        ]);

        $this->actingAs($applicant)
            ->get(route('applications.cv', $applicationWithoutCv))
            ->assertNotFound();

        $this->actingAs($organizer)
            ->get(route('applications.cv', $applicationWithoutCv))
            ->assertNotFound();
    }

    public function test_volunteer_and_admin_application_endpoints_expose_contact_and_cv_props(): void
    {
        Storage::fake('local');

        ['organizer' => $organizer, 'division' => $division] = $this->createOpenEventAndDivision();

        $applicant = User::factory()->create();
        $applicant->assignRole('volunteer');

        $this->actingAs($applicant)
            ->post('/volunteer/applications', [
                'division_id' => $division->id,
                'motivation' => 'Ready to support operations and registration desk duties.',
                'phone' => '081200001111',
                'instagram' => '@volunsync_user',
                'linkedin' => 'https://linkedin.com/in/volunsync-user',
                'cv' => UploadedFile::fake()->create('my-resume.pdf', 200, 'application/pdf'),
            ])
            ->assertRedirect('/volunteer/applications');

        $application = Application::firstOrFail();
        $expectedCvUrl = route('applications.cv', $application);

        $this->actingAs($applicant)
            ->get('/volunteer/applications')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('volunteer/Applications')
                ->has('applications', 1)
                ->where('applications.0.phone', '081200001111')
                ->where('applications.0.instagram', '@volunsync_user')
                ->where('applications.0.linkedin', 'https://linkedin.com/in/volunsync-user')
                ->where('applications.0.cv_original_name', 'my-resume.pdf')
                ->where('applications.0.cv_url', $expectedCvUrl)
            );

        $this->actingAs($organizer)
            ->get('/admin/applications')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/applications/Index')
                ->has('applications', 1)
                ->where('applications.0.phone', '081200001111')
                ->where('applications.0.instagram', '@volunsync_user')
                ->where('applications.0.linkedin', 'https://linkedin.com/in/volunsync-user')
                ->where('applications.0.cv_original_name', 'my-resume.pdf')
                ->where('applications.0.cv_url', $expectedCvUrl)
            );
    }
}
