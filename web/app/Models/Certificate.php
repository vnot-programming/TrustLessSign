<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Certificate extends Model
{
    use HasUuids;

    // Table has custom timestamps
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'serial_number',
        'subject_cn',
        'device_name',
        'device_identifier',
        'cert_pem',
        'issued_at',
        'expires_at',
        'is_revoked',
        'revoked_at',
        'revoke_reason',
    ];

    protected $casts = [
        'is_revoked' => 'boolean',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
