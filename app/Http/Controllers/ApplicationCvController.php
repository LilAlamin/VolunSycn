<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationCvController extends Controller
{
    public function __invoke(Request $request, Application $application): StreamedResponse
    {
        $application->loadMissing(['event:id,organizer_id', 'division:id,coordinator_id']);

        Gate::authorize('viewCv', $application);

        if (blank($application->cv_path) || ! Storage::disk('local')->exists($application->cv_path)) {
            abort(404, 'CV file not found.');
        }

        $filename = $application->cv_original_name ?: basename($application->cv_path);

        if ($request->boolean('download')) {
            return Storage::disk('local')->download($application->cv_path, $filename);
        }

        return Storage::disk('local')->response($application->cv_path, $filename);
    }
}
