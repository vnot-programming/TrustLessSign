# Advanced Options Feature — TrustlessSign

## Ringkasan

Menambahkan fitur UI "Fitur Lanjutan" (Advanced Options) pada halaman Sign PDF di Web Dashboard maupun Extension Popup. Fitur ini berisi dua opsi: **Hilangkan Frame** (visual toggle) dan **Sealed (permanent)** (penguncian permission PDF dengan sertifikat user).

Selain itu, menghapus debug `console.log` pada halaman dashboard web.

---

## Proposed Changes

### 1. [MODIFY] SignDocument.jsx — Hapus debug console.log

#### [MODIFY] [SignDocument.jsx](file:///home/vnot/docker/trustlesssign/web/resources/js/Pages/SignDocument.jsx)

Hapus 4 baris `console.log` di dalam `onDragStop` dan `onResizeStop`:
- Line 821–822: log ukuran + posisi saat drag
- Line 832–833: log ukuran + posisi saat resize

---

### 2. [MODIFY] SignDocument.jsx — Tambah State & UI "Fitur Lanjutan"

#### State baru (React):

```js
// Advanced Options state
const [advancedOpen, setAdvancedOpen] = useState(false);
const [hideFrame, setHideFrame] = useState(false);
const [sealedEnabled, setSealedEnabled] = useState(false);
const [sealedPerms, setSealedPerms] = useState({
  print_highres: true,
  print_lowres: true,
  modify_other: false,
  modify_annotation: false,
  modify_assembly: false,
  modify_form: false,
  extract: false,
  sign: false,
});
```

#### UI: Dropdown "Fitur Lanjutan" (disisipkan sebelum blok `{/* Password input */}`, line ~716)

```jsx
{/* Advanced Options Accordion */}
<div className="border border-border-subtle rounded-md overflow-hidden">
  <button
    type="button"
    onClick={() => setAdvancedOpen(v => !v)}
    className="w-full flex items-center justify-between px-3 py-2 bg-surface-secondary text-xs font-semibold text-text-secondary hover:bg-surface-elevated transition-colors"
  >
    <span className="flex items-center gap-1.5">
      <Settings size={12} />
      {t.advanced_options || "Fitur Lanjutan"}
    </span>
    <ChevronDown size={12} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
  </button>

  {advancedOpen && (
    <div className="p-3 space-y-3 bg-surface-primary border-t border-border-subtle">
      {/* Hide Frame */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={hideFrame} onChange={e => setHideFrame(e.target.checked)} className="..." />
        <span className="text-xs text-text-primary">{t.hide_frame || "Hilangkan Frame"}</span>
      </label>
      <p className="text-[10px] text-text-tertiary ml-5">{t.hide_frame_desc || "Hanya QR Code atau tanda tangan yang tertempel, tanpa bingkai."}</p>

      {/* Sealed */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={sealedEnabled} onChange={e => setSealedEnabled(e.target.checked)} className="..." />
        <span className="text-xs text-text-primary">{t.sealed || "Sealed (permanent)"}</span>
      </label>
      <p className="text-[10px] text-text-tertiary ml-5">{t.sealed_desc || "Mengunci permission PDF menggunakan sertifikat Anda."}</p>

      {/* Sealed Permission Checklist (visible jika sealedEnabled) */}
      {sealedEnabled && (
        <div className="ml-5 mt-2 space-y-1 p-2 bg-surface-secondary rounded-md border border-border-subtle">
          {permissionItems.map(item => (
            <label key={item.key} className="flex items-center justify-between text-[10px] text-text-secondary cursor-pointer">
              <span>{item.label}</span>
              <input type="checkbox" checked={sealedPerms[item.key]} onChange={e => setSealedPerms(p => ({...p, [item.key]: e.target.checked}))} />
            </label>
          ))}
        </div>
      )}
    </div>
  )}
</div>
```

#### Pass ke payload postMessage:

```js
hideFrame: hideFrame,
sealedPerms: sealedEnabled ? sealedPerms : null,
```

---

### 3. [MODIFY] barcode-generator.js — Tambah parameter `hideFrame`

#### [MODIFY] [barcode-generator.js](file:///home/vnot/docker/trustlesssign/web/resources/js/Utils/barcode-generator.js)

Ubah signature fungsi `generateSignatureFrame`:
```js
export async function generateSignatureFrame(signerName, shortId, verifyUrl, uploadedImageBase64 = null, isQrCode = true, textSignedBy = "Signed by:", textVerifyAt = "Verifikasi di:", hideFrame = false)
```

Logika: Jika `hideFrame = true`, skip **semua** elemen dekoratif:
- Green border kiri (lines 37–50)
- Check mark icon (lines 52–60)
- Label `"Signed by: [signerName]"` — **dihilangkan sepenuhnya** ✅
- Hanya konten inti yang tertempel di PDF: QR Code saja, atau gambar tanda tangan saja

