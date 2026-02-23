<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedDatabase extends Model
{
    protected $connection = 'dci_system';
    protected $table = 'saved_configs';
    protected $fillable = [
        'config_name',
        'config_driver',
        'db_config',
        'created_by',
        'created_at',
        'updated_at'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'created_by');
    }
}
