<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IgnoredConflict extends Model
{
    protected $connection = 'dci_system';
    protected $table = 'ignored_conflicts';
    protected $fillable = [
        'master_config_id',
        'client_config_id',
        'master_database_name',
        'client_database_name',
        'table_name',
        'column_name',
        'conflict_type',
    ];

    public function masterConfig() {
        return $this->belongsTo(UserDBConfig::class, 'master_config_id');
    }

    public function clientConfig() {
        return $this->belongsTo(UserDBConfig::class, 'client_config_id');
    }
}