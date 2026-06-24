import json

new_keys = {
    'en': {
        'advanced_options': 'Advanced Options',
        'hide_frame': 'Hide Frame',
        'hide_frame_desc': 'Only QR Code or signature is embedded, without decorative border.',
        'sealed': 'Sealed (permanent)',
        'sealed_desc': 'Locks PDF permissions. Anyone can open it, but cannot change settings without TrustlessSign.',
        'sealed_perms_title': 'Document Permissions',
        'perm_print_highres': 'Allow high-res print',
        'perm_print_lowres': 'Allow low-res print',
        'perm_modify_other': 'Allow editing content',
        'perm_modify_annotation': 'Allow annotations/comments',
        'perm_modify_assembly': 'Allow page re-ordering',
        'perm_modify_form': 'Allow form filling',
        'perm_extract': 'Allow text copy',
        'perm_sign': 'Allow re-signing',
    },
    'id': {
        'advanced_options': 'Fitur Lanjutan',
        'hide_frame': 'Hilangkan Frame',
        'hide_frame_desc': 'Hanya QR Code atau tanda tangan yang tertempel, tanpa bingkai pembungkus.',
        'sealed': 'Sealed (permanent)',
        'sealed_desc': 'Mengunci permission PDF. Dapat dibuka semua orang, namun tidak dapat diubah tanpa TrustlessSign.',
        'sealed_perms_title': 'Izin Dokumen',
        'perm_print_highres': 'Bisa di-print resolusi tinggi',
        'perm_print_lowres': 'Bisa di-print resolusi rendah',
        'perm_modify_other': 'Bisa mengedit isi utama',
        'perm_modify_annotation': 'Bisa diberi anotasi/komentar',
        'perm_modify_assembly': 'Bisa menyusun ulang halaman',
        'perm_modify_form': 'Bisa mengisi form',
        'perm_extract': 'Bisa di-copy teksnya',
        'perm_sign': 'Bisa ditandatangani ulang',
    },
    'th': {
        'advanced_options': 'ตัวเลือกขั้นสูง',
        'hide_frame': 'ซ่อนกรอบ',
        'hide_frame_desc': 'แสดงเฉพาะ QR Code หรือลายเซ็น ไม่มีกรอบตกแต่ง',
        'sealed': 'ปิดผนึก (ถาวร)',
        'sealed_desc': 'ล็อคสิทธิ์ PDF ทุกคนสามารถเปิดได้ แต่เปลี่ยนการตั้งค่าไม่ได้หากไม่ใช้ TrustlessSign',
        'sealed_perms_title': 'สิทธิ์เอกสาร',
        'perm_print_highres': 'อนุญาตพิมพ์ความละเอียดสูง',
        'perm_print_lowres': 'อนุญาตพิมพ์ความละเอียดต่ำ',
        'perm_modify_other': 'อนุญาตแก้ไขเนื้อหา',
        'perm_modify_annotation': 'อนุญาตเพิ่มคำอธิบาย',
        'perm_modify_assembly': 'อนุญาตจัดเรียงหน้า',
        'perm_modify_form': 'อนุญาตกรอกฟอร์ม',
        'perm_extract': 'อนุญาตคัดลอกข้อความ',
        'perm_sign': 'อนุญาตลงนามซ้ำ',
    }
}

paths = {
    'en': '/home/vnot/docker/trustlesssign/web/resources/messages/en.json',
    'id': '/home/vnot/docker/trustlesssign/web/resources/messages/id.json',
    'th': '/home/vnot/docker/trustlesssign/web/resources/messages/th.json',
}

for lang, path in paths.items():
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if 'Sign' not in data:
            data['Sign'] = {}
        data['Sign'].update(new_keys[lang])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'[OK] Updated {lang}.json')
    except Exception as e:
        print(f'[ERROR] {lang}: {e}')
