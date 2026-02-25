<?php

namespace App\Http\Controllers;

use App\Models\SavedDatabase;
use App\Models\UserDBConfig;
use App\Services\ActivityLogService;
use Exception;
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

        $configs = SavedDatabase::where('config_driver', $request->driver)
        ->get();

        $configs->transform(function ($config) {
            $decrypted = Crypt::decryptString($config->db_config);

            $decoded = json_decode($decrypted, true);

            $config->host = $decoded['host'] ?? null;

            return $config;
        });

        return response()->json([
            'configs' => $configs
        ]);
    }

    public function indexUserConfig(Request $request)
    {
        $user = Auth::user();

        $masterConfig = $user->userDbConfigs->where('role', 'master')->first();
        $clientConfig = $user->userDbConfigs->where('role', 'client')->first();

        if (!$masterConfig) {
            return response()->json(['message' => 'Master config not found'], 404);
        }

        if (!$clientConfig) {
            return response()->json(['message' => 'Client config not found'], 404);
        }

        $masterSaved = $masterConfig->savedDatabase;
        $clientSaved = $clientConfig->savedDatabase;

        if (!$masterSaved || !$clientSaved) {
            return response()->json(['message' => 'Saved database record missing'], 404);
        }

        try {
            $masterDecrypted = json_decode(Crypt::decryptString($masterSaved->db_config), true);
            $clientDecrypted = json_decode(Crypt::decryptString($clientSaved->db_config), true);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to decrypt database config', 'error' => $e->getMessage()], 500);
        }

        $masterSaved->host = $masterDecrypted['host'] ?? null;
        $clientSaved->host = $clientDecrypted['host'] ?? null;

        return response()->json([
            'master_config' => $masterSaved,
            'client_config' => $clientSaved,
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
