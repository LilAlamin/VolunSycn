<?php

namespace App\Http\Middleware;

use App\Models\Application;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $acceptedDivisions = [];
        if ($user) {
            $acceptedDivisions = Application::query()
                ->where('user_id', $user->id)
                ->where('status', Application::STATUS_ACCEPTED)
                ->with(['division:id,name,event_id', 'event:id,title,status'])
                ->get()
                ->map(fn (Application $app): array => [
                    'id' => $app->division_id,
                    'name' => $app->division?->name ?? 'Division',
                    'event_id' => $app->event_id,
                    'event_title' => $app->event?->title ?? 'Event',
                    'event_status' => $app->event?->status ?? 'open',
                ])
                ->values()
                ->all();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'roles' => $user->getRoleNames()->values()->all(),
                    'verified_hours' => $user->totalVerifiedHours(),
                    'accepted_divisions' => $acceptedDivisions,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
