<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Event;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reports = Report::query()
            ->where('reporter_id', $request->user()->id)
            ->with(['event.category', 'event.region', 'event.division', 'event.city', 'event.images'])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 12), 50));

        return response()->json([
            'reports' => ReportResource::collection($reports),
        ]);
    }

    public function show(Request $request, Report $report): JsonResponse
    {
        if ((int) $report->reporter_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to view this report.');
        }

        return response()->json([
            'report' => new ReportResource($report->load(['event.category', 'event.region', 'event.division', 'event.city', 'event.images'])),
        ]);
    }

    public function store(StoreReportRequest $request, Event $event): JsonResponse
    {
        $this->ensureEventCanBeReported($event);

        $validated = $request->validated();

        $existingOpenReport = Report::query()
            ->where('reporter_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->whereIn('status', ['open', 'reviewing'])
            ->first();

        if ($existingOpenReport) {
            return response()->json([
                'message' => 'You already have an open report for this event.',
                'report' => new ReportResource($existingOpenReport->load(['event.category', 'event.region', 'event.division', 'event.city'])),
            ], 200);
        }

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'event_id' => $event->id,
            'type' => $validated['type'],
            'message' => $validated['message'] ?? null,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Report submitted successfully.',
            'report' => new ReportResource($report->load(['event.category', 'event.region', 'event.division', 'event.city'])),
        ], 201);
    }

    private function ensureEventCanBeReported(Event $event): void
    {
        if ($event->status !== 'published' || $event->visibility !== 'public') {
            abort(422, 'Only published public events can be reported by users.');
        }
    }
}