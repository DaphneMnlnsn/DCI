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

        $ignored = IgnoredConflict::whereHas('userConfig', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'ignored' => $ignored,
        ]);
    }

    public function store(Request $request){
        $validated = $request->validate([
            'user_config_id' => 'required|integer',
            'database_name' => 'required|string',
            'table_name' => 'required|string',
            'column_name' => 'nullable|string',
            'conflict_type' => 'required|string',
        ]);

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
        $validated = $request->validate([
            'conflicts' => 'required|array'
        ]);

        $user = Auth::user();

        foreach ($validated['conflicts'] as $conflict) {
            IgnoredConflict::firstOrCreate([
                'user_config_id' => $conflict['user_config_id'],
                'database_name' => $conflict['database_name'],
                'table_name' => $conflict['table_name'],
                'column_name' => $conflict['column_name'],
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
