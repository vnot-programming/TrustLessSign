# 🛡️ TrustlessSign

TrustlessSign is a modern, premium, secure web application designed to sign, verify, and seal documents in a secure, privacy-preserving manner using cryptography (PKI/RSA-2048) and Google Drive integration.

---

## ✨ Features

- **Decentralized PKI / RSA-2048 Signature**: Generate, sign, and verify documents natively using certificates issued by our built-in Certificate Authority.
- **Draggable QR Code**: Position the signature seal dynamically on documents.
- **Google Drive Storage**: Keep files safe by saving them directly to Google Drive.
- **Dual-Theme & Circadian-Sync**: Smooth Light and Dark modes.
- **Color Blindness Accessibility Modes**: Optimized themes for deuteranopia, protanopia, and complete color blindness.
- **Multi-language Support (i18n)**: Out of the box English, Indonesian, Thai, and Malay localizations.

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
