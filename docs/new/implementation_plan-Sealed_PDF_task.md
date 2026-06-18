# Task: Advanced Options Feature

- [x] Plan approved
- [ ] 1. Hapus debug console.log (SignDocument.jsx)
- [ ] 2. Tambah state + UI Fitur Lanjutan (SignDocument.jsx)
- [ ] 3. Modify barcode-generator.js (hideFrame param)
- [ ] 4. Pass hideFrame & sealedPerms ke extension payload (SignDocument.jsx)
- [ ] 5. service-worker.js baca hideFrame & sealedPerms
- [ ] 6. signer.js: call /api/pdf/seal jika sealedPerms ada
- [ ] 7. popup.html: Advanced Options UI sebelum Master Password
- [ ] 8. popup.js: wire up hideFrame & sealed checkboxes
- [ ] 9. Laravel: PdfSealController + route /api/pdf/seal
- [ ] 10. Python: seal_pdf.py (pikepdf AES-256, owner = SHA256)
- [ ] 11. Build web + push extension CI/CD
