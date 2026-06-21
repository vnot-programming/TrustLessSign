# 🛡️ TrustlessSign

**Trust Less Sign** is a modern, premium, secure web application designed to sign, verify, and seal documents in a secure, privacy-preserving manner using cryptography (PKI/RSA-2048) and Google Drive integration.

---
## How it WORK!

**Dashboard Web** dan **Chrome Extension** pada dasarnya adalah dua aplikasi yang **berdiri sendiri (standalone)** secara fungsional maupun tampilan, namun saling bekerja sama secara erat.

Berikut adalah penjelasan detail bagaimana keduanya berkomunikasi dan berfungsi:

### 1. Secara Tampilan (UI) & Fungsional
- **Berdiri Sendiri:** Ekstensi Chrome memiliki antarmuka (UI) popup HTML/CSS/JS-nya sendiri. Jika pengguna membuka ekstensi secara langsung tanpa membuka web dashboard, pengguna tetap bisa login, melakukan *Generate Certificate*, dan bahkan **menandatangani file PDF lokal dari komputer mereka** secara mandiri menggunakan tab "Sign PDF" di dalam ekstensi.
- **Web Dashboard:** Juga berdiri sendiri sebagai portal manajemen utama (menggunakan React). Web ini bertugas mengurus integrasi Google Drive, daftar riwayat dokumen, dan verifikasi QR Code.

### 2. Bagaimana Keduanya Berkomunikasi?
Mereka berkomunikasi melalui **Dua Jalur Berbeda**:

**A. Jalur API Endpoint (Ekstensi ➡️ Server Backend Laravel)**
Ekstensi Chrome melakukan `fetch()` layaknya aplikasi *mobile* ke endpoint `tsign.vnot.my.id/api/...`. Jalur ini digunakan untuk:
- Mengecek status Autentikasi (Token Sanctum).
- Menarik daftar "Reason Category".
- Menyimpan "Public Key" dari sertifikat yang baru di-*generate*.
- Mendaftarkan *hash* dokumen yang sudah selesai ditandatangani ke database.

**B. Jalur Bridge / Jembatan Lokal (Web Dashboard ➡️ Ekstensi Lokal)**
Ini adalah bagian terpenting dari arsitektur *Zero-Trust*. Saat pengguna berada di Dashboard Web dan menekan tombol **"Sign Document"**, Web Dashboard **TIDAK** mengirimkan file PDF ke server backend. Melainkan:
1. Web Dashboard menggunakan `window.postMessage()` untuk "berteriak" kepada Ekstensi secara lokal di browser Anda.
2. Skrip jembatan kita (`content.js`) menangkap pesan tersebut dan meneruskannya ke mesin Ekstensi.
3. **Ekstensi-lah** yang melakukan proses stempel kriptografi dan QR Code menggunakan *Private Key* yang tersimpan aman di browser Anda.
4. Setelah selesai, Ekstensi mengembalikan hasil PDF yang sudah dicap kembali ke Web Dashboard, lalu Web mengunggahnya ke Google Drive Anda.

**Kesimpulan:**
Ekstensi bertindak layaknya **"Dompet Kripto Pribadi (Crypto Wallet)"** Anda. Web Dashboard adalah aplikasi yang meminta izin kepada Dompet Anda untuk menandatangani sesuatu. Karena *Private Key* hanya ada di dalam Ekstensi dan tidak pernah dikirim ke Web/Server, sistem ini dijamin 100% *Trustless* (Mustahil dipalsukan, bahkan oleh admin server sekalipun).

---

## ✨ Features

- **Decentralized PKI / RSA-2048 Signature**: Generate, sign, and verify documents natively using certificates issued by our built-in Certificate Authority.
- **Hybrid Multi-Device Architecture**: Use multiple devices with individual certificates and securely backup your encrypted identity (`.tsign`) to Google Drive.
- **Seamless SSO (Web-Only Auth)**: Login securely via the Web Dashboard without double Google consent loops in the extension.
- **Advanced PDF Tools**: Navigate multi-page PDFs, select specific pages for your signature, and automatically inject Marginal Page Stamps to prevent page swapping.
- **Draggable QR Code**: Position the signature seal dynamically on documents.
- **Google Drive Storage**: Keep files safe by saving them directly to Google Drive.
- **Dual-Theme & Circadian-Sync**: Smooth Light and Dark modes.
- **Multi-language Support (i18n)**: Out of the box English, Indonesian, and Thai localizations.

---

## 🛠️ Tech Stack

- **Frontend**: React, Inertia.js, Tailwind CSS
- **Backend**: Laravel 13, PHP 8.5
- **Database**: PostgreSQL (Shared Cluster)
- **Infrastructure**: Docker, systemd, Tailscale
- **CI/CD**: GitHub Actions Self-Hosted Runner on VPS

---

## 🚀 CI/CD Pipeline

The project features a fully automated CI/CD pipeline running on a self-hosted runner directly on the VPS:

1. **Automated Tests**: Every push triggers PHPUnit tests (`./vendor/bin/phpunit`) in the Docker container.
2. **VPS Deploy**: Pulls the latest code, builds the production frontend assets (`npm run build`), and clears Laravel caches.
3. **Desktop-PC Sync**: Automatically syncs target code folders to the developer's Desktop PC via Tailscale SSH connection.

