<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\AttendanceLog;
use App\Models\Division;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $organizerRole = Role::firstOrCreate(['name' => 'organizer']);
        $coordinatorRole = Role::firstOrCreate(['name' => 'coordinator']);
        $volunteerRole = Role::firstOrCreate(['name' => 'volunteer']);

        $password = Hash::make('password');

        // 1. Primary Demo Accounts (Multi-Organization Organizers)
        $organizer = User::firstOrCreate(
            ['email' => 'organizer@volunsync.test'],
            [
                'name' => 'Ronald Ramadhani Pangestu',
                'phone' => '+62 812-2001-0001',
                'bio' => 'Lead Community Event Organizer — SIPA & Nusantara Civic Initiatives.',
                'organization_name' => 'SIPA Cultural & Civic Collective',
                'organization_description' => 'Community-driven performing arts, cultural heritage, and public literacy initiatives.',
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );
        $organizer->syncRoles([$organizerRole]);

        $secondOrganizer = User::firstOrCreate(
            ['email' => 'organizer2@volunsync.test'],
            [
                'name' => 'Dina Marlina',
                'phone' => '+62 812-2001-0099',
                'bio' => 'Program Director at Nusantara Eco & Health Volunteers.',
                'organization_name' => 'Nusantara Eco & Health Network',
                'organization_description' => 'Grassroots environmental cleanup, river conservation, and public health drives.',
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );
        $secondOrganizer->syncRoles([$organizerRole]);

        $coordinatorsData = [
            [
                'email' => 'coordinator@volunsync.test',
                'name' => 'Azka Kurnia Akbar',
                'phone' => '+62 812-2001-0002',
                'bio' => 'On-Site Operations & Logistics Division Coordinator.',
            ],
            [
                'email' => 'coordinator2@volunsync.test',
                'name' => 'Alif Fathi Athallah',
                'phone' => '+62 812-2001-0003',
                'bio' => 'Media, Creative Documentation & Public Relations Coordinator.',
            ],
            [
                'email' => 'coordinator3@volunsync.test',
                'name' => 'Alice Restituta Cynthia Dewi',
                'phone' => '+62 812-2001-0004',
                'bio' => 'Community Outreach, Registration & Volunteer Welfare Coordinator.',
            ],
        ];

        $coordinators = collect($coordinatorsData)->map(function (array $data) use ($password, $coordinatorRole, $organizer): User {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'bio' => $data['bio'],
                    'created_by_organizer_id' => $organizer->id,
                    'password' => $password,
                    'email_verified_at' => now(),
                ],
            );
            $user->syncRoles([$coordinatorRole]);

            return $user;
        });

        $demoVolunteer = User::firstOrCreate(
            ['email' => 'volunteer@volunsync.test'],
            [
                'name' => 'Nadia Kusuma',
                'phone' => '+62 813-4567-8901',
                'bio' => 'Informatics student passionate about urban greening, civic tech, and local cultural festivals.',
                'city' => 'Surakarta',
                'address' => 'Jl. Slamet Riyadi No. 142, Kemlayan, Serengan',
                'date_of_birth' => '2004-05-14',
                'emergency_contact_name' => 'Hendra Kusuma (Father)',
                'emergency_contact_phone' => '+62 812-3344-5566',
                'skills' => 'Crowd Coordination, First Aid Basics, Bilingual MC',
                'profile_verified_at' => now(),
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );
        $demoVolunteer->syncRoles([$volunteerRole]);

        // 2. Generate 105 Simulated Volunteer Profiles
        $volunteers = collect([$demoVolunteer]);
        $existingCount = User::role('volunteer')->count();
        $toCreate = max(0, 105 - $existingCount);

        if ($toCreate > 0) {
            $created = User::factory()
                ->count($toCreate)
                ->create([
                    'password' => $password,
                    'email_verified_at' => now(),
                ]);

            foreach ($created as $vol) {
                $vol->update([
                    'phone' => '+62 81'.fake()->numerify('#-####-####'),
                    'bio' => fake()->sentence(12),
                ]);
                $vol->assignRole($volunteerRole);
            }
        }

        $volunteers = User::role('volunteer')->get();

        // 3. Five Realistic Community Events
        $eventsSpec = [
            [
                'title' => 'Bandung Heritage & Cultural Festival 2026',
                'description' => 'Annual city-wide celebration of Sundanese heritage, local artisans, culinary stalls, and youth community performances at Sabuga ITB.',
                'venue_name' => 'Sabuga Convention Center, Bandung',
                'venue_lat' => -6.8868000,
                'venue_lng' => 107.6085000,
                'checkin_radius_meters' => 300,
                'start_date' => now()->addDays(2)->setTime(8, 0),
                'end_date' => now()->addDays(4)->setTime(21, 0),
                'status' => Event::STATUS_ONGOING,
                'divisions' => [
                    ['name' => 'On-Site Operations', 'quota' => 25, 'description' => 'Manage stage flow, crowd guidance, and venue safety checkpoints.', 'announcements' => 'Briefing starts at 07:15 WIB at Main Lobby Gate A. Wear the Mars Green VolunSync vest and bring a refillable tumbler.'],
                    ['name' => 'Logistics & Supplies', 'quota' => 20, 'description' => 'Coordinate booth setups, sound equipment transport, and hydration stations.', 'announcements' => 'Equipment inventory check is scheduled for 06:45 WIB near Loading Dock B.'],
                    ['name' => 'Media & Documentation', 'quota' => 15, 'description' => 'Capture event photography, short-form reels, and live community stories.', 'announcements' => 'Upload raw clips to the division media folder at the end of every shift.'],
                ],
            ],
            [
                'title' => 'Cikapundung River Cleanup & Eco-Action',
                'description' => 'Grassroots environmental restoration uniting students, residents, and river rangers to clean 4km of riverbanks and run waste-sorting workshops.',
                'venue_name' => 'Taman Cikapundung Riverspot, Bandung',
                'venue_lat' => -6.9016000,
                'venue_lng' => 107.6097000,
                'checkin_radius_meters' => 250,
                'start_date' => now()->addDays(9)->setTime(7, 0),
                'end_date' => now()->addDays(9)->setTime(15, 0),
                'status' => Event::STATUS_OPEN,
                'divisions' => [
                    ['name' => 'Field Cleanup Crew', 'quota' => 30, 'description' => 'Safe riverbank waste collection and recyclable sorting teams.', 'announcements' => 'Gloves, boots, and grabbers will be distributed at Registration Tent 1.'],
                    ['name' => 'Medical & First Aid', 'quota' => 10, 'description' => 'Monitor volunteer hydration, heat safety, and basic first-aid response.', 'announcements' => 'First aid kits are stationed at North and South river checkpoints.'],
                    ['name' => 'Community Outreach', 'quota' => 15, 'description' => 'Engage local residents with zero-waste education booths.', 'announcements' => 'Brochures and interactive quiz boards are ready at the Information Desk.'],
                ],
            ],
            [
                'title' => 'Digital Literacy Bootcamp for UMKM',
                'description' => 'Weekend hands-on clinic helping 120 neighborhood micro-businesses adopt QRIS payments, digital bookkeeping, and social media storefronts.',
                'venue_name' => 'Gedung Sate Creative Hall, Bandung',
                'venue_lat' => -6.9024000,
                'venue_lng' => 107.6188000,
                'checkin_radius_meters' => 200,
                'start_date' => now()->addDays(16)->setTime(9, 0),
                'end_date' => now()->addDays(17)->setTime(17, 0),
                'status' => Event::STATUS_OPEN,
                'divisions' => [
                    ['name' => 'Tech Mentors', 'quota' => 20, 'description' => '1-on-1 assistance for UMKM owners setting up digital catalogs and QRIS.', 'announcements' => 'Review the Mentor Playbook before Saturday morning onboarding.'],
                    ['name' => 'Participant Registration', 'quota' => 12, 'description' => 'Welcome UMKM participants, verify attendance, and distribute workshop kits.', 'announcements' => 'Check-in tablets will be synced 30 minutes before doors open.'],
                ],
            ],
            [
                'title' => 'Dago Car Free Day Health & Blood Drive',
                'description' => 'Sunday morning public health fair offering free blood pressure screening, PMI blood donation, and nutrition counseling for Bandung families.',
                'venue_name' => 'Dago Car Free Day Zone, Bandung',
                'venue_lat' => -6.8906000,
                'venue_lng' => 107.6131000,
                'checkin_radius_meters' => 300,
                'start_date' => now()->addDays(23)->setTime(6, 0),
                'end_date' => now()->addDays(23)->setTime(11, 30),
                'status' => Event::STATUS_OPEN,
                'divisions' => [
                    ['name' => 'Donor Queue & Hospitality', 'quota' => 18, 'description' => 'Guide donors through screening, rest area, and refreshment distribution.', 'announcements' => 'Arrive by 05:30 WIB before road closures take effect.'],
                    ['name' => 'Health Booth Support', 'quota' => 14, 'description' => 'Assist nurses with queue registration and educational handouts.', 'announcements' => 'Coordinate directly with PMI medical leads on site.'],
                ],
            ],
            [
                'title' => 'Alun-Alun Youth Book Fair & Literacy Drive',
                'description' => 'Completed 2-day book donation and reading festival that distributed 3,500 children books to community reading corners across Greater Bandung.',
                'venue_name' => 'Alun-Alun Kota Bandung',
                'venue_lat' => -6.9218000,
                'venue_lng' => 107.6071000,
                'checkin_radius_meters' => 250,
                'start_date' => now()->subDays(10)->setTime(8, 0),
                'end_date' => now()->subDays(9)->setTime(18, 0),
                'status' => Event::STATUS_COMPLETED,
                'divisions' => [
                    ['name' => 'Book Curation & Sorting', 'quota' => 20, 'description' => 'Catalog donated books by age group and prepare school packages.', 'announcements' => 'Thank you team! All 3,500 books have been delivered.'],
                    ['name' => 'Reading Corner Hosts', 'quota' => 15, 'description' => 'Facilitate storytelling sessions for elementary school visitors.', 'announcements' => 'Verified service hour certificates are now live in your profile.'],
                ],
            ],
        ];

        $motivations = [
            'I want to contribute directly to Bandung community initiatives and gain hands-on event coordination experience.',
            'Having volunteered in campus organizations for two years, I am excited to help make this community event run smoothly.',
            'I am passionate about civic service and ready to collaborate with a multidisciplinary team on site.',
            'Looking forward to supporting local residents and applying my communication and problem-solving skills.',
            'I have strong experience in logistics and crowd management and would love to support this division.',
        ];

        $allDivisions = collect();

        foreach ($eventsSpec as $eventIdx => $spec) {
            $event = Event::firstOrCreate(
                ['slug' => Str::slug($spec['title'])],
                [
                    'organizer_id' => $organizer->id,
                    'title' => $spec['title'],
                    'description' => $spec['description'],
                    'venue_name' => $spec['venue_name'],
                    'venue_lat' => $spec['venue_lat'],
                    'venue_lng' => $spec['venue_lng'],
                    'checkin_radius_meters' => $spec['checkin_radius_meters'],
                    'start_date' => $spec['start_date'],
                    'end_date' => $spec['end_date'],
                    'status' => $spec['status'],
                ],
            );

            foreach ($spec['divisions'] as $divIdx => $divSpec) {
                $coord = $coordinators[($eventIdx + $divIdx) % $coordinators->count()];

                $division = Division::firstOrCreate(
                    [
                        'event_id' => $event->id,
                        'name' => $divSpec['name'],
                    ],
                    [
                        'coordinator_id' => $coord->id,
                        'description' => $divSpec['description'],
                        'announcements' => $divSpec['announcements'],
                        'quota' => $divSpec['quota'],
                    ],
                );

                $allDivisions->push($division);
            }
        }

        // 4. Populate Demo Volunteer Applications & Shifts so demo video looks awesome right away
        $firstDivision = $allDivisions->first();
        $secondEventDivision = $allDivisions->skip(3)->first();
        $thirdEventDivision = $allDivisions->skip(6)->first();

        if ($firstDivision) {
            Application::firstOrCreate(
                [
                    'user_id' => $demoVolunteer->id,
                    'event_id' => $firstDivision->event_id,
                    'division_id' => $firstDivision->id,
                ],
                [
                    'motivation' => 'I have led campus festival stage operations before and would love to help keep Sabuga operations seamless!',
                    'status' => Application::STATUS_ACCEPTED,
                    'reviewed_by' => $firstDivision->coordinator_id,
                    'reviewed_at' => now()->subDays(2),
                    'reviewer_notes' => 'Strong operations background — welcome to the On-Site Operations team!',
                ],
            );
        }

        if ($secondEventDivision) {
            Application::firstOrCreate(
                [
                    'user_id' => $demoVolunteer->id,
                    'event_id' => $secondEventDivision->event_id,
                    'division_id' => $secondEventDivision->id,
                ],
                [
                    'motivation' => 'I live near Cikapundung and want to participate actively in cleaning our riverbanks.',
                    'status' => Application::STATUS_UNDER_REVIEW,
                    'reviewed_by' => $secondEventDivision->coordinator_id,
                    'reviewed_at' => now()->subHours(5),
                    'reviewer_notes' => 'Shortlisted for final shift allocation.',
                ],
            );
        }

        if ($thirdEventDivision) {
            Application::firstOrCreate(
                [
                    'user_id' => $demoVolunteer->id,
                    'event_id' => $thirdEventDivision->event_id,
                    'division_id' => $thirdEventDivision->id,
                ],
                [
                    'motivation' => 'As an Informatics student, I can mentor UMKM owners on digital bookkeeping and QRIS onboarding.',
                    'status' => Application::STATUS_SUBMITTED,
                ],
            );
        }

        // 5. Distribute Applications across 100+ volunteers across all statuses
        $otherVolunteers = $volunteers->reject(fn (User $u) => $u->id === $demoVolunteer->id)->values();
        $statuses = [
            Application::STATUS_ACCEPTED,
            Application::STATUS_ACCEPTED,
            Application::STATUS_UNDER_REVIEW,
            Application::STATUS_SUBMITTED,
            Application::STATUS_REJECTED,
        ];

        $volCursor = 0;
        foreach ($allDivisions as $division) {
            $applicantsForDiv = 14;
            $acceptedSoFar = $division->acceptedApplications()->count();

            for ($i = 0; $i < $applicantsForDiv; $i++) {
                $vol = $otherVolunteers[$volCursor % $otherVolunteers->count()];
                $volCursor++;

                $status = $statuses[$i % count($statuses)];
                if ($status === Application::STATUS_ACCEPTED && $acceptedSoFar >= $division->quota) {
                    $status = Application::STATUS_UNDER_REVIEW;
                }

                $app = Application::firstOrCreate(
                    [
                        'user_id' => $vol->id,
                        'event_id' => $division->event_id,
                        'division_id' => $division->id,
                    ],
                    [
                        'motivation' => $motivations[($volCursor + $i) % count($motivations)],
                        'status' => $status,
                        'reviewed_by' => $status !== Application::STATUS_SUBMITTED ? $division->coordinator_id : null,
                        'reviewed_at' => $status !== Application::STATUS_SUBMITTED ? now()->subHours(rand(2, 72)) : null,
                        'reviewer_notes' => match ($status) {
                            Application::STATUS_ACCEPTED => 'Great fit for the division. Welcome aboard!',
                            Application::STATUS_UNDER_REVIEW => 'Checking schedule availability.',
                            Application::STATUS_REJECTED => 'Division quota prioritized for earlier applicants; please apply to another division.',
                            default => null,
                        },
                    ],
                );

                if ($app->status === Application::STATUS_ACCEPTED) {
                    $acceptedSoFar++;
                }
            }
        }

        // 6. Create Multi-Division Shifts & Non-Overlapping Assignments + Attendance Logs
        foreach ($allDivisions as $divIdx => $division) {
            $event = $division->event;
            $baseStart = $event->start_date->copy();

            $shiftTemplates = [
                [
                    'title' => $division->name.' — Morning Shift',
                    'start' => $baseStart->copy()->setTime(8, 0),
                    'end' => $baseStart->copy()->setTime(12, 0),
                    'location' => $event->venue_name.' (Zone A)',
                ],
                [
                    'title' => $division->name.' — Afternoon Shift',
                    'start' => $baseStart->copy()->setTime(13, 0),
                    'end' => $baseStart->copy()->setTime(17, 0),
                    'location' => $event->venue_name.' (Zone B)',
                ],
            ];

            $acceptedUserIds = Application::query()
                ->where('division_id', $division->id)
                ->where('status', Application::STATUS_ACCEPTED)
                ->pluck('user_id');

            foreach ($shiftTemplates as $sIdx => $tpl) {
                $shift = Shift::firstOrCreate(
                    [
                        'division_id' => $division->id,
                        'title' => $tpl['title'],
                    ],
                    [
                        'event_id' => $event->id,
                        'description' => 'Operational shift for '.$division->name.' at '.$event->title.'.',
                        'start_time' => $tpl['start'],
                        'end_time' => $tpl['end'],
                        'location' => $tpl['location'],
                        'qr_token' => 'VS-'.strtoupper(substr(md5($division->id.'-'.$sIdx), 0, 10)),
                    ],
                );

                // Assign accepted volunteers without overlap
                $slice = $acceptedUserIds->slice($sIdx * 3, 4);
                foreach ($slice as $uid) {
                    $hasOverlap = Shift::query()
                        ->whereHas('volunteers', fn ($q) => $q->where('users.id', $uid))
                        ->where('id', '!=', $shift->id)
                        ->where('start_time', '<', $shift->end_time)
                        ->where('end_time', '>', $shift->start_time)
                        ->exists();

                    if (! $hasOverlap) {
                        $shift->volunteers()->syncWithoutDetaching([
                            $uid => ['assigned_at' => now()->subDay()],
                        ]);
                    }
                }

                // Ensure Demo Volunteer is assigned to first division's Morning Shift (ready for check-in)
                if ($divIdx === 0 && $sIdx === 0) {
                    $shift->volunteers()->syncWithoutDetaching([
                        $demoVolunteer->id => ['assigned_at' => now()->subDay()],
                    ]);
                }

                // Seed realistic attendance logs for completed and ongoing events
                if ($event->status === Event::STATUS_COMPLETED) {
                    foreach ($shift->volunteers()->get() as $vol) {
                        AttendanceLog::firstOrCreate(
                            ['shift_id' => $shift->id, 'user_id' => $vol->id],
                            [
                                'checked_in_at' => $shift->start_time->copy()->addMinutes(rand(0, 8)),
                                'checked_out_at' => $shift->end_time->copy()->subMinutes(rand(0, 5)),
                                'checkin_lat' => $event->venue_lat,
                                'checkin_lng' => $event->venue_lng,
                                'verification_method' => AttendanceLog::METHOD_QR_AND_GEO,
                                'verified_hours' => 3.92,
                                'status' => AttendanceLog::STATUS_COMPLETED,
                            ],
                        );
                    }
                } elseif ($event->status === Event::STATUS_ONGOING && $sIdx === 0) {
                    foreach ($shift->volunteers()->where('users.id', '!=', $demoVolunteer->id)->limit(3)->get() as $idx => $vol) {
                        $completed = $idx === 0;
                        AttendanceLog::firstOrCreate(
                            ['shift_id' => $shift->id, 'user_id' => $vol->id],
                            [
                                'checked_in_at' => now()->subHours(2)->subMinutes(rand(5, 25)),
                                'checked_out_at' => $completed ? now()->subMinutes(10) : null,
                                'checkin_lat' => $event->venue_lat,
                                'checkin_lng' => $event->venue_lng,
                                'verification_method' => AttendanceLog::METHOD_QR_AND_GEO,
                                'verified_hours' => $completed ? 2.15 : 0,
                                'status' => $completed ? AttendanceLog::STATUS_COMPLETED : AttendanceLog::STATUS_CHECKED_IN,
                            ],
                        );
                    }
                }
            }
        }
    }
}
