<?php

namespace App\Services;

use App\database\Schema\SchemaSQLBuilderFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;

class SchemaFixerService
{
    protected $builder;
    protected $driver;

    public function getConnection(string $dbName, array $config){

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

        Config::set(
            "database.connections.$dynamicConnName",
            array_merge($config, ['database' => $dbName])
        );

        DB::purge($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $this->driver = $conn->getDriverName();

        $this->builder = SchemaSQLBuilderFactory::make($this->driver);

        return $conn;
    }

    public function fix(array $conflicts, array $masterSchema, array $clientSchema, string $targetDb, array $config){

        $sql = [];

        $conn = $this->getConnection($targetDb, $config);

        $sql = array_merge(
            $sql,
            $this->fixMissingTables($conflicts, $masterSchema),
            $this->fixMissingColumns($conflicts, $masterSchema),
            $this->fixMismatchedColumns($conflicts, $masterSchema, $clientSchema, $targetDb)
        );

        $executed = 0;
        $finalStatements = [];

        foreach ($sql as $statement) {
            if ($this->driver === 'pgsql') {
                $subStatements = array_filter(array_map('trim', explode(';', $statement)));
                $primarySucceeded = false;
                
                foreach ($subStatements as $index => $stmt) {
                    if (!empty($stmt)) {
                        try {
                            $conn->statement($stmt);
                            $finalStatements[] = $stmt;
                            
                            if ($index === 0) {
                                $primarySucceeded = true;
                            }
                        } catch (\Throwable $e) {
                            $finalStatements[] = "-- WARNING: cannot execute statement: {$stmt}, incompatible data type conversion.";
                        }
                    }
                }
                
                if ($primarySucceeded) {
                    $executed++;
                }
            } else {
                try {
                    $conn->statement($statement);
                    $finalStatements[] = $statement;
                    $executed++;
                } catch (\Throwable $e) {
                    $finalStatements[] = "-- WARNING: cannot execute statement: {$statement}, incompatible data type conversion.";
                }
            }
        }

        return [
            'statements' => $finalStatements,
            'executed' => $executed
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

    protected function fixMismatchedColumns(array $conflicts, array $masterSchema, array $clientSchema, string $targetDb):array{

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

                $sql[] = $this->builder->modifyMismatchedColumns($table, $column, $masterColumnDef);
            }

        }

        return $sql;
        
    }
}