Serta pada `generateSignatureFrame` **dan** `generateModernTSignQR` (QR mode): jika `hideFrame = true`, cukup render konten saja (QR image / signature image) tanpa dekorasi.

---

### 4. [MODIFY] SignDocument.jsx — Gunakan `hideFrame` saat generate frame

Pada baris call ke `generateSignatureFrame` (line ~293), tambah parameter `hideFrame`:
```js
finalQrPngBase64 = await generateSignatureFrame(
    actualSigner, shortId, verifyUrlShort,
    imageSigDataUrl, false,
    t.signed_by, t.verify_at,
    hideFrame  // ← tambahan
);
```

---

### 5. [MODIFY] service-worker.js — Baca `hideFrame` & `sealedPerms` dari payload

Di `service-worker.js`, tambahkan ke metadata:
```js
hideFrame: payload.hideFrame || false,
sealedPerms: payload.sealedPerms || null,
```

---

### 6. [MODIFY] signer.js — Implementasi Sealed PDF (pdf-lib Encryption)

> [!IMPORTANT]
> `pdf-lib` yang digunakan di extension **tidak mendukung enkripsi PDF** secara native.
> Solusi terpilih: Setelah PDF di-sign, kirim ke Laravel backend endpoint `/api/pdf/seal` yang akan memproses enkripsi permission menggunakan **pikepdf (Python)** dan mengembalikan hasil PDF ter-seal.

#### Flow Sealed:
```
1. Extension signs PDF → signed PDF bytes (base64)
2. If sealedPerms != null:
   a. POST /api/pdf/seal { pdfBase64, permissions, verifyToken } ke Laravel
   b. Laravel jalankan Python: pikepdf encrypt dengan owner_password = hash(certSerial + masterPassword)
   c. Laravel return sealed PDF base64
3. Extension gunakan sealed PDF untuk download / upload GDrive
```

---

### 7. [NEW] Laravel: Endpoint `/api/pdf/seal`

#### [NEW] `PdfSealController.php`
```php
Route::post('/api/pdf/seal', [PdfSealController::class, 'seal'])->middleware('auth:sanctum');
```

Proses:
- Terima `pdfBase64` + `permissions` JSON + `verifyToken`
- Tulis PDF ke temp file
- Jalankan Python script `seal_pdf.py` dengan argumen permissions
- Return PDF base64 yang sudah ter-seal
- Hapus temp file

#### [NEW] `seal_pdf.py` (server-side, berdasarkan `secure_pdf.py`)
- Baca PDF dari stdin / path temp
- Terapkan `pikepdf.Encryption` berdasarkan permission flags dari JSON
- Owner password = `SHA256(cert_serial + master_password)` — dikirim secara aman dari extension
- Return PDF bytes ke stdout

---

### 8. [MODIFY] popup.html & popup.js — Tambah Advanced Options di Extension

Disisipkan sebelum `<!-- Master Password -->` (line 881 popup.html):

```html
<!-- Advanced Options -->
<div class="form-group">
  <button type="button" id="btn-toggle-advanced" class="btn-secondary" style="display:flex;align-items:center;justify-content:space-between;">
    <span>⚙️ Fitur Lanjutan</span>
    <span id="advanced-chevron">▼</span>
  </button>
  <div id="advanced-options-panel" style="display:none; padding: 10px; border: 1px solid var(--border-subtle); border-radius: 8px; margin-top: 6px; background: var(--surface-secondary);">
    <!-- Hide Frame -->
    <label style="display:flex;align-items:center;gap:8px;font-size:0.75rem;cursor:pointer;margin-bottom:8px;">
      <input type="checkbox" id="opt-hide-frame">
      <span>Hilangkan Frame</span>
    </label>
    <!-- Sealed -->
    <label style="display:flex;align-items:center;gap:8px;font-size:0.75rem;cursor:pointer;">
      <input type="checkbox" id="opt-sealed">
      <span>Sealed (permanent)</span>
    </label>
    <!-- Sealed Permission Checklist -->
    <div id="sealed-perms-panel" style="display:none; margin-top:8px; padding:8px; background:var(--surface-primary); border-radius:6px; border:1px solid var(--border-subtle);">
      <!-- 8 checkboxes: print_highres, print_lowres, modify_other, modify_annotation, modify_assembly, modify_form, extract, sign -->
    </div>
  </div>
</div>
```

---

## Translations (i18n)

