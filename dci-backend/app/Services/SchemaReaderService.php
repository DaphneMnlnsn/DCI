<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class SchemaReaderService
{

    public function readSchemaByDatabase(string $dbName)
    {
        $schema = [];

        $baseConn = config('database.default');
        $baseConfig = config("database.connections.$baseConn");

        // Overriding the db
        $dynamicConnName = 'dynamic_schema';

        Config::set(
            "database.connections.$dynamicConnName",
            array_merge($baseConfig, ['database' => $dbName])
        );

        DB::purge($dynamicConnName);
        $conn = DB::connection($dynamicConnName);

        $driver = $conn->getDriverName();

        if($driver == 'mysql'){

            $query = "
                SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH , C.IS_NULLABLE
                FROM information_schema.tables AS T 
                INNER JOIN
                information_schema.columns AS C 
                ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
                WHERE T.TABLE_SCHEMA = ?
                ORDER BY T.TABLE_NAME, C.ORDINAL_POSITION
            ";
            $bindings = [$dbName];

        } else if($driver == 'sqlsrv'){

            $query = "
                SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH, C.IS_NULLABLE
                FROM information_schema.tables AS T 
                INNER JOIN
                information_schema.columns AS C 
                ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
                WHERE T.TABLE_CATALOG = ?
                ORDER BY T.TABLE_NAME, C.ORDINAL_POSITION
            ";
            $bindings = [$dbName];

        } else if($driver == 'pgsql'){
            $query = "
                SELECT t.table_name, c.column_name, c.data_type, c.character_maximum_length, c.is_nullable
                FROM information_schema.tables t
                JOIN information_schema.columns c
                    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
                WHERE t.table_schema = 'public'
                ORDER BY t.table_name, c.ordinal_position
            ";
            $bindings = [];
        } else{
            throw new Exception("Unsupported database driver: $driver");
        }

        $schemaResult = $conn->select($query, $bindings);

        // For properly structuring JSON response
        foreach ($schemaResult as $row) {

            $tableName = property_exists($row, 'table_name')
                ? $row->table_name : $row->TABLE_NAME;

            $columnName = property_exists($row, 'column_name')
                ? $row->column_name : $row->COLUMN_NAME;

            $dataType = property_exists($row, 'data_type')
                ? $row->data_type : $row->DATA_TYPE;

            $maxLength = property_exists($row, 'character_maximum_length')
                ? $row->character_maximum_length : ($row->CHARACTER_MAXIMUM_LENGTH ?? null);

            $isNullable = property_exists($row, 'is_nullable')
                ? $row->is_nullable : ($row->IS_NULLABLE ?? 'YES');

            if (!isset($schema[$tableName])) {
                $schema[$tableName] = ["columns" => []];
            }

            $schema[$tableName]["columns"][$columnName] = [
                "data_type" => strtolower($dataType),
                "maximum_characters" => $maxLength,
                "nullable" => strtoupper($isNullable) === 'YES'
            ];
        }

        return [
            'database' => $dbName,
            'schema' => $schema
        ];
    }

    
    public function readAllDatabases(){
        $conn = config('database.default');
        $connDetails = config("database.connections.$conn");
        
        $databases = [];
        $driver = $connDetails['driver'];

        if($driver == 'mysql'){

            $result = DB::select("SHOW DATABASES");
            
            foreach($result as $row){
                $databases[] = $row->Database;
            }

        } else if($driver == 'sqlsrv'){

            $result = DB::select("SELECT name FROM sys.databases");

            foreach($result as $row){
                $databases[] = $row->name;
            }
        } else if($driver == 'pgsql'){
            $result = DB::select("SELECT datname FROM pg_database WHERE datistemplate = false");
            foreach($result as $row){
                $databases[] = $row->datname;
            }
        } else{
            throw new Exception("Unsupported database driver: $driver");
        }

        return [
            'databases' => $databases,
        ];
        
    }
}