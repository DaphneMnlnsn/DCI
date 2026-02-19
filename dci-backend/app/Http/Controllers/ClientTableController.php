<?php

namespace App\Http\Controllers;

use App\Services\SchemaFixerService;
use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Services\ActivityLogService;

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
            return json_decode(Crypt::decryptString($configJson), true);
        }
        else{
            return $defaultConfig;
        }
    }

    public function getTables(Request $request, SchemaScannerService $scanner, SchemaReaderService $reader){

        $source = $request->query('source');
        $target = $request->query('target');

        if (!$source || !$target) {
            return response()->json(['error' => 'Databases not specified'], 400);
        }

        $config = $this->getUserDbConfig();
        $config['database'] = $target;

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

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

        Config::set("database.connections.$dynamicConnName", $config);
        DB::purge($dynamicConnName);
        DB::reconnect($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $driver = $conn->getDriverName();

        foreach ($tables as $tableName => &$tableData) {

            $preview = $reader->previewTable($target, $tableName, $config);

            switch ($driver) {
                case 'mysql':
                    $columns = $conn->select("
                        SELECT COLUMN_NAME
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ?
                        ORDER BY ORDINAL_POSITION
                    ", [$tableName]);
                    break;

                case 'pgsql':
                    $columns = $conn->select("
                        SELECT column_name AS COLUMN_NAME
                        FROM information_schema.columns
                        WHERE table_catalog = current_database()
                        AND table_schema = 'public'
                        AND table_name = ?
                        ORDER BY ordinal_position
                    ", [$tableName]);
                    break;

                case 'sqlsrv':
                    $columns = $conn->select("
                        SELECT COLUMN_NAME
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_CATALOG = DB_NAME()
                        AND TABLE_NAME = ?
                        ORDER BY ORDINAL_POSITION
                    ", [$tableName]);
                    break;

                default:
                    throw new \Exception("Unsupported driver: $driver");
            }

            $columnNames = array_map(fn($col) => $col->COLUMN_NAME, $columns);
            $columnStructure = array_fill_keys($columnNames, null);
            
            if (empty($preview)) {
                $preview = [(object)$columnStructure];
            } else {
                $preview[] = (object)$columnStructure;
            }
            
            $tableData['preview'] = $preview;

        }

        if(!empty($tables)) {
            return response()->json([
                'status' => 'warning',
                'conflicted_tables' => $tables,
            ]);
        }

    }

    private function quoteIdentifier($name, $driver)
    {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) {
            throw new \Exception("Invalid identifier: $name");
        }

        switch ($driver) {
            case 'mysql':
                return "`$name`";
            case 'sqlsrv':
                return "[$name]";
            case 'pgsql':
                return "\"$name\"";
            default:
                throw new \Exception("Unsupported driver: $driver");
        }
    }

    private function getDefaultForColumn(string $type, string $driver)
    {
        $type = strtolower($type);
        return match(true) {
            in_array($type, ['int','integer','bigint','smallint','tinyint','decimal','numeric','float','double','real']) => 0,
            in_array($type, ['varchar','text','char','string']) => "''",
            in_array($type, ['date']) => $driver === 'pgsql' ? "'1970-01-01'" : "'0001-01-01'",
            in_array($type, ['datetime','timestamp']) => $driver === 'pgsql' ? "'1970-01-01 00:00:00'" : "'0001-01-01 00:00:00'",
            in_array($type, ['boolean','bool']) => 0,
            default => "''",
        };
    }

    public function deleteAllData(Request $request, SchemaFixerService $fixer, SchemaReaderService $reader, SchemaScannerService $scanner){

        $config = $this->getUserDbConfig();

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

        $source = $request->query('source');
        $target = $request->query('target');
        $tableName = $request->query('table');

        if (!$source || !$target || !$tableName) {
            return response()->json(['error' => 'Missing parameters'], 400);
        }
        
        $sourceConfig = array_merge($config, ['database' => $source]);
        $targetConfig = array_merge($config, ['database' => $target]);

        Config::set("database.connections.$dynamicConnName", $targetConfig);
        DB::purge($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $driver = $conn->getDriverName();

        $masterSchemaData = $reader->readSchemaByDatabase($source, $sourceConfig);
        $clientSchemaData = $reader->readSchemaByDatabase($target, $targetConfig);

        $masterSchema = $masterSchemaData['schema'];
        $clientSchema = $clientSchemaData['schema'];

        $scanResult = $scanner->scan($source, $target, $config);
        $conflicts = $scanResult['conflicts'] ?? [];

        $executed = 0;

        foreach($conflicts as $type => $items){

            if(!isset($items[$tableName])){
                continue;
            }

            if($type == 'extra_client_table'){

                $quotedTable = $this->quoteIdentifier($tableName, $driver);

                if ($driver === 'pgsql') {
                    $sql = "DROP TABLE $quotedTable CASCADE";
                } else {
                    $sql = "DROP TABLE $quotedTable";
                }
                $conn->statement($sql);
                $executed++;

            }
            
            if(in_array($type, ['extra_client_column', 'type_mismatch', 'length_mismatch'])){

                $quotedTable = $this->quoteIdentifier($tableName, $driver);
                foreach($items[$tableName] as $column => $value){
                    if (Schema::connection($dynamicConnName)
                            ->hasColumn($tableName, $column)) {

                        $quotedTable = $this->quoteIdentifier($tableName, $driver);
                        $quotedColumn = $this->quoteIdentifier($column, $driver);

                        $sql = "ALTER TABLE $quotedTable DROP COLUMN $quotedColumn";
                        $conn->statement($sql);
                    }
                    $executed++;
                }
            }
        }
        
        $newScanResult = $scanner->scan($source, $target, $config);
        $newConflicts = $newScanResult['conflicts'] ?? [];

        $conflictTypes = ['missing_client_table', 'extra_client_table', 'missing_client_column', 'extra_client_column', 'type_mismatch', 'length_mismatch'];

        $tableConflicts = [];

        foreach ($conflictTypes as $type) {
            $tableConflicts[$type] = [];
        }

        foreach ($conflictTypes as $type) {
            if (!empty($newConflicts[$type][$tableName])) {
                $tableConflicts[$type][$tableName] = $newConflicts[$type][$tableName];
            }
        }

        $clientSchema = $reader->readSchemaByDatabase($target, $targetConfig);
        $fixer->fix($tableConflicts, $masterSchema, $clientSchema, $target, $targetConfig);

        $updatedTable = [
            'issues' => [],
            'preview' => []
        ];

        $conflictTypes = ['extra_client_table', 'extra_client_column', 'type_mismatch', 'length_mismatch'];

        foreach ($conflictTypes as $type) {
            if (!empty($newConflicts[$type][$tableName])) {
                if ($type === 'extra_client_table') {
                    $updatedTable['issues'][] = ['type' => $type];
                } else {
                    foreach ($newConflicts[$type][$tableName] as $column => $details) {
                        $issue = ['type' => $type, 'column' => $column];
                        if (isset($details['master'])) $issue['master'] = $details['master'];
                        if (isset($details['client'])) $issue['client'] = $details['client'];
                        $updatedTable['issues'][] = $issue;
                    }
                }
            }
        }

        if (Schema::connection($dynamicConnName)->hasTable($tableName)) {
            $updatedTable['preview'] = $reader->previewTable($target, $tableName, $config);
        }

        $user = Auth::user();
        ActivityLogService::log(
            'DELETE USER', 
            "User {$user->username} deleted all data",
        );

        return response()->json([
            'status' => 'success',
            'table' => $tableName,
            'issues' => $updatedTable['issues'],
            'preview' => $updatedTable['preview'],
            'message' => count($updatedTable['issues']) === 0
                ? "No remaining conflicts."
                : "Some conflicts still remain."
        ]);

    }

    public function deleteIncompatibleData(Request $request, SchemaScannerService $scanner, SchemaReaderService $reader, SchemaFixerService $fixer){
    
        $config = $this->getUserDbConfig();

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

        $source = $request->query('source');
        $target = $request->query('target');
        $tableName = $request->query('table');

        if (!$source || !$target || !$tableName) {
            return response()->json(['error' => 'Missing parameters'], 400);
        }
        
        $sourceConfig = array_merge($config, ['database' => $source]);
        $targetConfig = array_merge($config, ['database' => $target]);

        Config::set("database.connections.$dynamicConnName", $targetConfig);
        DB::purge($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $driver = $conn->getDriverName();

        $masterSchemaData = $reader->readSchemaByDatabase($source, $sourceConfig);
        $clientSchemaData = $reader->readSchemaByDatabase($target, $targetConfig);

        $masterSchema = $masterSchemaData['schema'];
        $clientSchema = $clientSchemaData['schema'];

        $scanResult = $scanner->scan($source, $target, $config);
        $conflicts = $scanResult['conflicts'] ?? [];

        $executed = 0;

        foreach($conflicts as $type => $items){

            if(!isset($items[$tableName])){
                    continue;
            }

            if($type == 'extra_client_table'){

                $quotedTable = $this->quoteIdentifier($tableName, $driver);

                if ($driver === 'pgsql') {
                    $sql = "DROP TABLE $quotedTable CASCADE";
                } else {
                    $sql = "DROP TABLE $quotedTable";
                }
                $affected = $conn->update($sql);
                Log::info("Executed: $sql, Affected: $affected");
                $executed += $affected;

            }
            
            if($type == 'extra_client_column'){
                $quotedTable = $this->quoteIdentifier($tableName, $driver);
                foreach($items[$tableName] as $column => $value){
                    if (Schema::connection($dynamicConnName)
                            ->hasColumn($tableName, $column)) {

                        $quotedTable = $this->quoteIdentifier($tableName, $driver);
                        $quotedColumn = $this->quoteIdentifier($column, $driver);

                        $sql = "ALTER TABLE $quotedTable DROP COLUMN $quotedColumn";
                        $affected = $conn->update($sql);
                        Log::info("Executed: $sql, Affected: $affected");
                        $executed += $affected;
                    }
                }
            }

            if (in_array($type, ['type_mismatch', 'length_mismatch'])) {
                foreach ($items[$tableName] as $column => $conflict) {

                    $quotedTable = $this->quoteIdentifier($tableName, $driver);
                    $quotedColumn = $this->quoteIdentifier($column, $driver);

                    $masterColumnMeta = $masterSchema[$tableName]['columns'][$column] ?? null;
                    $clientColumnMeta = $clientSchema[$tableName]['columns'][$column] ?? null;
                    if (!$masterColumnMeta || !$clientColumnMeta) continue;

                    $nullable = $clientColumnMeta['nullable'] ?? true;

                    $default = $this->getDefaultForColumn($masterColumnMeta['data_type'], $driver);

                    $condition = '';

                    if ($type === 'length_mismatch') {
                        $maxLength = $masterColumnMeta['maximum_characters'] ?? 0;
                        if (!$maxLength) continue;

                        if ($driver === 'mysql') {
                            $condition = "CHAR_LENGTH($quotedColumn) > $maxLength";
                        } elseif ($driver === 'sqlsrv') {
                            $condition = "LEN($quotedColumn) > $maxLength";
                        } elseif ($driver === 'pgsql') {
                            $condition = "LENGTH($quotedColumn) > $maxLength";
                        }
                    }

                    if ($type === 'type_mismatch') {
                        $targetType = strtolower($masterColumnMeta['data_type']);

                        if (in_array($targetType, ['int', 'integer', 'bigint', 'smallint', 'tinyint'])) {
                            $condition = $driver === 'mysql' ? "$quotedColumn NOT REGEXP '^-?[0-9]+$'"
                                    : ($driver === 'sqlsrv' ? "TRY_CAST($quotedColumn AS BIGINT) IS NULL"
                                    : "$quotedColumn !~ '^-?[0-9]+$'");
                        }
                        elseif (in_array($targetType, ['decimal', 'numeric', 'float', 'double', 'real'])) {
                            $condition = $driver === 'mysql' ? "$quotedColumn NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'"
                                    : ($driver === 'sqlsrv' ? "TRY_CAST($quotedColumn AS FLOAT) IS NULL"
                                    : "$quotedColumn !~ '^-?[0-9]+(\\.[0-9]+)?$'");
                        }
                        elseif ($targetType === 'date') {
                            $condition = $driver === 'mysql' ? "STR_TO_DATE($quotedColumn, '%Y-%m-%d') IS NULL"
                                    : ($driver === 'sqlsrv' ? "TRY_CAST($quotedColumn AS DATE) IS NULL"
                                    : "TO_DATE($quotedColumn, 'YYYY-MM-DD') IS NULL");
                        }
                        elseif (in_array($targetType, ['datetime', 'timestamp'])) {
                            $condition = $driver === 'mysql' ? "STR_TO_DATE($quotedColumn, '%Y-%m-%d %H:%i:%s') IS NULL"
                                    : ($driver === 'sqlsrv' ? "TRY_CAST($quotedColumn AS DATETIME) IS NULL"
                                    : "TO_TIMESTAMP($quotedColumn, 'YYYY-MM-DD HH24:MI:SS') IS NULL");
                        }
                        elseif (in_array($targetType, ['boolean', 'bool'])) {
                            $condition = $driver === 'mysql' ? "$quotedColumn NOT IN (0,1)"
                                    : ($driver === 'sqlsrv' ? "TRY_CAST($quotedColumn AS BIT) IS NULL"
                                    : "$quotedColumn NOT IN (true,false,0,1)");
                        }
                    }

                    if ($condition) {

                        if ($nullable) {
                            $condition .= " AND $quotedColumn IS NOT NULL";
                        }

                        $sql = "UPDATE $quotedTable SET $quotedColumn = $default WHERE $condition";
                        $affected = $conn->update($sql);
                        Log::info("Executed: $sql, Affected: $affected");
                        $executed += $affected;
                    }
                }
            }
        }

        $newScanResult = $scanner->scan($source, $target, $config);
        $newConflicts = $newScanResult['conflicts'] ?? [];

        $conflictTypes = ['missing_client_table', 'missing_client_column', 'type_mismatch', 'length_mismatch'];

        $tableConflicts = [];

        foreach ($conflictTypes as $type) {
            $tableConflicts[$type] = [];
        }

        foreach ($conflictTypes as $type) {
            if (!empty($newConflicts[$type]) && array_key_exists($tableName, $newConflicts[$type])) {
                $tableConflicts[$type][$tableName] = $newConflicts[$type][$tableName];
            }
        }

        $clientSchema = $reader->readSchemaByDatabase($target, $targetConfig);
        $fixer->fix($tableConflicts, $masterSchema, $clientSchema, $target, $targetConfig);

        $updatedTable = [
            'issues' => [],
            'preview' => []
        ];

        $conflictTypes = ['extra_client_table', 'extra_client_column', 'type_mismatch', 'length_mismatch'];

        foreach ($conflictTypes as $type) {
            if (!empty($newConflicts[$type][$tableName])) {
                if ($type === 'extra_client_table') {
                    $updatedTable['issues'][] = ['type' => $type];
                } else {
                    foreach ($newConflicts[$type][$tableName] as $column => $details) {
                        $issue = ['type' => $type, 'column' => $column];
                        if (isset($details['master'])) $issue['master'] = $details['master'];
                        if (isset($details['client'])) $issue['client'] = $details['client'];
                        $updatedTable['issues'][] = $issue;
                    }
                }
            }
        }

        if (Schema::connection($dynamicConnName)->hasTable($tableName)) {
            $updatedTable['preview'] = $reader->previewTable($target, $tableName, $config);
        }

        $user = Auth::user();
        ActivityLogService::log(
            'DELETE USER', 
            "User {$user->username} deleted all incompatible data",
        );

        return response()->json([
            'status' => 'success',
            'table' => $tableName,
            'issues' => $updatedTable['issues'],
            'preview' => $updatedTable['preview'],
            'message' => count($updatedTable['issues']) === 0
                ? "No remaining conflicts."
                : "Some conflicts still remain."
        ]);

    }
}