<?php

namespace App\Services;

use App\database\Schema\SchemaSQLBuilderFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SchemaFixerService
{
    protected $builder;

    public function __construct(){
        $this->builder = SchemaSQLBuilderFactory::make();
    }
    public function fix(array $conflicts, array $masterSchema, array $clientSchema){

        $sql = [];

        $sql = array_merge(
            $sql,
            $this->fixMissingTables($conflicts, $masterSchema),
            $this->fixMissingColumns($conflicts, $masterSchema),
            $this->fixMismatchedColumns($conflicts, $masterSchema, $clientSchema)
        );

        try {
            foreach ($sql as $statement) {
                DB::connection('client')->statement($statement);
            }
        } catch (\Throwable $e) {
            return [
                'error' => $e->getMessage(),
                'statements' => $sql
            ];
        }

        return [
            "statements" => $sql,
            "executed" => count($sql)
        ];

    }

    protected function fixMissingTables(array $conflicts, array $masterSchema):array{

        $sql = [];

        if(empty($conflicts['missing_client_table'])){
            return $sql;
        }

        foreach($conflicts['missing_client_table'] as $table => $_){
            $tableDef = $masterSchema[$table];
            $sql[] = $this->builder->createMissingTables($table, $tableDef);
        }

        return $sql;

    }

    protected function fixMissingColumns(array $conflicts, array $masterSchema):array{

        $sql = [];

        if(empty($conflicts['missing_client_column'])){
            return $sql;
        }

        foreach($conflicts['missing_client_column'] as $table => $columns){
            foreach($columns as $column => $_){
                $columnDef = $masterSchema[$table]['columns'][$column];
                $sql[] = $this->builder->addMissingColumns($table, $column, $columnDef);
            }
        }

        return $sql;
        
    }

    protected function fixMismatchedColumns(array $conflicts, array $masterSchema, array $clientSchema):array{

        $sql = [];

        $tables = array_unique(array_merge(
            array_keys($conflicts['type_mismatch'] ?? []),
            array_keys($conflicts['length_mismatch'] ?? [])
        ));

        foreach ($tables as $table) {
            $columns = array_unique(array_merge(
                array_keys($conflicts['type_mismatch'][$table] ?? []),
                array_keys($conflicts['length_mismatch'][$table] ?? [])
            ));

            foreach ($columns as $column) {
                $masterColumnDef = $masterSchema[$table]['columns'][$column];
                $clientColumnDef = $clientSchema[$table]['columns'][$column];

                $skip = false;

                $numericTypes = ['INT','BIGINT','DECIMAL','FLOAT','DOUBLE'];
                $clientType = strtoupper($clientColumnDef['data_type']);
                $masterType = strtoupper($masterColumnDef['data_type']);

                if (in_array($masterType, $numericTypes) &&
                    str_contains($clientType, 'CHAR')) {

                    $count = DB::connection('client')->table($table)
                        ->whereNotNull($column)
                        ->whereRaw("{$column} REGEXP '[^0-9]'")
                        ->count();

                    if ($count > 0) {
                        $sql[] = "-- WARNING: cannot alter {$table}.{$column} to {$masterType}, incompatible data exists";
                        $skip = true;
                    }
                }

                if (!$skip) {
                    $sql[] = $this->builder->modifyMismatchedColumns($table, $column, $masterColumnDef);
                }
            }

        }

        return $sql;
        
    }
}
