<?php

namespace App\database\Schema\Builders;

class MySqlSchemaBuilder implements SchemaSQLBuilderInterface
{

    protected function quoteIdentifier(string $name): string
    {
        return "`" . str_replace("`", "``", $name) . "`";
    }

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
        $quotedTable = $this->quoteIdentifier($table);
        $columnsSQL = [];

        foreach($tableDef['columns'] as $columnName => $column){
            $quotedColumnName = $this->quoteIdentifier($columnName);
            $type = $this->formatType($column);
            $nullable = $column['nullable'] ? "NULL" : "NOT NULL";

            $columnsSQL[] = "{$quotedColumnName} {$type} {$nullable}";
        }

        $columns = implode(", ", $columnsSQL);

        return "CREATE TABLE {$quotedTable} ({$columns})";
    }

    public function addMissingColumns(string $table, string $column, array $columnDef): string
    {
        $quotedTable = $this->quoteIdentifier($table);
        $quotedColumn = $this->quoteIdentifier($column);
        $type = $this->formatType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$quotedTable} ADD {$quotedColumn} {$type} {$nullable}";
    }

    public function modifyMismatchedColumns(string $table, string $column, array $columnDef): string
    {
        $quotedTable = $this->quoteIdentifier($table);
        $quotedColumn = $this->quoteIdentifier($column);
        $type = $this->formatType($columnDef);
        $nullable = $columnDef['nullable'] ? "NULL" : "NOT NULL";

        return "ALTER TABLE {$quotedTable} MODIFY {$quotedColumn} {$type} {$nullable}";
    }
}