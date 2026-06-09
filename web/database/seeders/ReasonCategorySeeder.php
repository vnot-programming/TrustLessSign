<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReasonCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name_en' => 'Legal & Official',
                'name_id' => 'Legalitas & Dokumen Resmi',
                'name_th' => 'เอกสารทางกฎหมายและเป็นทางการ',
                'sort_order' => 1,
                'sub_categories' => [
                    ['en' => 'I approve this document', 'id' => 'Saya menyetujui dokumen ini', 'th' => 'ฉันอนุมัติเอกสารนี้'],
                    ['en' => 'I am the author of this document', 'id' => 'Saya adalah penulis dokumen ini', 'th' => 'ฉันเป็นผู้เขียนเอกสารนี้'],
                ]
            ],
            [
                'name_en' => 'Administrative',
                'name_id' => 'Administratif',
                'name_th' => 'ธุรการ',
                'sort_order' => 2,
                'sub_categories' => [
                    ['en' => 'I acknowledge this document', 'id' => 'Saya mengetahui dokumen ini', 'th' => 'ฉันรับทราบเอกสารนี้'],
                    ['en' => 'Digital Verification', 'id' => 'Verifikasi Digital', 'th' => 'การตรวจสอบแบบดิจิทัล'],
                ]
            ],
            [
                'name_en' => 'Custom',
                'name_id' => 'Kustom',
                'name_th' => 'กำหนดเอง',
                'sort_order' => 3,
                'sub_categories' => [
                    ['en' => 'Custom Reason', 'id' => 'Alasan Kustom', 'th' => 'เหตุผลที่กำหนดเอง', 'is_custom' => true],
                ]
            ]
        ];

        foreach ($categories as $cat) {
            $category = \App\Models\ReasonCategory::create([
                'name_en' => $cat['name_en'],
                'name_id' => $cat['name_id'],
                'name_th' => $cat['name_th'],
                'sort_order' => $cat['sort_order'],
            ]);

            foreach ($cat['sub_categories'] as $idx => $sub) {
                \App\Models\ReasonSubCategory::create([
                    'category_id' => $category->id,
                    'reason_text_en' => $sub['en'],
                    'reason_text_id' => $sub['id'],
                    'reason_text_th' => $sub['th'],
                    'is_custom' => $sub['is_custom'] ?? false,
                    'sort_order' => $idx + 1,
                ]);
            }
        }
    }
}
