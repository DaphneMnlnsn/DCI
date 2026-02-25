<?php

namespace App\Http\Controllers;

use App\Models\IgnoredConflict;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IgnoredConflictController extends Controller
{
    public function index(Request $request){
        $user = Auth::user();

        $ignored = IgnoredConflict::whereHas('clientConfig', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'ignored' => $ignored,
        ]);
    }

    public function store(Request $request){
        
        $user = Auth::user();

        $masterConfig = $user->userDbConfigs
            ->where('role', 'master')
            ->first();

        if (!$masterConfig) {
            return response()->json(['message' => 'Master config not found'], 404);
        }

        $clientConfig = $user->userDbConfigs
            ->where('role', 'client')
            ->first();

        if (!$clientConfig) {
            return response()->json(['message' => 'Client config not found'], 404);
        }

        $masterConfigId = $masterConfig->id;
        $clientConfigId = $clientConfig->id;

        $validated = $request->validate([
            'master_database_name' => 'required|string',
            'client_database_name' => 'required|string',
            'table_name' => 'required|string',
            'column_name' => 'nullable|string',
            'conflict_type' => 'required|string',
        ]);

        $validated['master_config_id'] = $masterConfigId;
        $validated['client_config_id'] = $clientConfigId;

        $conflict = IgnoredConflict::create($validated);
        
        $user = Auth::user();
        ActivityLogService::log(
            'IGNORE CONFLICT', 
            "User {$user->username} ignored conflict on {$validated['table_name']}.{$validated['column_name']}"
        );

        return response()->json([ 'message' => 'Conflict ignored successfully', 'conflict' => $conflict], 201);
    }

    public function storeMultiple(Request $request)
    {
        $user = Auth::user();

        $masterConfig = $user->userDbConfigs
            ->where('role', 'master')
            ->first();

        if (!$masterConfig) {
            return response()->json(['message' => 'Master config not found'], 404);
        }

        $clientConfig = $user->userDbConfigs
            ->where('role', 'client')
            ->first();

        if (!$clientConfig) {
            return response()->json(['message' => 'Client config not found'], 404);
        }

        $masterConfigId = $masterConfig->id;
        $clientConfigId = $clientConfig->id;

        $validated = $request->validate([
            'conflicts' => 'required|array'
        ]);

        foreach ($validated['conflicts'] as $conflict) {
            IgnoredConflict::firstOrCreate([
                'master_config_id' => $masterConfigId,
                'client_config_id' => $clientConfigId,
                'master_database_name' => $conflict['master_database_name'],
                'client_database_name' => $conflict['client_database_name'],
                'table_name' => $conflict['table_name'],
                'column_name' => $conflict['column_name'] ?? null,
                'conflict_type' => $conflict['conflict_type'],
            ]);

            ActivityLogService::log(
                'IGNORE CONFLICT',
                "User {$user->username} ignored conflict on {$conflict['table_name']}" .
                ($conflict['column_name'] ? ".{$conflict['column_name']}" : "")
            );
        }

        return response()->json([
            'message' => 'Conflicts ignored successfully'
        ]);
    }

    public function unignore(Request $request){
        $id = $request->input('id');

        $conflict = IgnoredConflict::find($id);

        if(!$conflict) {
            return response()->json(['message' => 'Ignored conflict not found'], 404);
        }

        $conflict->delete();

        $user = Auth::user();
        ActivityLogService::log(
            'UNIGNORE CONFLICT', 
            "User {$user->username} removed ignored conflict on {$conflict->table_name}.{$conflict->column_name}",
        );

        return response()->json(['message', 'Conflict unignored successfully'], 200);
    }

    public function unignoreMultiple(Request $request){
        $validated = $request->validate([
            'ignored' => 'required|array'
        ]);
        
        foreach ($validated['ignored'] as $ignored) {
            $conflict = IgnoredConflict::find($ignored);

            if(!$conflict) {
                return response()->json(['message' => 'Ignored conflict not found'], 404);
            }

            $conflictName = $conflict->table_name . ($conflict->column_name ? ".{$conflict->column_name}" : "");
            $conflict->delete();
            $user = Auth::user();
            ActivityLogService::log(
                'UNIGNORE CONFLICT',
                "User {$user->username} removed ignored conflict on {$conflictName}"
                );
        }

        return response()->json(['message', 'Conflict unignored successfully'], 200);
    }
}
