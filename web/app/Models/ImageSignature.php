<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImageSignature extends Model
{
    protected $table = 'user_signatures';

    protected $fillable = [
        'user_id',
        'signature_name',
        'original_filename',
        'file_path',
        'optimized_path',
        'mime_type',
        'file_size',
        'width',
        'height',
        'file_hash',
        'is_default',
        'is_active',
        'metadata',
        'last_used_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the user that owns the signature.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the documents associated with this signature.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'signature_image_id');
    }

    /**
     * Scope a query to only include default signatures.
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
