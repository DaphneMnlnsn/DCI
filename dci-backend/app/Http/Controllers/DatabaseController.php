<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DatabaseController extends Controller
{
    public function setDatabase(Request $request){

        $request->validate([
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
        ]);
        
        $driver = $request->driver;

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
        Config::set('database.connections.dynamic_test', $config);

        try {
            DB::purge('dynamic_test');
            DB::connection('dynamic_test')->getPdo();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Connection failed',
                'error' => $e->getMessage()
            ], 500);
        }

        DB::table('user_db_configs')->updateOrInsert(
            ['user_id' => $userID],
            ['db_config' => json_encode($config), 'updated_at' => now()]
        );

        return response()->json([
            'message' => 'Database connection configured successfully'
        ]);
    }
}
