<?php

namespace App\Services;

use App\Models\IgnoredConflict;
use Illuminate\Support\Facades\DB;
use App\Services\SchemaReaderService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class SchemaScannerService
{
    protected $reader;

    public function __construct(SchemaReaderService $reader){

        $this->reader = $reader;

    }

    public function scan(string $sourceDb, string $targetDb, array $sourceConfig, $targetConfig, $masterConfigId, $clientConfigId)
    {

        $masterData = $this->reader->readSchemaByDatabase($sourceDb, $sourceConfig);
        $clientData = $this->reader->readSchemaByDatabase($targetDb, $targetConfig);

        $masterSchema = $masterData['schema'];
        $clientSchema = $clientData['schema'];

        $masterDriver = $sourceConfig['driver'];
        $clientDriver = $targetConfig['driver'];

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
                            $masterType = $masterColumn['data_type'];
                            $clientType = $clientColumn['data_type'];
                            if (!$this->dbTypesMapping($masterType, $clientType, $masterDriver, $clientDriver)) {
                                $conflicts['type_mismatch'][$row][$col] = [
                                    'master' => $masterType,
                                    'client' => $clientType
                                ];
                            }
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

                        $masterMaxLength = $masterColumn['maximum_characters'] ?? null;
                        $clientMaxLength = $clientColumn['maximum_characters'] ?? null;

                        $masterType = $masterColumn['data_type'];
                        $clientType = $clientColumn['data_type'];

                        if (isset($conflicts['type_mismatch'][$row][$col])) {
                            continue;
                        }

                        if(!$this->dbLengthMapping($masterMaxLength, $clientMaxLength, $masterType, $clientType)){
                            $conflicts['length_mismatch'][$row][$col] = [
                                'master' => $masterMaxLength,
                                'client' => $clientMaxLength
                            ];
                        }

                    }

                }
                
            }
        }

        $ignored = IgnoredConflict::where('client_config_id', $clientConfigId)
            ->where('master_config_id', $masterConfigId)
            ->where('master_database_name', $sourceDb)
            ->where('client_database_name', $targetDb)
            ->get();

        foreach ($ignored as $ignore) {

            $type = $ignore->conflict_type;
            $table = $ignore->table_name;
            $column = $ignore->column_name;

            if (!isset($conflicts[$type])) {
                continue;
            }

            if (is_null($column)) {
                unset($conflicts[$type][$table]);
                continue;
            }

            if (isset($conflicts[$type][$table][$column])) {
                unset($conflicts[$type][$table][$column]);

                if (empty($conflicts[$type][$table])) {
                    unset($conflicts[$type][$table]);
                }
            }
        }

        foreach ($conflicts as $type => $tables) {
            if (empty($tables)) {
                unset($conflicts[$type]);
            }
        }

        return ['conflicts' => $conflicts];

    }

    public function dbTypesMapping(string $masterType, string $clientType, string $masterDb, string $clientDb): bool
    {
        // For normalizing data types across different drivers
        $normalize = function ($type) {
            $type = strtolower($type);
            $type = preg_replace('/\([^\)]*\)/', '', $type);
            return trim($type);
        };

        $mappedMasterType = CrossDbTypeMapper::map(
            $masterType,
            $masterDb,
            $clientDb
        );

        $mappedMasterType = $normalize($mappedMasterType);
        $clientNormalized = $normalize($clientType);

        return $mappedMasterType === $clientNormalized;
    }

    function dbLengthMapping($masterLength, $clientLength, $masterType, $clientType): bool
    {
        $unbounded = [
            'text','longtext','json','jsonb',
            'character varying','varchar',
            'nvarchar','ntext','uuid'
        ];

        $normalize = fn($type) => strtolower(preg_replace('/\([^\)]*\)/','',$type));
        $masterType = $normalize($masterType);
        $clientType = $normalize($clientType);

        if(in_array($masterType, $unbounded)) return true;

        if(is_numeric($masterLength) && is_numeric($clientLength)){
            return $masterLength == $clientLength;
        }

        return $masterLength == $clientLength;
    }
}
