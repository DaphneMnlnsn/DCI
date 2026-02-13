<?php

namespace App\Http\Controllers;

use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ClientTableController extends Controller
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
            return json_decode($configJson, true);
        }
        else{
            return $defaultConfig;
        }
    }

    public function getTables(Request $request, SchemaScannerService $scanner, SchemaReaderService $reader){
        $config = $this->getUserDbConfig();

        $source = $request->query('source');
        $target = $request->query('target');

        if (!$source || !$target) {
            return response()->json(['error' => 'Databases not specified'], 400);
        }

        $rawConflicts = $scanner->scan($source, $target, $config);
        $conflicts = $rawConflicts['conflicts'];

        $tables = [];

        // Restructuring data for easier pagination per table and then putting it in the table array
        if(!empty($conflicts['extra_client_table'])) {
            foreach($conflicts['extra_client_table'] as $table => $value){
                $tables[$table]['issues'][] = [
                    'type' => 'extra_client_table'
                ];
            }
        }

        if(!empty($conflicts['extra_client_column'])) {
            foreach($conflicts['extra_client_column'] as $table => $columns){

                foreach($columns as $column => $value){
                    $tables[$table]['issues'][] = [
                        'type' => 'extra_client_column',
                        'column' => $column,
                    ];
                }
            }
        }

        if(!empty($conflicts['type_mismatch'])) {
            foreach($conflicts['type_mismatch'] as $table => $columns){
                foreach($columns as $column => $details){
                    $tables[$table]['issues'][] = [
                        'type' => 'type_mismatch',
                        'column' => $column,
                        'master' => $details['master'],
                        'client' => $details['client']
                    ];
                }
            }
        }

        if(!empty($conflicts['length_mismatch'])) {
            foreach($conflicts['length_mismatch'] as $table => $columns){
                foreach($columns as $column => $details){
                    $tables[$table]['issues'][] = [
                        'type' => 'length_mismatch',
                        'column' => $column,
                        'master' => $details['master'],
                        'client' => $details['client']
                    ];
                }
            }
        }

        // Getting the first 100 rows from the table
        foreach ($tables as $tableName => $tableData) {
            $tableData['preview'] = $reader->previewTable($target, $tableName, $config);
        }

        if(!empty($tables)) {
            return response()->json([
                'status' => 'warning',
                'conflicted_tables' => $tables,
            ]);
        }

    }
}
