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

        $conflictTypes = ['extra_client_table', 'extra_client_column', 'type_mismatch', 'length_mismatch'];

        // Restructuring data for easier pagination per table and then putting it in the table array
        foreach($conflictTypes as $type){
            if(!empty($conflicts[$type])) {
                foreach($conflicts[$type] as $table => $columns){
                    if($type == 'extra_client_table'){
                        $tables[$table]['issues'][] = [
                            'type' => $type
                        ];
                    } else{
                        foreach($columns as $column => $details){
                            $issue = ['type' => $type, 'column' => $column];
                            if(isset($details['master'])){
                                $issue['master'] = $details['master'];
                            }
                            if(isset($details['client'])){
                                $issue['client'] = $details['client'];
                            }
                            $tables[$table]['issues'][] = $issue;
                        }
                    }
                    
                }
            }
        }

        // Getting the first 100 rows from the table
        foreach ($tables as $tableName => &$tableData) {
            $tableData['preview'] = $reader->previewTable($target, $tableName, $config);
        }

        if(!empty($tables)) {
            return response()->json([
                'status' => 'warning',
                'conflicted_tables' => $tables,
            ]);
        }

    }

    public function deleteAllData(){

    }

    public function deleteIncompatibleData(){
        
    }
}
