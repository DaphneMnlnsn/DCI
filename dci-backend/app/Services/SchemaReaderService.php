<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class SchemaReaderService
{
    public function readSchema(string $connectionName){

        $schema = [];

        $conn = DB::connection($connectionName);
        $driver = $conn->getDriverName();
        $dbName = $conn->getDatabaseName();

        if($driver == 'mysql'){

            $query = "
                SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH , C.IS_NULLABLE
                FROM information_schema.tables AS T 
                INNER JOIN
                information_schema.columns AS C 
                ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
                WHERE T.TABLE_SCHEMA = ?
                ORDER BY T.TABLE_NAME
            ";

        } elseif($driver == 'sqlsrv'){

            $query = "
                SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH, C.IS_NULLABLE
                FROM information_schema.tables AS T 
                INNER JOIN
                information_schema.columns AS C 
                ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
                WHERE T.TABLE_CATALOG = ?
                ORDER BY T.TABLE_NAME
            ";

        }

        $schemaResult = $conn->select($query, [$dbName]);

        // For properly structuring JSON response
        foreach($schemaResult as $row){
            $tableName = $row->TABLE_NAME;
            $columnName = $row->COLUMN_NAME;
            $dataType = $row->DATA_TYPE;
            $maximumChar = $row->CHARACTER_MAXIMUM_LENGTH;

            if(!isset($schema[$tableName])){
                $schema[$tableName] = ["columns" => []];
            }

            $schema[$tableName]["columns"][$columnName] = [
                "data_type" => $dataType,
                "maximum_characters" => $maximumChar,
                "nullable" => $row->IS_NULLABLE
            ];
        }
        
        return [
            'database' => $dbName,
            'schema' => $schema
        ];
    }

    public function readSchemaByDatabase(string $dbName)
    {
        $schema = [];

        $connName = config('database.default');
        $conn = DB::connection($connName);

        $conn->statement("USE `$dbName`");

        $driver = $conn->getDriverName();

        if ($driver === 'mysql') {
            $query = "
                SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE,
                    C.CHARACTER_MAXIMUM_LENGTH, C.IS_NULLABLE
                FROM information_schema.tables AS T
                INNER JOIN information_schema.columns AS C
                ON T.TABLE_SCHEMA = C.TABLE_SCHEMA
                AND T.TABLE_NAME = C.TABLE_NAME
                WHERE T.TABLE_SCHEMA = ?
                ORDER BY T.TABLE_NAME
            ";

            $schemaResult = $conn->select($query, [$dbName]);
        }

        foreach ($schemaResult as $row) {
            if (!isset($schema[$row->TABLE_NAME])) {
                $schema[$row->TABLE_NAME] = ['columns' => []];
            }

            $schema[$row->TABLE_NAME]['columns'][$row->COLUMN_NAME] = [
                'data_type' => $row->DATA_TYPE,
                'maximum_characters' => $row->CHARACTER_MAXIMUM_LENGTH,
                'nullable' => $row->IS_NULLABLE,
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

        if($connDetails['driver'] == 'mysql'){

            $result = DB::select("SHOW DATABASES");
            
            foreach($result as $row){
                $databases[] = $row->Database;
            }

        } else if($connDetails['driver'] == 'sqlsrv'){

            $result = DB::select("SELECT name FROM sys.databases");

            foreach($result as $row){
                $databases[] = $row->name;
            }
        }

        return [
            'databases' => $databases,
        ];
        
    }
}