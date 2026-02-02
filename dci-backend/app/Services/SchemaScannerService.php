<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Services\SchemaReaderService;

class SchemaScannerService
{
    protected $reader;

    public function __construct(SchemaReaderService $reader){

        $this->reader = $reader;

    }

    public function scan(){
        
        $masterSchema = $this->reader->readMaster()['master'];
        $clientSchema = $this->reader->readClient()['client'];

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
                    $conflicts[$row]['missing_client_column'][$column] = true;
                }

                foreach($extraColumns as $column){
                    $conflicts[$row]['extra_client_column'][$column] = true;
                }
            }

        }

        // Identifying data type and length conflicts
        foreach($masterTables as $row){

            if(isset($clientSchema[$row])){

                foreach($masterSchema[$row]["columns"] as $columnName => $columnData){

                    if(isset($clientSchema[$row]["columns"][$columnName])){

                        $masterColumn = $columnData;
                        $clientColumn = $clientSchema[$row]["columns"][$columnName];

                        if($masterColumn['data_type'] != $clientColumn['data_type']){
                            $conflicts[$row][$columnName]['type_mismatch'] = [
                                'master' => $masterColumn['data_type'],
                                'client' => $clientColumn['data_type']
                            ];
                        }

                        if($masterColumn['maximum_characters'] != $clientColumn['maximum_characters']){
                            $conflicts[$row][$columnName]['length_mismatch'] = [
                                'master' => $masterColumn['maximum_characters'],
                                'client' => $clientColumn['maximum_characters']
                            ];
                        }

                    }

                }
                
            }
        }

        return ['conflicts' => $conflicts];

    }
}
