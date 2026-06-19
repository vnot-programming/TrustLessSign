# Implementation Plan: PDF Pagination & Specific Page Selection

## Goal
Menambahkan fitur pratinjau seluruh halaman PDF agar pengguna dapat memilih secara spesifik di halaman mana tanda tangan (QR Code atau Image Signature) akan ditempatkan. Hal ini sangat penting karena tidak semua dokumen ditandatangani di halaman pertama; ada kalanya di halaman tengah atau akhir.

## Rekomendasi untuk Dokumen Skala Besar (Ratusan - Ribuan Halaman)
> [!IMPORTANT]
> **Rekomendasi Arsitektur (Anti-Crash):**
> Jika sebuah dokumen PDF memiliki ribuan halaman, merender semua halamannya sekaligus ke dalam DOM (Browser) akan menyebabkan **Memory Crash** atau Browser Freezing yang ekstrem. 
> Solusi yang paling tepat dan profesional adalah menerapkan **Sistem Pagination (Satu Halaman pada Satu Waktu)**.
> - Hanya 1 halaman yang dirender di layar setiap saat.
> - Tersedia tombol `Sebelumnya` (Prev) dan `Selanjutnya` (Next), indikator `Halaman X dari Y`, **serta input teks `Go to...` untuk melompat ke halaman spesifik**.
> - Saat pengguna berpindah halaman, kanvas diperbarui dengan halaman yang sesuai.
> - Saat pengguna meletakkan tanda tangan, sistem akan mencatat koordinat X, Y sekaligus **Nomor Halaman (Page Number)** saat ini untuk dieksekusi oleh PDF-Lib di belakang layar.

## User Review Required
> [!WARNING]
> Karena kita menggunakan Pagination (merender per halaman demi optimalisasi RAM), hal ini berarti jika user menyisipkan gambar pada Halaman 2, maka tanda tangan tersebut tidak akan muncul jika user pindah melihat Halaman 1. Tanda tangan akan terkunci informasinya untuk disisipkan ke Halaman 2. Pendekatan "Satu Signature Box per Sesi untuk Spesifik Halaman" ini **telah disetujui** oleh pengguna.

## Proposed Changes

### 1. Web Dashboard (React + Inertia)
#### [MODIFY] `web/resources/js/Pages/SignDocument.jsx`
- Menambahkan UI Navigasi Halaman (Tombol Prev/Next, Teks Halaman X/Y, dan Input `Go to...`) di bagian atas container `<Document>`.
- Menghubungkan fungsi navigasi tersebut dengan state `pageNumber` yang sudah tersedia di komponen React.
- Meneruskan variabel `pageNumber` ke metadata pengiriman payload ke Ekstensi, yang mana propertinya (`qrPosition.page`) sebenarnya sudah disediakan.

### 2. Chrome Extension (Vanilla JS + HTML)
#### [MODIFY] `chrome-extension/popup/popup.html`
- Menambahkan elemen UI navigasi (Prev / Next buttons, label teks Halaman X/Y, dan Input `Go to...`) tepat di bawah `#pdf-preview-container` atau di dalam `#pdf-preview-container`.

#### [MODIFY] `chrome-extension/popup/popup.js`
- Menambahkan logika state global `currentPage = 1`.
- Membuat fungsi modular `renderPage(pageNumber)` menggunakan `pdfjsLib`.
- Menambahkan event listener pada tombol Prev/Next serta input `Go to...` untuk memanggil `renderPage` yang memvalidasi rentang halaman.
- Mengubah fungsi Submit payload `TRUSTLESS_SIGN_REQUEST` agar menangkap variabel `currentPage` saat ini dan mengirimkannya di `qrPosition: { page: currentPage, ... }`.

### 3. Safari Extension
#### [MODIFY] `safari-extension/Resources/popup/popup.html`
- (Sama seperti Chrome Extension)
#### [MODIFY] `safari-extension/Resources/popup/popup.js`
- (Sama seperti Chrome Extension)

## Verification Plan

### Manual Verification
1. **Testing File Besar:** Upload file PDF dengan lebih dari 5 halaman (di Web dan Extension).
2. **Navigasi Halaman:** Pastikan dapat berpindah ke halaman terakhir tanpa lag/hang.
3. **Penempatan Tanda Tangan:** Posisikan Signature Box pada halaman ke-3 (misalnya), lalu klik Sign & Seal.
4. **Verifikasi Output PDF:** Buka file PDF hasil unduhan, dan pastikan tanda tangan atau QR code benar-benar muncul di halaman ke-3, bukan di halaman pertama.
