<?php

namespace App\database\Schema;

use Illuminate\Support\Facades\DB;
use App\database\Schema\Builders\MySqlSchemaBuilder;
use App\database\Schema\Builders\PostgresSchemaBuilder;
use App\database\Schema\Builders\SqlServerSchemaBuilder;

class SchemaSQLBuilderFactory
{
    public static function make(string $driver){
        
        if($driver == 'mysql'){
            return new MySqlSchemaBuilder();
        } else if($driver == 'sqlsrv'){
            return new SqlServerSchemaBuilder();
        } else if($driver == 'pgsql'){
            return new PostgresSchemaBuilder();
        } else{
            throw new \Exception("Unsupported database driver: $driver");
        }
    }
}
