<?php

namespace App\database\Schema\Builders;

class SqlServerSchemaBuilder implements SchemaSQLBuilderInterface
{
    protected function normalizeType(array $columnDef): string
    {
        $type = strtoupper($columnDef['data_type']);  // Preserve original casing

        $type = match (strtolower($type)) {
            // 'varchar' => 'NVARCHAR',
            // 'char' => 'NCHAR',
            'text', 'tinytext', 'mediumtext', 'longtext' => 'NVARCHAR(MAX)',
            'timestamp' => 'DATETIME2',
            default => $type,
        };

        if (in_array($type, ['NVARCHAR','NCHAR']) && !str_contains($type,'MAX')) {
            if (!empty($columnDef['maximum_characters'])) {
                $type .= "({$columnDef['maximum_characters']})";
            }
        } elseif (in_array($type, ['VARCHAR', 'CHAR']) && !empty($columnDef['maximum_characters'])) {
            $type .= "({$columnDef['maximum_characters']})";
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

        $sql = "ALTER TABLE {$table} ADD {$column} {$type}";

        // Same with postgres, adding column would not work if there's no default
        if (!$columnDef['nullable'] && !isset($columnDef['default'])) {
            $tempDefault = match (strtolower($columnDef['data_type'])) {
                'varchar', 'nvarchar', 'char', 'nchar', 'text', 'tinytext', 'mediumtext', 'longtext' => "''",
                'bigint', 'integer', 'smallint', 'mediumint' => '0',
                'boolean', 'bit' => '0', 
                'numeric', 'decimal', 'float', 'real' => '0.0',
                'timestamp', 'datetime', 'datetime2' => 'GETDATE()',
                'date' => 'GETDATE()',
                default => "''",
            };
            $sql .= " DEFAULT {$tempDefault}";
        }

        $sql .= " {$nullable};";

        if (!$columnDef['nullable'] && !isset($columnDef['default'])) {
            $sql .= " DECLARE @constraint_name NVARCHAR(128); SELECT @constraint_name = name FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('{$table}') AND col_name(parent_object_id, parent_column_id) = '{$column}'; IF @constraint_name IS NOT NULL EXEC('ALTER TABLE {$table} DROP CONSTRAINT ' + @constraint_name);";
        }

        return $sql;
    }

    public function modifyMismatchedColumns(string $table, string $column, array $columnDef): string
    {
        $type = $this->normalizeType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$table} ALTER COLUMN {$column} {$type} {$nullable}";
    }
}