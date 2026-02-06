<?php

namespace App\database\Schema\Builders;

class SqlServerSchemaBuilder implements SchemaSQLBuilderInterface
{
    protected function normalizeType(array $columnDef): string
    {
        $type = strtolower($columnDef['data_type']);

        $type = match ($type) {
            'varchar' => 'NVARCHAR',
            'char' => 'NCHAR',

            'text',
            'tinytext',
            'mediumtext',
            'longtext' => 'NVARCHAR(MAX)',

            'timestamp' => 'DATETIME2',

            default => strtoupper($columnDef['data_type']),
        };

        // Only append length for NVARCHAR(n) or NCHAR(n), skip NVARCHAR(MAX)
        if (in_array($type, ['NVARCHAR','NCHAR']) && !str_contains($type,'MAX')) {
            if (!empty($columnDef['maximum_characters'])) {
                $type .= "({$columnDef['maximum_characters']})";
            }
        }

        return $type;
    }

    public function createMissingTables(string $table, array $tableDef): string
    {
        $columnsSQL = [];

        foreach($tableDef['columns'] as $columnName => $column){
            $type = $this->normalizeType($column);
            $nullable = $column['nullable'] ? "NULL" : "NOT NULL";

            $columnsSQL[] = "{$columnName} {$type} {$nullable}";
        }

        $columns = implode(", ", $columnsSQL);

        return "CREATE TABLE {$table} ({$columns})";
    }

    public function addMissingColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->normalizeType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$table} ADD {$column} {$type} {$nullable}";
    }

    public function modifyMismatchedColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->normalizeType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$table} ALTER COLUMN {$column} {$type} {$nullable}";
    }
}
