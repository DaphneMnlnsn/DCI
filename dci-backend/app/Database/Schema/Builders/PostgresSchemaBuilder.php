<?php

namespace App\database\Schema\Builders;
use Illuminate\Support\Facades\Log;

class PostgresSchemaBuilder implements SchemaSQLBuilderInterface
{

    protected function normalizeType(array $columnDef): string
    {
        $type = strtolower($columnDef['data_type']);

        $type = match ($type) {
            'varchar', 'nvarchar', 'char', 'nchar', 'character varying', 'character' => 'VARCHAR',
            'text', 'tinytext', 'mediumtext', 'longtext' => 'TEXT',
            'tinyint', 'bit' => 'BOOLEAN',
            'smallint' => 'SMALLINT',
            'mediumint', 'int', 'integer' => 'INTEGER',
            'bigint' => 'BIGINT',
            'datetime', 'timestamp', 'datetime2' => 'TIMESTAMP',
            'date' => 'DATE',
            'decimal', 'numeric' => 'NUMERIC',
            'float', 'double' => 'DOUBLE PRECISION',
            'json', 'longtext json' => 'JSONB',
            'uuid' => 'UUID',
            default => strtoupper($columnDef['data_type']),
        };

        if (in_array($type, ['VARCHAR']) && isset($columnDef['maximum_characters']) && $columnDef['maximum_characters'] > 0) {
            $type .= "({$columnDef['maximum_characters']})";
        }

        if (isset($columnDef['default'])) {
            $default = $columnDef['default'];

            if ($type === 'BOOLEAN') {
                $default = $default ? 'TRUE' : 'FALSE';
            } else {
                $default = is_numeric($default) ? $default : "'" . str_replace("'", "''", $default) . "'";
            }

            $type .= " DEFAULT {$default}";
        }

        return $type;
    }

    public function createMissingTables(string $table, array $tableDef): string
    {
        $columnsSQL = [];

        foreach($tableDef['columns'] as $columnName => $column){
            $type = $this->normalizeType($column);
            $nullable = $column['nullable'] ? "" : "NOT NULL";

            $columnsSQL[] = "{$columnName} {$type} {$nullable}";
        }

        $columns = implode(", ", $columnsSQL);

        return "CREATE TABLE IF NOT EXISTS {$table} ({$columns});";
    }

    public function addMissingColumns(string $table, string $column, array $columnDef): string
    {

        $type = $this->normalizeType($columnDef);
        $nullable = $columnDef['nullable'] ? "" : "NOT NULL";

        $sql = "ALTER TABLE {$table} ADD COLUMN {$column} {$type}";

        // Adding not null doesn't work on adding columns in postgres so adding default here, depending on the type
        if (!$columnDef['nullable'] && !isset($columnDef['default'])) {
            $tempDefault = match (strtolower($columnDef['data_type'])) {
                'varchar', 'nvarchar', 'char', 'nchar', 'text', 'tinytext', 'mediumtext', 'longtext' => "''",
                'bigint', 'integer', 'smallint', 'mediumint' => '0',
                'boolean' => 'FALSE',
                'numeric', 'decimal', 'float', 'double precision' => '0.0',
                'timestamp', 'datetime', 'datetime2' => 'CURRENT_TIMESTAMP',
                'date' => 'CURRENT_DATE',
                'json', 'jsonb', 'longtext json' => "'{}'",
                'uuid' => 'gen_random_uuid()',
                default => "''",
            };
            $sql .= " DEFAULT {$tempDefault}";
        }

        $sql .= " {$nullable};";

        if (!$columnDef['nullable'] && !isset($columnDef['default'])) {
            $sql .= " ALTER TABLE {$table} ALTER COLUMN {$column} DROP DEFAULT;";
        }

        return $sql;
    }

    public function modifyMismatchedColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->normalizeType($columnDef);
        $nullable = $columnDef['nullable'] ? "DROP NOT NULL" : "SET NOT NULL";

        return "ALTER TABLE {$table} ALTER COLUMN {$column} TYPE {$type}; " .
               "ALTER TABLE {$table} ALTER COLUMN {$column} {$nullable};";
    }
}