# Chrome Web Store - Product Details

## 1. Description (Deskripsi Lengkap)
🛡️ Trust Less Sign: Zero-Trust PDF Digital Signature

Transform the way you secure your documents with Trust Less Sign! This premium Chrome extension acts as your personal cryptographic wallet, allowing you to sign, verify, and seal PDF documents locally without ever exposing your files or private keys to a third-party server.

✨ KEY FEATURES:
• 🔐 Zero-Trust Architecture: Your RSA-2048 private keys never leave your browser
• ☁️ Hybrid Identity Backup: Securely backup and sync your encrypted identity (.tsign) to Google Drive
• 📝 Advanced PDF Tools: Navigate multi-page PDFs and dynamically place signatures via draggable QR codes
• 🛡️ Marginal Page Stamps: Automatically protect multi-page documents against page swapping
• 🌐 Seamless SSO: Effortless login experience integrated with the Trust Less Sign Web Dashboard
• 🎨 Bio-Digital Minimalism: Beautiful Dark/Light modes with color blindness accessibility themes
• 🌍 Multilingual Support: Built-in localizations for English, Indonesian, and Thai

🎯 PERFECT FOR:
• Business Professionals: Sign contracts and NDAs with guaranteed authenticity
• Legal Documents: Securely seal PDFs without relying on third-party cloud processors
• Remote Workers: Effortlessly verify and stamp documents from anywhere
• Privacy Advocates: Keep 100% ownership of your cryptographic keys

🛡️ SECURITY & PRIVACY:
• No private keys transmitted to our servers
• No document files uploaded to our backend
• Local cryptographic hashing and stamping
• End-to-end identity encryption (AES-GCM)
• Full compliance with Chrome Web Store policies

🚀 HOW IT WORKS:
1. Navigate to the Trust Less Sign Web Dashboard
2. Click "Sign Document" and let the extension take over locally
3. Drag and drop your Signature QR or Image exactly where you want it
4. The extension cryptographically signs the PDF using your local Private Key
5. The signed document is automatically backed up to your Google Drive

💝 SUPPORT DEVELOPMENT:
Enjoying a truly trustless signing experience? Consider leaving a review and sharing it with your team!

## 2. Category (Kategori Ekstensi)
Berdasarkan opsi Chrome Web Store, Anda memiliki 2 pilihan terbaik yang sangat cocok untuk ekstensi ini:
1. **Productivity > Workflow & Planning** (atau **Productivity > Tools**): Pilihan utama. Penandatanganan dokumen (seperti DocuSign) pada dasarnya adalah alat produktivitas dan alur kerja bisnis.
2. **Make Chrome Yours > Privacy & Security**: Pilihan alternatif yang sangat kuat jika Anda ingin lebih menonjolkan nilai jual utama ekstensi ini, yaitu arsitektur *Zero-Trust*, penyimpanan *Private Key* lokal, dan perlindungan privasi dokumen.

## 3. Single Purpose Description (Tujuan Tunggal Ekstensi)
Trust Less Sign serves the single purpose of securely applying cryptographic digital signatures to PDF documents locally within the user's browser, utilizing a zero-trust PKI architecture to guarantee data privacy.

## 4. Permission Justifications (Panduan Form Chrome Web Store)

*(Salin teks berbahasa Inggris di bawah ini ke dalam masing-masing kotak isian yang diminta oleh Google Chrome Web Store Developer Dashboard)*

**Storage justification:**
The `storage` permission is fundamental to the zero-trust architecture of this extension. It is used exclusively to securely store the user's generated RSA-2048 private and public keys, encrypted identity metadata, and basic UI preferences (such as language and theme settings) locally on the user's device via `chrome.storage.local`. By storing these locally, we ensure that private cryptographic keys never leave the user's browser, preventing unauthorized server-side access to their digital identity.

**Cookies justification:**
The `cookies` permission is required to enable a seamless Single Sign-On (SSO) experience between the extension and the Trust Less Sign Web Dashboard. The extension reads the authentication tokens (`tsign_api_token` and `tsign_gdrive_token`) issued by our web application to verify the user's logged-in state. This eliminates the need for users to repeatedly authenticate or undergo redundant Google OAuth consent screens within the extension popup itself.

**Downloads justification:**
The `downloads` permission acts as a critical fallback mechanism for our zero-trust signature process. If a user chooses not to link their Google Drive, or if a network error occurs during the cloud upload, the extension will automatically download the cryptographically signed PDF document and the user's encrypted identity backup (`.tsign` file) directly to their local machine. This guarantees that users never lose access to their secure documents or digital identities.


**Host permission justification:**
Host permissions are strictly required for the core functionality of the extension:
1. `https://www.googleapis.com/*`: Used exclusively to upload the user's signed PDF documents and encrypted identity backups (`.tsign`) to their personal Google Drive folder via the official Drive API, based on their explicit consent.
2. `https://tsign.vnot.my.id/*` and `http://localhost/*`: Required to securely fetch the user's profile data, signature categories, and to synchronize document statuses with our official Trust Less Sign backend and local development environments. We only interact with our own verified domains.

**Privacy Guarantee:** 
We adhere to a strict Zero-Trust policy. **Your documents, private keys, and cryptographic hashes are never transmitted to, collected by, or stored on our backend servers.** All processing happens locally on your machine.

## 5. Remote Code Declaration (Deklarasi Remote Code)

**Are you using remote code?**
Pilih: **No, I am not using Remote code**

**Justification (Jika diminta):**
The extension strictly complies with Manifest V3 security policies. All required JavaScript libraries (such as pdf-lib, node-forge, and QR code generators) are fully bundled locally within the extension's package. The extension does not download, fetch, or execute any remote code, inline scripts, or external libraries from CDNs or third-party servers.

## 6. Data Collection & Privacy Practices

Pada bagian pertanyaan **"What user data do you plan to collect from users now or in the future?"**, silakan **CENTANG (CHECK)** opsi berikut saja:

☑️ **Personally identifiable information**
*(Alasan: Ekstensi berinteraksi dengan API Dashboard untuk menampilkan nama/email pengguna di popup, dan menggunakannya sebagai nama/author di dalam sertifikat PDF).*

☑️ **Authentication information**
*(Alasan: Ekstensi ini membaca Cookie SSO (Token Akses) untuk mempertahankan status login, dan menyimpan kunci kriptografi privat pengguna di Chrome Local Storage).*

*(Catatan: Biarkan sisa kotak lainnya seperti Health, Financial, Web history, dll, dalam keadaan **TIDAK DICENTANG / KOSONG**).*

**Disclosures / Pernyataan Kepatuhan:**
Anda **WAJIB MENCENTANG KETIGA KOTAK** di bagian paling bawah untuk menyetujui kebijakan privasi Google:
☑️ I do not sell or transfer user data to third parties, outside of the approved use cases
☑️ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
☑️ I do not use or transfer user data to determine creditworthiness or for lending purposes