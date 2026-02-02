<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class SchemaReaderService
{
    public function read(){
        $dbName = DB::connection('master')->getDatabaseName();

        $master = DB::connection('master')->select("
            SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH 
            FROM information_schema.tables AS T 
            INNER JOIN 
            information_schema.columns AS C 
            ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
            WHERE T.TABLE_SCHEMA = ?
            ORDER BY T.TABLE_NAME
        ", [$dbName]);

        $dbClientName = DB::connection('client1')->getDatabaseName();

        $client1 = DB::connection('client1')->select("
            SELECT T.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.CHARACTER_MAXIMUM_LENGTH 
            FROM information_schema.tables AS T 
            INNER JOIN
            information_schema.columns AS C 
            ON T.TABLE_SCHEMA = C.TABLE_SCHEMA AND T.TABLE_NAME = C.TABLE_NAME 
            WHERE T.TABLE_SCHEMA = ?
            ORDER BY T.TABLE_NAME
        ", [$dbClientName]);

        return [
            'master' => $master,
            'client1' => $client1
        ];
    }

    public function scan(){
        
    }
}
