<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ActivityLog extends Model
{
    protected $connection = 'dci_system';
    protected $table = 'activity_logs';
    protected $fillable = [
        'user',
        'action',
        'description',
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }
}
