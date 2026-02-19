<?php

namespace App\Http\Controllers;

use App\Services\SchemaFixerService;
use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Throwable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class SchemaController extends Controller
{
    protected function getUserDbConfig(){
        $userId = Auth::id();

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

        $configJson = DB::table('user_db_configs')
            ->where('user_id', $userId)
            ->value('db_config');

        if($configJson){
            return json_decode(Crypt::decryptString($configJson), true);
        }
        else{
            return $defaultConfig;
        }
    }

    public function readSchema(Request $request, SchemaReaderService $reader){
        $config = $this->getUserDbConfig();

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
        $config = $this->getUserDbConfig();

        try{
            $source = $request->query('source');
            $target = $request->query('target');

            if (!$source || !$target) {
                return response()->json(['error' => 'Databases not specified'], 400);
            }

            return response()->json(
                $scanner->scan($source, $target, $config)
            );

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function fixSchema(Request $request, SchemaReaderService $reader, SchemaScannerService $scanner, SchemaFixerService $fixer){
        $config = $this->getUserDbConfig();

        try{

            $source = $request->query('source');
            $target = $request->query('target');

            $masterSchema = $reader->readSchemaByDatabase($source, $config);
            $clientSchema = $reader->readSchemaByDatabase($target, $config);

            $conflicts = $scanner->scan($source, $target, $config);
            
            $message = $fixer->fix($conflicts['conflicts'], $masterSchema['schema'], $clientSchema['schema'], $target, $config);

            return response()->json($message);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function readAllDatabases(SchemaReaderService $reader){
        $config = $this->getUserDbConfig();

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
