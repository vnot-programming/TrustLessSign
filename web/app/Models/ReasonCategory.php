<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReasonCategory extends Model
{
    public $timestamps = false;

    protected $fillable = ['name_en', 'name_id', 'name_th', 'sort_order'];

    public function subCategories()
    {
        return $this->hasMany(ReasonSubCategory::class, 'category_id');
    }
}
