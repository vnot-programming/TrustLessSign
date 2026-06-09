<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReasonSubCategory extends Model
{
    public $timestamps = false;

    protected $fillable = ['category_id', 'reason_text_en', 'reason_text_id', 'reason_text_th', 'is_custom', 'sort_order'];

    public function category()
    {
        return $this->belongsTo(ReasonCategory::class, 'category_id');
    }
}