Tambah key berikut ke semua lang file Web (EN/ID/TH):
```json
"advanced_options": "Fitur Lanjutan",
"hide_frame": "Hilangkan Frame",
"hide_frame_desc": "Hanya QR Code/tanda tangan yang tertempel, tanpa bingkai pembungkus.",
"sealed": "Sealed (permanent)",
"sealed_desc": "Mengunci permission PDF secara kriptografis menggunakan sertifikat Anda.",
"perm_print_highres": "Bisa di-print resolusi tinggi",
"perm_print_lowres": "Bisa di-print resolusi rendah",
"perm_modify_other": "Bisa mengedit isi utama",
"perm_modify_annotation": "Bisa diberi anotasi/komentar",
"perm_modify_assembly": "Bisa menyusun ulang halaman",
"perm_modify_form": "Bisa mengisi form",
"perm_extract": "Bisa di-copy teksnya",
"perm_sign": "Bisa ditandatangani ulang"
```

---

## Implementation Order (Phase)

| # | Task | Scope | Complexity |
|---|------|-------|------------|
| 1 | Hapus debug console.log | Web UI | 🟢 Trivial |
| 2 | State + UI Advanced Options accordion | Web UI | 🟡 Medium |
| 3 | Modify `generateSignatureFrame` (hideFrame param) | Web Utils | 🟡 Medium |
| 4 | Pass hideFrame ke payload Extension | Web→Ext bridge | 🟢 Low |
| 5 | Advanced Options UI di popup.html/js | Extension | 🟡 Medium |
| 6 | Laravel endpoint `/api/pdf/seal` | Backend | 🔴 High |
| 7 | Python script `seal_pdf.py` (pikepdf) | Backend | 🟡 Medium |
| 8 | Extension baca sealed response | Extension | 🟡 Medium |

---

## Analisis: Password-Based vs Certificate Security

### Certificate Security (X.509/PKI)
- Mengenkripsi PDF menggunakan **public key X.509** dari sertifikat user
- Hanya pemegang private key yang bisa mengubah permission
- Implementasi: `SubFilter: adbe.pkcs7.s3/s4` (PDF spec kompleks)
- **Kelemahan kritis**: Server **tidak bisa** mendekripsi atau merekonstruksi owner key tanpa private key user → **future verification feature TIDAK bisa berjalan server-side**

### Password-Based AES-256 (Usulan Terpilih ✅)
- Menggunakan `pikepdf.Encryption` dengan AES-256
- `user_password = ""` → dokumen bisa dibuka siapa saja tanpa password ✅
- `owner_password = SHA256(verify_token + cert_serial)` → deterministik, tidak perlu disimpan
- **Kekuatan setara**: AES-256 adalah standar militer, lebih kuat dari Certificate Security RC4-128 pada implementasi lama
- **Keunggulan kritis**: Server dapat **selalu merekonstruksi** owner password karena `verify_token` dan `cert_serial` tersimpan di database → fitur verifikasi dokumen masa depan berjalan smooth

### Keputusan Final

> [!IMPORTANT]
> **Metode terpilih: AES-256 Password-Based**
> - Formula: `owner_password = SHA256(verify_token + "::" + cert_serial)`
> - `user_password = ""` → siapapun bisa **membuka dan membaca** PDF tanpa password ✅
> - `verify_token` dan `cert_serial` tersimpan di database TrustlessSign → server dapat merekonstruksi owner_password kapan saja untuk keperluan sistem yang sah
> - Membuka PDF: **tidak memerlukan password**
> - Mengubah/melepas permission di masa depan: **dilakukan melalui TrustlessSign interface**, user wajib login dengan file `.tsign` + master password mereka

> [!NOTE]
> **Flow Perubahan Permission di Masa Depan (Future Feature)**:
> 1. User membuka TrustlessSign extension / web dashboard
> 2. User mengimpor `.tsign` mereka dan memasukkan master password
> 3. TrustlessSign Extension mengautentikasi user, mengambil `cert_serial` dari certificate
> 4. Web dashboard memanggil `GET /api/documents/{verify_token}` → mendapat `cert_serial`
> 5. Sistem merekonstruksi `owner_password = SHA256(verify_token + "::" + cert_serial)`
> 6. Endpoint `/api/pdf/modify-permissions` membuka sealed PDF dan menerapkan permission baru
> ✅ **User wajib menyimpan `.tsign` mereka** — ini adalah "kunci" identitas digital mereka

> [!NOTE]
> **Future Feature — Verifikasi Keaslian Dokumen (Upload PDF)**:
> 1. User upload PDF yang diclaim sudah ditandatangani
> 2. Backend ekstrak `verify_token` dari metadata PDF (tertanam saat signing)
> 3. Query database → ambil `cert_serial`, RSA signature, dan hash original
> 4. Verifikasi hash PDF aktual vs hash tersimpan → **dokumen asli/palsu terdeteksi**
> 5. Jika PDF ter-sealed: server rekonstruksi `owner_password` menggunakan data database → **audit berjalan smooth tanpa perlu private key user**
> ✅ Semua ini menggunakan `.tsign` user yang telah diekspor/diimpor melalui sistem TrustlessSign
