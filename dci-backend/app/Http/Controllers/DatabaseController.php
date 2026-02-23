<?php

namespace App\Http\Controllers;

use App\Models\SavedDatabase;
use App\Models\UserDBConfig;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class DatabaseController extends Controller
{
    public function index(Request $request){

        $request->validate([
            'driver' => 'required|string'
        ]);

        $driver = $request->driver;
        
        // For testing the connection
        /*Config::set('database.connections.dynamic_test', $config);

        try {
            DB::purge('dynamic_test');
            DB::connection('dynamic_test')->getPdo();
        } catch (\Throwable $e) {
            Log::error($e);

            return response()->json([
                'message' => 'Connection failed',
                'error' => $e->getMessage()
            ], 500);
        }*/

        $configs = SavedDatabase::where('config_driver', $driver)->get();

        return response()->json([
            'configs' => $configs
        ]);
    }
    public function saveConfig(Request $request){

        $request->validate([
            'configName' => 'required|string',
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
        ]);
        
        $driver = $request->driver;
        $configName = $request->configName;

        $user = Auth::user();
        $userID = Auth::id();

        if($driver == 'mysql'){
            $config = [
                'driver' => $driver,
                'host' => $request->host,
                'port' => $request->port,
                'database' => "",
                'username' => $request->username,
                'password' => $request->password,
                'charset' => 'utf8',
                'prefix' => '',
                'strict' => true,
            ];

        } else{
            $config = [
                'driver' => $driver,
                'host' => $request->host,
                'port' => $request->port,
                'database' => "",
                'username' => $request->username,
                'password' => $request->password,
                'charset' => 'utf8',
                'prefix' => '',
            ];
        }

        // For testing the connection
        /*Config::set('database.connections.dynamic_test', $config);

        try {
            DB::purge('dynamic_test');
            DB::connection('dynamic_test')->getPdo();
        } catch (\Throwable $e) {
            Log::error($e);

            return response()->json([
                'message' => 'Connection failed',
                'error' => $e->getMessage()
            ], 500);
        }*/

        SavedDatabase::updateOrInsert(
            [
            'config_name' => $configName,
            'created_by' => $userID,
            ],
            [
            'config_driver' => $driver,
            'db_config' => Crypt::encryptString(json_encode($config)),
            'updated_at' => now(),
            'created_at' => now()
            ]
        );

        ActivityLogService::log(
            'SAVE DATABASE CONFIGURATION', 
            "User {$user->username} saved a database configuration.",
        );

        return response()->json([
            'message' => 'Database connection saved successfully'
        ]);
    }
    
    public function setDatabase(Request $request){

        $request->validate([
            'configId' => 'required|integer',
            'role' => 'required|in:master,client',
        ]);

        $userID = Auth::id();
        $configId = $request->configId;
        $role = $request->role;

        // For testing the connection
        /*Config::set('database.connections.dynamic_test', $config);

        try {
            DB::purge('dynamic_test');
            DB::connection('dynamic_test')->getPdo();
        } catch (\Throwable $e) {
            Log::error($e);

            return response()->json([
                'message' => 'Connection failed',
                'error' => $e->getMessage()
            ], 500);
        }*/

        UserDBConfig::updateOrInsert(
            [
            'user_id' => $userID,
            'role' => $role,
            ],
            [
            'config_id' => $configId,
            'updated_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Database connection configured successfully'
        ]);
    }
}
