<?php

namespace App\Http\Controllers;

use App\Models\SavedDatabase;
use App\Models\UserDBConfig;
use App\Services\SchemaFixerService;
use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Throwable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchemaController extends Controller
{
    protected function getUserDbConfig($role){

        $userID = Auth::id();

        $dbConfig = UserDBConfig::where('user_id', $userID)
                ->where('role', $role)
                ->first();

        $defaultConfig = [
            'driver' => 'mysql',
            'host' => '127.0.0.1',
            'port' => '3306',
            'database' => null,
            'username' => 'root',
            'password' => null,
            'charset' => 'utf8',
            'prefix' => '',
            'strict' => true,
        ];

        if (!$dbConfig) return $defaultConfig;

        $savedConfig = SavedDatabase::find($dbConfig->config_id);

        if (!$savedConfig) return $defaultConfig;

        $config = json_decode(Crypt::decryptString($savedConfig->db_config), true);

        return $config;
    }

    public function readSchema(Request $request, SchemaReaderService $reader){
        
        $request->validate([
            'role' => 'required|in:master,client',
        ]);

        $role = $request->role;

        $config = $this->getUserDbConfig($role);

        try {
            $database = $request->query('database');

            if (!$database) {
                return response()->json(['error' => 'Database not specified'], 400);
            }

            $schema = $reader->readSchemaByDatabase($database, $config);

            return response()->json($schema);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function scanSchema(Request $request, SchemaScannerService $scanner){
        $sourceConfig = $this->getUserDbConfig('master');
        $targetConfig = $this->getUserDbConfig('client');

        try{
            $source = $request->query('source');
            $target = $request->query('target');

            if (!$source || !$target) {
                return response()->json(['error' => 'Databases not specified'], 400);
            }

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

            return response()->json(
                $scanner->scan($source, $target, $sourceConfig, $targetConfig, $masterConfigId, $clientConfigId)
            );

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function fixSchema(Request $request, SchemaReaderService $reader, SchemaScannerService $scanner, SchemaFixerService $fixer){
        $sourceConfig = $this->getUserDbConfig('master');
        $targetConfig = $this->getUserDbConfig('client');

        try{

            $source = $request->query('source');
            $target = $request->query('target');

            $masterSchema = $reader->readSchemaByDatabase($source, $sourceConfig);
            $clientSchema = $reader->readSchemaByDatabase($target, $targetConfig);

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

            $conflicts = $scanner->scan($source, $target, $sourceConfig, $targetConfig, $masterConfigId, $clientConfigId);
            
            $message = $fixer->fix($conflicts['conflicts'], $masterSchema['schema'], $clientSchema['schema'], $target, $sourceConfig, $targetConfig);

            return response()->json($message);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function readAllDatabases(Request $request, SchemaReaderService $reader){
        $request->validate([
            'role' => 'required|in:master,client',
        ]);

        $role = $request->role;

        $config = $this->getUserDbConfig($role);

        try{

            $schema = $reader->readAllDatabases($config);
            return response()->json($schema);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);

        }
    }
}
