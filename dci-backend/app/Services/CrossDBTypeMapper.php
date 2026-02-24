<?php

namespace App\Services;

class CrossDbTypeMapper
{
    public static function map(
        string $masterType,
        string $masterDriver,
        string $clientDriver,
        ?int $length = null
    ): string {

        $masterType = self::normalize($masterType);

        if ($masterDriver === $clientDriver) {
            $normalized = self::normalizeSameDriver($masterType, $masterDriver);
            return self::applyLength($normalized, $length, $clientDriver);
        }

        $map = self::mappingTable();

        if (isset($map[$masterDriver][$clientDriver][$masterType])) {
            $mapped = $map[$masterDriver][$clientDriver][$masterType];
        } else {
            $mapped = self::fallback($masterType, $clientDriver);
        }

        return self::applyLength($mapped, $length, $clientDriver);
    }

    private static function normalize(string $type): string
    {
        $type = strtolower($type);
        $type = preg_replace('/\(.+\)/', '', $type);
        return trim($type);
    }

    private static function applyLength(string $type, ?int $length, string $driver): string
    {
        if ($length === null || $length <= 0) {
            return $type;
        }

        $baseType = strtolower($type);

        if (in_array($baseType, ['varchar','nvarchar','character varying'])) {
            return "{$baseType}(" . min($length, 255) . ")";
        }

        return $type;
    }

    private static function fallback(string $type, string $clientDriver): string
    {
        return match ($clientDriver) {
            'mysql'  => 'longtext',
            'pgsql'  => 'text',
            'sqlsrv' => 'nvarchar(max)',
            default  => $type,
        };
    }

    private static function normalizeSameDriver(string $type, string $driver): string
    {
        $type = self::normalize($type);

        return match ($driver) {

            'mysql' => match ($type) {
                'tinytext', 'text', 'mediumtext', 'longtext' => 'longtext',
                'tinyint', 'smallint', 'mediumint', 'int', 'bigint' => $type,
                default => $type,
            },

            'pgsql' => match ($type) {
                'character varying' => 'varchar',
                default => $type,
            },

            'sqlsrv' => match ($type) {
                'nvarchar', 'varchar' => 'nvarchar',
                'ntext', 'text' => 'ntext',
                default => $type,
            },

            default => $type,
        };
    }

    private static function mappingTable(): array
    {
        return [

            // If pgsql is the master
            'pgsql' => [

                'mysql' => [
                    'integer' => 'int',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'boolean' => 'tinyint(1)',
                    'character varying' => 'varchar',
                    'text' => 'longtext',
                    'uuid' => 'varchar(36)',
                    'timestamp without time zone' => 'datetime',
                    'timestamp with time zone' => 'datetime',
                    'date' => 'date',
                    'jsonb' => 'longtext',
                    'json' => 'longtext',
                ],

                'sqlsrv' => [
                    'integer' => 'int',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'boolean' => 'bit',
                    'character varying' => 'nvarchar',
                    'text' => 'ntext',
                    'uuid' => 'uniqueidentifier',
                    'timestamp without time zone' => 'datetime2',
                    'timestamp with time zone' => 'datetimeoffset',
                    'date' => 'date',
                    'jsonb' => 'nvarchar(max)',
                    'json' => 'nvarchar(max)',
                ],
            ],

            // If mysql is the master
            'mysql' => [

                'pgsql' => [
                    'int' => 'integer',
                    'integer' => 'integer',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'tinyint' => 'boolean',
                    'varchar' => 'character varying',
                    'longtext' => 'text',
                    'text' => 'text',
                    'datetime' => 'timestamp without time zone',
                    'date' => 'date',
                    'json' => 'jsonb',
                ],

                'sqlsrv' => [
                    'int' => 'int',
                    'integer' => 'int',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'tinyint' => 'bit',
                    'varchar' => 'nvarchar',
                    'longtext' => 'ntext',
                    'text' => 'ntext',
                    'datetime' => 'datetime2',
                    'date' => 'date',
                    'json' => 'nvarchar(max)',
                ],
            ],

            // If sql server is the master
            'sqlsrv' => [

                'mysql' => [
                    'int' => 'int',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'tinyint' => 'tinyint(1)',
                    'bit' => 'tinyint(1)',
                    'nvarchar' => 'varchar',
                    'ntext' => 'longtext',
                    'uniqueidentifier' => 'varchar(36)',
                    'datetime' => 'datetime',
                    'datetime2' => 'datetime',
                    'datetimeoffset' => 'datetime',
                    'date' => 'date',
                ],

                'pgsql' => [
                    'int' => 'integer',
                    'smallint' => 'smallint',
                    'bigint' => 'bigint',
                    'tinyint' => 'boolean',
                    'bit' => 'boolean',
                    'nvarchar' => 'character varying',
                    'ntext' => 'text',
                    'uniqueidentifier' => 'uuid',
                    'datetime' => 'timestamp without time zone',
                    'datetime2' => 'timestamp without time zone',
                    'datetimeoffset' => 'timestamp with time zone',
                    'date' => 'date',
                ],
            ],
        ];
    }
}