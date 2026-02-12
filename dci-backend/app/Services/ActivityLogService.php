<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Create a new class instance.
     */
    public static function log($action, $description = null) {
        DB::connection('dci_system')->table('activity_logs')->insert([
            'user_id' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
