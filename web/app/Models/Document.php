<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Document extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'certificate_id',
        'reason_sub_category_id',
        'gdrive_url_signed',
        'is_saved_to_drive',
        'original_filename',
        'verify_token',
        'signer_name',
        'doc_hash_sha256',
        'qr_position',
        'reason_final',
        'signed_at',
        'notes',
    ];

    protected $casts = [
        'is_saved_to_drive' => 'boolean',
        'qr_position' => 'array',
        'signed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function certificate()
    {
        return $this->belongsTo(Certificate::class);
    }

    public function reasonSubCategory()
    {
        return $this->belongsTo(ReasonSubCategory::class, 'reason_sub_category_id');
    }
}
