<?php

namespace App\database\Schema\Builders;

class MySqlSchemaBuilder implements SchemaSQLBuilderInterface
{
    protected function formatType(array $columnDef): string
    {
        $type = strtoupper($columnDef['data_type']);

        $skipLength = ['TEXT','TINYTEXT','MEDIUMTEXT','LONGTEXT','BLOB','MEDIUMBLOB','LONGBLOB','TINYBLOB'];

        if (!in_array($type, $skipLength)) {
            $lengthAllowed = in_array($type, ['VARCHAR','CHAR','VARBINARY','BINARY']);
            if ($lengthAllowed && !empty($columnDef['maximum_characters'])) {
                $type .= "({$columnDef['maximum_characters']})";
            }
        }

        return $type;
    }

    public function createMissingTables(string $table, array $tableDef): string
    {
        $columnsSQL = [];

        foreach($tableDef['columns'] as $columnName => $column){
            $type = $this->formatType($column);
            $nullable = $column['nullable'] ? "NULL" : "NOT NULL";

            $columnsSQL[] = "{$columnName} {$type} {$nullable}";
        }

        $columns = implode(", ", $columnsSQL);

        return "CREATE TABLE {$table} ({$columns})";
    }

    public function addMissingColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->formatType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$table} ADD {$column} {$type} {$nullable}";
    }

    public function modifyMismatchedColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->formatType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$table} MODIFY {$column} {$type} {$nullable}";
    }
}