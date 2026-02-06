<?php

namespace App\database\Schema\Builders;

interface SchemaSQLBuilderInterface
{
    public function createMissingTables(string $table, array $tableDef):string;
    public function addMissingColumns(string $table, string $column, array $columnDef):string;
    public function modifyMismatchedColumns(string $table, string $column, array $columnDef):string;
}