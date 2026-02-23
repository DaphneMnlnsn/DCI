<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDBConfig extends Model
{
    protected $connection = 'dci_system';
    protected $table = 'user_db_configs';
    protected $fillable = [
        'user_id',
        'config_id',
        'role',
        'created_at',
        'updated_at'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function savedDatabase() {
        return $this->belongsTo(SavedDatabase::class, 'config_id');
    }
}
