<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Services\SchemaReaderService;
use Illuminate\Support\Facades\Config;

class SchemaScannerService
{
    protected $reader;

    public function __construct(SchemaReaderService $reader){

        $this->reader = $reader;

    }

    public function scan(string $sourceDb, string $targetDb, array $config)
    {

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

        Config::set(
            "database.connections.$dynamicConnName",
            array_merge($config, ['database' => $sourceDb])
        );

        DB::purge($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $driver = $conn->getDriverName();

        $masterData = $this->reader->readSchemaByDatabase($sourceDb, $config);
        $clientData = $this->reader->readSchemaByDatabase($targetDb, $config);

        $masterSchema = $masterData['schema'];
        $clientSchema = $clientData['schema'];

        // Identifying table conflicts
        $masterTables = array_keys($masterSchema);
        $clientTables = array_keys($clientSchema);

        $conflicts = [];

        $missingTables = array_diff($masterTables, $clientTables);
        $extraTables = array_diff($clientTables, $masterTables);

        foreach($missingTables as $row){
            $conflicts['missing_client_table'][$row] = true;
        }

        foreach($extraTables as $row){
            $conflicts['extra_client_table'][$row] = true;
        }
        
        // Identifying column conflicts
        foreach($masterTables as $row){

            if(isset($clientSchema[$row])){

                $masterColumns = array_keys($masterSchema[$row]["columns"]);
                $clientColumns = array_keys($clientSchema[$row]["columns"]);

                $missingColumns = array_diff($masterColumns, $clientColumns);
                $extraColumns = array_diff($clientColumns, $masterColumns);

                foreach($missingColumns as $column){
                    $conflicts['missing_client_column'][$row][$column] = true;
                }

                foreach($extraColumns as $column){
                    $conflicts['extra_client_column'][$row][$column] = true;
                }
            }

        }

        // Identifying data type and length conflicts
        foreach($masterTables as $row){

            if(isset($clientSchema[$row])){

                foreach($masterSchema[$row]["columns"] as $columnName => $columnData){

                    $col = $columnName;
                    
                    if (!isset($clientSchema[$row]["columns"][$col])) {
                        continue;
                    }

                    if (isset($conflicts['missing_client_column'][$row][$col])) {
                        continue;
                    }

                    if(isset($clientSchema[$row]["columns"][$col])){

                        $masterColumn = $columnData;
                        $clientColumn = $clientSchema[$row]["columns"][$col];

                        if($masterColumn['data_type'] != $clientColumn['data_type']){
                            $conflicts['type_mismatch'][$row][$col] = [
                                'master' => $masterColumn['data_type'],
                                'client' => $clientColumn['data_type']
                            ];
                        }
                        
                    }

                }
                
            }
        }

        foreach($masterTables as $row){

            if(isset($clientSchema[$row])){

                foreach($masterSchema[$row]["columns"] as $columnName => $columnData){

                    $col = $columnName;

                    if (isset($conflicts['missing_client_column'][$row][$col])) {
                        continue;
                    }

                    if(isset($clientSchema[$row]["columns"][$col])){

                        $masterColumn = $columnData;
                        $clientColumn = $clientSchema[$row]["columns"][$col];

                        $masterMaxLength = $masterColumn['maximum_characters'] ?? 0;
                        $clientMaxLength = $clientColumn['maximum_characters'] ?? 0;

                        if($masterMaxLength != $clientMaxLength){
                            $conflicts['length_mismatch'][$row][$col] = [
                                'master' => $masterMaxLength,
                                'client' => $clientMaxLength
                            ];
                        }

                    }

                }
                
            }
        }

        return ['conflicts' => $conflicts];

    }
}
