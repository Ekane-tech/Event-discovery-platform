<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppFeedback extends Model
{
    use HasFactory;

    protected $table = 'app_feedback';

    protected $fillable = ['user_id', 'name', 'email', 'rating', 'category', 'message', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
