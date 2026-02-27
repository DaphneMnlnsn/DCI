<?php

namespace App\Services;

use App\database\Schema\SchemaSQLBuilderFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;

use function PHPUnit\Framework\isArray;

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

    public function fix(array $conflicts, array $masterSchema, array $clientSchema, string $targetDb, array $sourceConfig, $targetConfig, string $mode = 'all', ?string $table = null, ?string $column = null)
    {

        $sql = [];

        $masterDriver = $sourceConfig['driver'];
        $clientDriver = $targetConfig['driver'];

        $conn = $this->getConnection($targetDb, $targetConfig);

        if ($mode === 'table' && $table){
            $conflicts = $this->filterByTable($conflicts, $table);
        }

        if ($mode === 'column' && $table && $column){
            $conflicts = $this->filterByColumn($conflicts, $table, $column);
        }

        $sql = array_merge(
            $sql,
            $this->fixMissingTables($conflicts, $masterSchema, $masterDriver, $clientDriver),
            $this->fixMissingColumns($conflicts, $masterSchema, $masterDriver, $clientDriver),
            $this->fixMismatchedColumns($conflicts, $masterSchema, $clientSchema, $targetDb),
            $this->fixExtraTables($conflicts, $masterSchema),
            $this->fixExtraColumns($conflicts, $masterSchema),
        );

        $executed = 0;
        $finalStatements = [];

        foreach ($sql as $statement) {
            if (str_starts_with(trim($statement), '-- WARNING')) {
                $finalStatements[] = $statement;
                continue;
            }
            
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
                    $finalStatements[] = "-- WARNING: cannot execute statement: {$statement}, {$e->getMessage()}.";
                }
            }
        }

        return [
            'statements' => $finalStatements,
            'executed' => $executed
        ];
        
    }

    protected function filterByTable(array $conflicts, string $table){
        foreach($conflicts as $type => $tables){
            if(is_array($tables)){
                $conflicts[$type] = array_key_exists($table, $tables)
                    ? [$table => $tables[$table]]
                    : [];
            }
        }

        return $conflicts;
    }

    protected function filterByColumn(array $conflicts, string $table, string $column){
        $filtered = [];

        $columnTypes = [
            'missing_client_column',
            'extra_client_column',
            'type_mismatch',
            'length_mismatch'
        ];

        foreach ($columnTypes as $type) {
            if (!isset($conflicts[$type][$table][$column])) {
                $filtered[$type] = [];
                continue;
            }

            $filtered[$type] = [
                $table => [
                    $column => $conflicts[$type][$table][$column]
                ]
            ];
        }

        $filtered['missing_client_table'] = [];
        $filtered['extra_client_table'] = [];

        return $filtered;
    }

    protected function fixMissingTables(array $conflicts, array $masterSchema, $masterDriver, $clientDriver):array{

        $sql = [];

        if(empty($conflicts['missing_client_table'])){
            return $sql;
        }

        foreach($conflicts['missing_client_table'] as $table => $_){
            $tableDef = $masterSchema[$table];

            foreach ($tableDef['columns'] as $columnName => $columnDef) {
                $tableDef['columns'][$columnName] = $this->mapColumnDefinition(
                    $columnDef,
                    $masterDriver,
                    $clientDriver
                );
            }
            
            $sql[] = $this->builder->createMissingTables($table, $tableDef);
        }

        return $sql;

    }

    protected function fixExtraTables(array $conflicts, array $masterSchema):array{

        $sql = [];

        if(empty($conflicts['extra_client_table'])){
            return $sql;
        }

        foreach($conflicts['extra_client_table'] as $table => $_){
            $sql[] = "-- WARNING: extra table '$table' was not deleted to prevent data loss.";
        }

        return $sql;

    }

    protected function fixMissingColumns(array $conflicts, array $masterSchema, $masterDriver, $clientDriver):array{

        $sql = [];

        if(empty($conflicts['missing_client_column'])){
            return $sql;
        }

        foreach($conflicts['missing_client_column'] as $table => $columns){
            foreach($columns as $column => $_){
                $columnDef = $masterSchema[$table]['columns'][$column];
                $mappedDef = $this->mapColumnDefinition(
                    $columnDef,
                    $masterDriver,
                    $clientDriver
                );

                $sql[] = $this->builder->addMissingColumns($table, $column, $mappedDef);
            }
        }

        return $sql;
        
    }

    protected function fixExtraColumns(array $conflicts, array $masterSchema):array{

        $sql = [];

        if(empty($conflicts['extra_client_column'])){
            return $sql;
        }

        foreach($conflicts['extra_client_column'] as $table => $columns){
            foreach($columns as $column => $_){
                if (!isset($masterSchema[$table]['columns'][$column])) {
                    $sql[] = "-- WARNING: extra column '$column' in table '$table' was not deleted to prevent data loss.";
                    continue;
                }
                
                $columnDef = $masterSchema[$table]['columns'][$column];
                $sql[] = "-- WARNING: extra columns was not deleted to prevent data loss.";
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

                $sql[] = "-- WARNING: mismatched column '$column' in table '$table' was not modified to prevent data loss.";
                continue;
            }

        }

        return $sql;
        
    }

    protected function mapColumnDefinition(array $columnDef, string $masterDriver, string $clientDriver): array
    {
        $columnDef['data_type'] = CrossDbTypeMapper::map(
            $columnDef['data_type'],
            $masterDriver,
            $clientDriver,
            $columnDef['maximum_characters'] ?? null
        );

        return $columnDef;
    }
}
