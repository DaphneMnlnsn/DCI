<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IgnoredConflict extends Model
{
    protected $connection = 'dci_system';
    protected $table = 'ignored_conflicts';
    protected $fillable = [
        'user_config_id',
        'database_name',
        'table_name',
        'column_name',
        'conflict_type',
    ];

    public function userConfig() {
        return $this->belongsTo(UserDBConfig::class, 'user_config_id');
    }
}