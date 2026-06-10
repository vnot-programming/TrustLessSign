### Panduan Generate File `.crx` Ekstensi Chrome
#### Menggunakan Command Line (Untuk CI/CD / Otomatisasi GitHub Actions)
Karena project `trustlesssign` menggunakan *self-hosted runner*, Kita bisa melakukan *build* dan pembuatan `.crx` otomatis saat di-push ke GitHub menggunakan library pihak ketiga dari NPM.

Anda juga sangat tepat mengenai Chrome App Store. **Penyediaan file `.crx` manual HANYA relevan untuk kebutuhan *Developer Testing*, distribusi internal terbatas, atau sebelum rilis disetujui Google.** Ketika ekstensi Anda sudah lulus *review* dan terdaftar di *Chrome Web Store*, pengguna cukup klik "Add to Chrome" tanpa perlu memedulikan `.crx`.

Karena Anda sudah memiliki `key.pem`(`/home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/key.pem`) dan pembuatan `.crx` Command Line begini caranya eksekusi perintah berikut di terminal secara berurutan:

```bash
# 1. Masuk ke direktori ekstensi
cd /home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension

# 2. Instal dependensi terlebih dahulu (agar esbuild tersedia)
npm install

# 3. Lakukan proses build
npm run build

# 4. Instal library CRX secara global
sudo npm install -g crx

# 5. Paketkan ekstensi menjadi .crx menggunakan key.pem yang ada
crx pack . -p key.pem -o trustlesssign-v1.0.0.crx
```

Setelah perintah tersebut selesai, Anda akan melihat file baru bernama `trustlesssign-v1.0.0.crx` di dalam folder tersebut. File inilah yang akan diunduh oleh pengguna dari rute *Download Manual* jika mereka belum menginstal via Chrome Web Store.

Terakhir buatkan sebuah script khusus untuk membuat `.crx` dan taruh di dalam folder `docs/scripts/`
hasil file `.crx` berikan nama `trustlesssign-v(kode versi pada manifest.json).crx`. contoh: `trustlesssign-v1.0.0.crx` letakan file `.crx` tersebut di dalam folder `docs/releases/`. kemudian, syncronkan folder `docs/releases/` tersebut ke `Desktop-PC (100.106.132.107)`.
kemudian pastikan script tersebut tereksekusi oleh CI/CD sebelum di syncronkan ke `Desktop-PC (100.106.132.107)`