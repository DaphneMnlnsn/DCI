<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    public function index(Request $request) {
        $activityLogs = ActivityLog::orderBy("created_at","desc");

        return response()->json($activityLogs);
    }
}
