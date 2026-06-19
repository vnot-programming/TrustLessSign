// popup.js for TrustlessSign Extension (Manifest V3)

document.addEventListener('DOMContentLoaded', async () => {
  const bodyEl = document.body;
  const btnPopout = document.getElementById('btn-popout');
  const viewLogin = document.getElementById('view-login');
  const viewMain = document.getElementById('view-main');

  // Login fields
  const loginUrlInput = document.getElementById('login-url');
  const btnLoginWeb = document.getElementById('btn-login-web');
  const loginStatus = document.getElementById('login-status');

  // User Info
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const btnLogout = document.getElementById('btn-logout');

  // Tabs
  const tabSign = document.getElementById('tab-sign');
  const tabKeys = document.getElementById('tab-keys');
  const contentSign = document.getElementById('content-sign');
  const contentKeys = document.getElementById('content-keys');

  // Sign tab fields
  const signFileInput = document.getElementById('sign-file');
  const signPasswordInput = document.getElementById('sign-password');
  const btnSignSubmit = document.getElementById('btn-sign-submit');
  const signStatus = document.getElementById('sign-status');
  const signSuccessCard = document.getElementById('sign-success-card');
  const btnDownloadSigned = document.getElementById('btn-download-signed');

  // Reasons dropdowns
  const reasonContainer = document.getElementById('reason-selectors-container');
  const categorySelect = document.getElementById('reason-category');
  const subcategorySelect = document.getElementById('reason-subcategory');
  const customReasonText = document.getElementById('reason-custom');
  const reasonNotesText = document.getElementById('reason-notes');

  // PDF Preview coordinates and dragging
  const previewContainer = document.getElementById('pdf-preview-container');
  const pdfCanvas = document.getElementById('pdf-canvas');
  const qrDragBox = document.getElementById('qr-drag-box');
  const signatureTypeContainer = document.getElementById('signature-type-container');
  const signatureTypeSelect = document.getElementById('signature-type');
  const signerModeContainer = document.getElementById('signer-mode-container');
  const signerModeSelect = document.getElementById('signer-mode');
  const optSignerUser = document.getElementById('opt-signer-user');
  const signerNameContainer = document.getElementById('signer-name-container');
  const signerNameInput = document.getElementById('signer-name-input');
  const qrDragText = document.getElementById('qr-drag-text');
  const qrDragImg = document.getElementById('qr-drag-img');

  // Keygen tab fields
  const certStatusBadge = document.getElementById('cert-status-badge');
  const certExpiryText = document.getElementById('cert-expiry-text');
  const keygenPasswordInput = document.getElementById('keygen-password');
  const keygenConfirmInput = document.getElementById('keygen-confirm');
  const btnGenerateCert = document.getElementById('btn-generate-cert');
  const keysStatus = document.getElementById('keys-status');

  // Progress overlay
  const progressOverlay = document.getElementById('progress-overlay');
  const progressDesc = document.getElementById('progress-desc');
  const progressBar = document.getElementById('progress-bar');
  const progressPct = document.getElementById('progress-pct');
  const stepDownload = document.getElementById('step-download');
  const stepStamp = document.getElementById('step-stamp');
  const stepUpload = document.getElementById('step-upload');

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const langSelect = document.getElementById('extension-lang-select');

  // Footer elements
  const supportBtn = document.getElementById('supportBtn');
  const privacyBtn = document.getElementById('privacyBtn');
  const termsBtn = document.getElementById('termsBtn');
  const extensionVersion = document.getElementById('extensionVersion');

  // Shared state variables
  let currentFileBytes = null;
  let pdfPageWidthPoints = 600;
  let pdfPageHeightPoints = 800;
  let qrX = 10;
  let qrY = 10;
  let signedPdfBase64 = null;
  let finalFileName = null;
  let reasonsCategories = [];
  let currentPdfNumPages = 1;
  let currentLoadedPdf = null;
  let currentPageNumber = 1;

  // Advanced Options state
  let advancedOptionsOpen = false;
  let optHideFrame = false;
  let optSealedEnabled = false;
  let sealedPermsState = {
    print_highres: true,
    print_lowres: true,
    modify_other: false,
    modify_annotation: false,
    modify_assembly: false,
    modify_form: false,
    extract: false,
    sign: false
  };

  const permissionItemDefs = [
    { key: 'print_highres', labelEn: 'Allow high-res print', labelId: 'Bisa di-print resolusi tinggi' },
    { key: 'print_lowres', labelEn: 'Allow low-res print', labelId: 'Bisa di-print resolusi rendah' },
    { key: 'modify_other', labelEn: 'Allow editing content', labelId: 'Bisa mengedit isi utama' },
    { key: 'modify_annotation', labelEn: 'Allow annotations', labelId: 'Bisa diberi anotasi/komentar' },
    { key: 'modify_assembly', labelEn: 'Allow page re-ordering', labelId: 'Bisa menyusun ulang halaman' },
    { key: 'modify_form', labelEn: 'Allow form filling', labelId: 'Bisa mengisi form' },
    { key: 'extract', labelEn: 'Allow text copy', labelId: 'Bisa di-copy teksnya' },
    { key: 'sign', labelEn: 'Allow re-signing', labelId: 'Bisa ditandatangani ulang' }
  ];

  // Build Sealed permissions checklist
  function buildSealedPermsList(lang) {
    const listEl = document.getElementById('sealed-perms-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    permissionItemDefs.forEach(item => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;align-items:center;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);cursor:pointer;gap:4px;';
      const spanText = document.createElement('span');
      spanText.textContent = lang === 'id' ? item.labelId : item.labelEn;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.style.cssText = 'accent-color:var(--accent-primary);flex-shrink:0;';
      cb.checked = sealedPermsState[item.key];
      cb.addEventListener('change', () => {
        sealedPermsState[item.key] = cb.checked;
        console.log(`[DEBUG] Permission changed: ${item.key} = ${cb.checked}`);
      });
      label.appendChild(spanText);
      label.appendChild(cb);
      listEl.appendChild(label);
    });
  }

  // Translation dictionary
  const dictionary = {
    en: {
      signin: "Sign In",
      auth_req: "Authentication is required to register signed documents.",
      backend_url: "Backend URL",
      login_google: "Login via Google",
      tab_sign: "Sign PDF",
      tab_keys: "Keys & Cert",
      select_pdf: "Select PDF Document",
      reason_cat: "Reason Category",
      reason_title: "Signature Reason",
      reason_detail: "Detail Reason / Custom Note",
      reason_notes: "Additional Notes (Optional)",
      master_pwd: "Master Password",
      btn_sign: "Sign & Seal PDF",
      success_title: "Document Signed Successfully!",
      success_desc: "Your document has been signed cryptographically.",
      btn_download: "Download",
      btn_view_drive: "View",
      cert_checking: "Checking Cert...",
      cert_active: "CERTIFICATE ACTIVE",
      cert_none: "NO CERTIFICATE FOUND",
      cert_expires: "Expires",
      cert_desc: "Please generate a secure cryptographic key below.",
      btn_regenerate: "Re-generate / Replace Certificate",
      btn_generate: "Generate Certificate",
      device_name: "Device Name (Optional)",
      placeholder_device: "e.g. MacBook Air, PC Kantor...",
      pwd_min: "Master Password (Min 8 characters)",
      pwd_confirm: "Confirm Master Password",
      btn_gen_cert: "Generate New Certificate",
      progress_title: "Processing Document File...",
      step_read: "Reading original file from Google Drive",
      step_stamp: "Embedding cryptographic signature & QR Code",
      step_upload: "Uploading stamped document back to Google Drive",
      placeholder_custom: "Enter detail reason...",
      placeholder_notes: "Notes...",
      placeholder_pwd: "Certificate password...",
      placeholder_keygen_pwd: "Enter key password...",
      placeholder_keygen_confirm: "Confirm key password...",
      advanced_options: "Advanced Options",
      hide_frame: "Hide Frame",
      hide_frame_desc: "Only QR Code or signature is embedded, without decorative border.",
      sealed: "Sealed (permanent)",
      sealed_desc: "Locks PDF permissions. Anyone can open it, but cannot change settings without TrustlessSign.",
      perms_title: "Document Permissions"
    },
    id: {
      signin: "Masuk",
      auth_req: "Autentikasi diperlukan untuk mendaftarkan dokumen.",
      backend_url: "URL Backend",
      login_google: "Masuk via Google",
      tab_sign: "Tanda Tangani PDF",
      tab_keys: "Kunci & Sertifikat",
      select_pdf: "Pilih Dokumen PDF",
      reason_cat: "Kategori Alasan",
      reason_title: "Alasan Tanda Tangan",
      reason_detail: "Detail Alasan / Catatan Kustom",
      reason_notes: "Catatan Tambahan (Opsional)",
      master_pwd: "Kata Sandi Utama",
      btn_sign: "Tanda Tangani & Segel PDF",
      success_title: "Dokumen Berhasil Disahkan!",
      success_desc: "Dokumen Anda telah ditandatangani secara kriptografis.",
      btn_download: "Unduh",
      btn_view_drive: "Lihat",
      cert_checking: "Memeriksa Sertifikat...",
      cert_active: "SERTIFIKAT AKTIF",
      cert_none: "BELUM ADA SERTIFIKAT",
      cert_expires: "Kedaluwarsa",
      cert_desc: "Silakan buat kunci kriptografi aman di bawah ini.",
      btn_regenerate: "Buat Ulang / Ganti Sertifikat",
      btn_generate: "Buat Sertifikat",
      device_name: "Nama Perangkat (Opsional)",
      placeholder_device: "cth. MacBook Air, PC Kantor...",
      pwd_min: "Kata Sandi Utama (Min 8 karakter)",
      pwd_confirm: "Konfirmasi Kata Sandi Utama",
      btn_gen_cert: "Buat Sertifikat Baru",
      progress_title: "Memproses Dokumen Berkas...",
      step_read: "Membaca berkas asli dari Google Drive",
      step_stamp: "Menyisipkan tanda tangan kriptografi & QR Code",
      step_upload: "Mengunggah dokumen ter-stamp kembali ke Google Drive",
      placeholder_custom: "Masukkan detail alasan...",
      placeholder_notes: "Catatan...",
      placeholder_pwd: "Kata sandi sertifikat...",
      placeholder_keygen_pwd: "Masukkan kata sandi kunci...",
      placeholder_keygen_confirm: "Konfirmasi kata sandi kunci...",
      advanced_options: "Fitur Lanjutan",
      hide_frame: "Hilangkan Frame",
      hide_frame_desc: "Hanya QR Code atau tanda tangan yang tertempel, tanpa bingkai.",
      sealed: "Sealed (permanent)",
      sealed_desc: "Mengunci permission PDF. Dapat dibuka semua orang, namun tidak bisa diubah tanpa TrustlessSign.",
      perms_title: "Izin Dokumen"
    },
    th: {
      signin: "เข้าสู่ระบบ",
      auth_req: "ต้องทำการยืนยันตัวตนเพื่อลงทะเบียนเอกสารที่ลงนาม",
      backend_url: "URL แบ็กเอนด์",
      login_google: "เข้าสู่ระบบด้วย Google",
      tab_sign: "ลงนาม PDF",
      tab_keys: "คีย์และใบรับรอง",
      select_pdf: "เลือกเอกสาร PDF",
      reason_cat: "หมวดหมู่เหตุผล",
      reason_title: "เหตุผลการลงนาม",
      reason_detail: "รายละเอียดเหตุผล / บันทึกย่อที่กำหนดเอง",
      reason_notes: "หมายเหตุเพิ่มเติม (ไม่บังคับ)",
      master_pwd: "รหัสผ่านหลัก",
      btn_sign: "ลงนามและประทับตรา PDF",
      success_title: "ลงนามเอกสารสำเร็จแล้ว!",
      success_desc: "เอกสารของคุณได้รับการลงนามทางเข้ารหัสลับแล้ว",
      btn_download: "ดาวน์โหลด",
      btn_view_drive: "ดู",
      cert_checking: "กำลังตรวจสอบใบรับรอง...",
      cert_active: "ใบรับรองใช้งานได้",
      cert_none: "ไม่พบใบรับรอง",
      cert_expires: "หมดอายุ",
      cert_desc: "โปรดสร้างคีย์เข้ารหัสที่ปลอดภัยด้านล่าง",
      btn_regenerate: "สร้างใหม่ / แทนที่ใบรับรอง",
      btn_generate: "สร้างใบรับรอง",
      device_name: "ชื่ออุปกรณ์ (ไม่บังคับ)",
      placeholder_device: "เช่น MacBook Air, PC Kantor...",
      pwd_min: "รหัสผ่านหลัก (อย่างน้อย 8 ตัวอักษร)",
      pwd_confirm: "ยืนยันรหัสผ่านหลัก",
      btn_gen_cert: "สร้างใบรับรองใหม่",
      progress_title: "กำลังประมวลผลไฟล์เอกสาร...",
      step_read: "กำลังอ่านไฟล์ต้นฉบับจาก Google Drive",
      step_stamp: "กำลังฝังลายเซ็นดิจิทัลและรหัส QR",
      step_upload: "กำลังอัปโหลดเอกสารที่ประทับตรากลับไปยัง Google Drive",
      placeholder_custom: "ป้อนรายละเอียดเหตุผล...",
      placeholder_notes: "บันทึกย่อ...",
      placeholder_pwd: "รหัสผ่านใบรับรอง...",
      placeholder_keygen_pwd: "ป้อนรหัสผ่านหลัก...",
      placeholder_keygen_confirm: "ยืนยันรหัสผ่านหลัก...",
      advanced_options: "ตัวเลือกขั้นสูง",
      hide_frame: "ซ่อนกรอบ",
      hide_frame_desc: "แสดงเฉพาะ QR Code หรือลายเซ็น ไม่มีกรอบตกแต่ง",
      sealed: "ปิดผนึก (ถาวร)",
      sealed_desc: "ล็อคสิทธิ์ PDF ทุกคนสามารถเปิดได้ แต่เปลี่ยนการตั้งค่าไม่ได้หากไม่ใช้ TrustlessSign",
      perms_title: "สิทธิ์เอกสาร"
    }
  };

  const translateUI = (lang) => {
    const trans = dictionary[lang] || dictionary.en;

    // Login View
    const signInTitle = viewLogin.querySelector('h3');
    if (signInTitle) signInTitle.textContent = trans.signin;
    const signInDesc = viewLogin.querySelector('p');
    if (signInDesc) signInDesc.textContent = trans.auth_req;
    const backendUrlLabel = viewLogin.querySelector('label');
    if (backendUrlLabel) backendUrlLabel.textContent = trans.backend_url;
    const googleLoginBtn = document.getElementById('btn-login-google');
    if (googleLoginBtn) {
      const svg = googleLoginBtn.querySelector('svg');
      googleLoginBtn.innerHTML = '';
      if (svg) googleLoginBtn.appendChild(svg);
      googleLoginBtn.appendChild(document.createTextNode(' ' + trans.login_google));
    }

    // Tabs
    if (tabSign) tabSign.textContent = trans.tab_sign;
    if (tabKeys) tabKeys.textContent = trans.tab_keys;

    // Sign Document Tab Content
    const selectPdfLabel = contentSign.querySelector('div.form-group:nth-of-type(1) label');
    if (selectPdfLabel) selectPdfLabel.textContent = trans.select_pdf;

    const reasonCatLabel = contentSign.querySelector('#reason-selectors-container div.form-group:nth-of-type(1) label');
    if (reasonCatLabel) reasonCatLabel.textContent = trans.reason_cat;

    const reasonTitleLabel = contentSign.querySelector('#reason-selectors-container div.form-group:nth-of-type(2) label');
    if (reasonTitleLabel) reasonTitleLabel.textContent = trans.reason_title;

    const reasonDetailLabel = contentSign.querySelector('#reason-selectors-container div.form-group:nth-of-type(3) label');
    if (reasonDetailLabel) reasonDetailLabel.textContent = trans.reason_detail;

    const reasonNotesLabel = contentSign.querySelector('#reason-selectors-container div.form-group:nth-of-type(4) label');
    if (reasonNotesLabel) reasonNotesLabel.textContent = trans.reason_notes;

    const pwdInput = document.getElementById('sign-password');
    if (pwdInput && pwdInput.previousElementSibling) {
      pwdInput.previousElementSibling.textContent = trans.master_pwd;
    }
    if (pwdInput) pwdInput.setAttribute('placeholder', trans.placeholder_pwd);

    if (btnSignSubmit) {
      const svg = btnSignSubmit.querySelector('svg');
      btnSignSubmit.innerHTML = '';
      if (svg) btnSignSubmit.appendChild(svg);
      btnSignSubmit.appendChild(document.createTextNode(' ' + trans.btn_sign));
    }

    // Success Card
    const successTitle = document.querySelector('#sign-success-card h4');
    if (successTitle) successTitle.textContent = trans.success_title;
    const successDesc = document.querySelector('#sign-success-card p');
    if (successDesc) successDesc.textContent = trans.success_desc;
    const downloadSignedBtn = document.getElementById('btn-download-signed');
    if (downloadSignedBtn) downloadSignedBtn.textContent = trans.btn_download;
    const viewDriveText = document.getElementById('btn-view-drive-text');
    if (viewDriveText) viewDriveText.textContent = trans.btn_view_drive;

    // Keys & Cert Tab Content
    const keygenDeviceLabel = contentKeys.querySelector('div.form-group:nth-of-type(1) label');
    if (keygenDeviceLabel) keygenDeviceLabel.textContent = trans.device_name || "Device Name (Optional)";
    const keygenDeviceInput = document.getElementById('keygen-device-name');
    if (keygenDeviceInput) keygenDeviceInput.setAttribute('placeholder', trans.placeholder_device || "e.g. MacBook Air, PC Kantor...");

    const keygenPwdLabel = contentKeys.querySelector('div.form-group:nth-of-type(2) label');
    if (keygenPwdLabel) keygenPwdLabel.textContent = trans.pwd_min;
    const keygenPwdInput = document.getElementById('keygen-password');
    if (keygenPwdInput) keygenPwdInput.setAttribute('placeholder', trans.placeholder_keygen_pwd);

    const keygenConfirmLabel = contentKeys.querySelector('div.form-group:nth-of-type(3) label');
    if (keygenConfirmLabel) keygenConfirmLabel.textContent = trans.pwd_confirm;
    const keygenConfirmInput = document.getElementById('keygen-confirm');
    if (keygenConfirmInput) keygenConfirmInput.setAttribute('placeholder', trans.placeholder_keygen_confirm);

    const btnGenerateCert = document.getElementById('btn-generate-cert');
    if (btnGenerateCert) btnGenerateCert.textContent = trans.btn_gen_cert;

    // Progress Overlay
    const progressTitle = document.querySelector('#progress-overlay h4');
    if (progressTitle) progressTitle.textContent = trans.progress_title;

    const stepDownloadText = document.querySelector('#step-download .step-text');
    if (stepDownloadText) stepDownloadText.textContent = trans.step_read;
    const stepStampText = document.querySelector('#step-stamp .step-text');
    if (stepStampText) stepStampText.textContent = trans.step_stamp;
    const stepUploadText = document.querySelector('#step-upload .step-text');
    if (stepUploadText) stepUploadText.textContent = trans.step_upload;
  };

  // Theme Toggle Logic
  const initTheme = () => {
    chrome.storage.local.get(['extensionTheme'], (storage) => {
      const theme = storage.extensionTheme || 'system';
      applyTheme(theme);
    });
  };

  const applyTheme = (theme) => {
    bodyEl.classList.remove('dark-mode', 'light-mode');
    if (theme === 'dark') {
      bodyEl.classList.add('dark-mode');
    } else if (theme === 'light') {
      bodyEl.classList.add('light-mode');
    }
  };

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      chrome.storage.local.get(['extensionTheme'], (storage) => {
        const currentTheme = storage.extensionTheme || 'system';
        let newTheme = 'system';
        if (currentTheme === 'system') {
          newTheme = 'light';
        } else if (currentTheme === 'light') {
          newTheme = 'dark';
        } else {
          newTheme = 'system';
        }
        chrome.storage.local.set({ extensionTheme: newTheme }, () => {
          applyTheme(newTheme);
        });
      });
    });
  }

  // Language Switcher Logic
  const initLanguage = () => {
    chrome.storage.local.get(['extensionLang'], (storage) => {
      const lang = storage.extensionLang || 'en';
      if (langSelect) langSelect.value = lang;
      translateUI(lang);
    });
  };

  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      chrome.storage.local.set({ extensionLang: newLang }, () => {
        translateUI(newLang);
        buildSealedPermsList(newLang);
        if (typeof checkAuth === 'function') checkAuth();
      });
    });
  }

  // === Advanced Options event listeners ===
  const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
  const advancedPanel = document.getElementById('advanced-options-panel');
  const advancedChevron = document.getElementById('advanced-chevron');
  const optHideFrameEl = document.getElementById('opt-hide-frame');
  const optSealedEl = document.getElementById('opt-sealed');
  const sealedPermsPanel = document.getElementById('sealed-perms-panel');

  if (btnToggleAdvanced && advancedPanel) {
    btnToggleAdvanced.addEventListener('click', () => {
      advancedOptionsOpen = !advancedOptionsOpen;
      advancedPanel.style.display = advancedOptionsOpen ? 'block' : 'none';
      if (advancedChevron) {
        advancedChevron.style.transform = advancedOptionsOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  if (optHideFrameEl) {
    optHideFrameEl.addEventListener('change', () => {
      optHideFrame = optHideFrameEl.checked;
    });
  }

  if (optSealedEl && sealedPermsPanel) {
    optSealedEl.addEventListener('change', () => {
      optSealedEnabled = optSealedEl.checked;
      sealedPermsPanel.style.display = optSealedEnabled ? 'block' : 'none';
      if (optSealedEnabled) {
        // Build the permissions list with current language
        const currentLang = langSelect ? langSelect.value : 'en';
        buildSealedPermsList(currentLang);
      }
    });
  }

  // Build initial (default) sealed perms list
  buildSealedPermsList(langSelect ? langSelect.value : 'en');

  // Setup PDFjs
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = '../assets/pdf.worker.min.js';

  // 1. Detect Popout View
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('popout') === 'true') {
    bodyEl.classList.remove('popup-view');
    if (btnPopout) btnPopout.classList.add('hidden'); // Hide popout button in popout view
  }

  // Popout click listener
  if (btnPopout) {
    btnPopout.addEventListener('click', () => {
      const width = 450;
      const height = 700;
      const left = Math.round((screen.width - width) / 2);
      const top = Math.round((screen.height - height) / 2);

      chrome.windows.create({
        url: chrome.runtime.getURL('popup/popup.html?popout=true'),
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top
      }, () => {
        window.close();
      });
    });
  }

  // 2. Check Auth Status
  const checkAuth = async () => {
    const baseUrlInput = loginUrlInput.value.replace(/\/$/, '');

    // Seamless SSO: Check web cookie first
    if (chrome.cookies) {
      try {
        const apiCookie = await chrome.cookies.get({ url: baseUrlInput, name: 'tsign_api_token' });
        const gdriveCookie = await chrome.cookies.get({ url: baseUrlInput, name: 'tsign_gdrive_token' });

        if (apiCookie && apiCookie.value) {
          await chrome.storage.local.set({
            sanctumToken: decodeURIComponent(apiCookie.value),
            gdriveToken: gdriveCookie ? decodeURIComponent(gdriveCookie.value) : '',
            baseUrl: baseUrlInput
          });
        } else {
          await chrome.storage.local.remove(['sanctumToken', 'gdriveToken']);
        }
      } catch (err) {
        console.error('Error reading cookies:', err);
      }
    }

    chrome.storage.local.get(['sanctumToken', 'gdriveToken', 'baseUrl', 'trustless_cert_serial'], async (storage) => {
      const token = storage.sanctumToken;
      const baseUrl = storage.baseUrl || baseUrlInput;
      const localSerial = storage.trustless_cert_serial;

      if (!token) {
        showLoginView();
        return;
      }

      // Eagerly show the main view with loading states to prevent flicker
      showMainView();

      try {
        // Fetch current user details via Sanctum
        const response = await fetch(`${baseUrl}/api/reasons/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            chrome.storage.local.remove(['sanctumToken', 'gdriveToken']);
          }
          throw new Error('Unauthorized');
        }

        // Fetch user cert details
        const meRes = await fetch(`${baseUrl}/api/certificates/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        let activeCert = null;
        if (meRes.ok) {
          const data = await meRes.json();
          // API kini mengembalikan array sertifikat (multi-device)
          if (data.has_certificate && data.certificates && data.certificates.length > 0) {
            // Find the certificate that matches the local serial number
            if (localSerial) {
              activeCert = data.certificates.find(c => c.serial_number === localSerial);
            }
            // Fallback to first if local serial doesn't match any (e.g., revoked) or not set
            if (!activeCert) {
              // We actually shouldn't fallback to first if it's not our device!
              // Let's only set it if it matches local, otherwise the extension has no active cert.
              // However, to keep it backward compatible, if we don't have local serial but they have certs, let's just show no cert, they must import.
              // So no fallback! 
            }
          }
        }
        window.userHasCert = !!activeCert;

        // Auth successful: show dashboard and load components
        showMainView();
        updateCertStatus(activeCert);

        if (!activeCert) {
          const modal = document.getElementById('no-cert-modal');
          const btnOk = document.getElementById('btn-no-cert-ok');
          if (modal && btnOk) {
            modal.classList.add('visible');
            btnOk.onclick = () => {
              modal.classList.remove('visible');
              tabKeys.click();
            };
          }
        }

        loadReasons(baseUrl, token);
        if (typeof refreshImageSignatures === 'function') refreshImageSignatures();

        // Fetch user info from /api/user
        const userRes = await fetch(`${baseUrl}/api/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        let userNameText = "Authenticated User";
        let userEmailText = "TrustlessSign Member";
        let avatarUrl = "";

        if (userRes.ok) {
          const userData = await userRes.json();
          userNameText = userData.name || userNameText;
          userEmailText = userData.email || userEmailText;
          avatarUrl = userData.avatar || "";
        } else {
          userNameText = activeCert ? activeCert.subject_cn : userNameText;
        }

        // Set signer name default
        if (signerNameInput && !signerNameInput.value) {
          signerNameInput.value = userNameText;
        }

        // Update user profile with data - hide skeletons, show content
        const userNameTextEl = document.getElementById('user-name-text');
        const userNameSkeleton = document.getElementById('user-name-skeleton');
        const userEmailTextEl = document.getElementById('user-email-text');
        const userEmailSkeleton = document.getElementById('user-email-skeleton');
        const avatarSkeleton = document.getElementById('avatar-skeleton');

        if (userNameTextEl) {
          userNameTextEl.textContent = userNameText;
          userNameTextEl.classList.remove('hidden');
        }
        if (optSignerUser) {
          optSignerUser.textContent = `${userNameText} (${userEmailText})`;
        }
        if (userNameSkeleton) userNameSkeleton.classList.add('hidden');

        if (userEmailTextEl) {
          userEmailTextEl.textContent = userEmailText;
          userEmailTextEl.classList.remove('hidden');
        }
        if (userEmailSkeleton) userEmailSkeleton.classList.add('hidden');

        if (avatarSkeleton) avatarSkeleton.classList.add('hidden');

        if (avatarUrl) {
          userAvatar.style.backgroundImage = `url('${avatarUrl}')`;
          userAvatar.style.backgroundSize = "cover";
          userAvatar.style.backgroundPosition = "center";
        } else {
          userAvatar.style.backgroundImage = 'none';
        }

      } catch (err) {
        console.error('Auth check failed:', err);
        showLoginView();
      }
    });
  };

  const showLoginView = () => {
    viewLogin.classList.remove('hidden');
    viewMain.classList.add('hidden');
  };

  const showMainView = () => {
    viewLogin.classList.add('hidden');
    viewMain.classList.remove('hidden');
  };

  const setLoginStatus = (state, text) => {
    if (!loginStatus) return;
    if (state === 'clear') {
      loginStatus.innerHTML = '';
      return;
    }

    if (state === 'loading') {
      loginStatus.innerHTML = `
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: var(--surface-secondary); border-radius: 8px; border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 0.75rem; font-weight: 500; width: 100%;">
          <svg class="spin" style="width: 14px; height: 14px; color: var(--accent-primary);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span>${text}</span>
        </div>
      `;
    } else if (state === 'error') {
      loginStatus.innerHTML = `
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: var(--accent-danger-soft); border-radius: 8px; border: 1px dashed var(--accent-danger); color: var(--text-primary); font-size: 0.75rem; font-weight: 500; width: 100%;">
          <svg style="color: var(--accent-danger); width: 16px; height: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <span>${text}</span>
        </div>
      `;
    }
  };

  // Web-Only Login
  if (btnLoginWeb) {
    btnLoginWeb.addEventListener('click', () => {
      const baseUrl = loginUrlInput.value.replace(/\/$/, '');
      window.open(`${baseUrl}/login`, '_blank');
    });
  }

  // Logout
  btnLogout.addEventListener('click', () => {
    chrome.storage.local.remove(['sanctumToken', 'gdriveToken'], () => {
      showLoginView();
    });
  });

  // 3. Tab switching
  tabSign.addEventListener('click', () => {
    tabSign.classList.add('active');
    tabKeys.classList.remove('active');
    contentSign.classList.add('active');
    contentKeys.classList.remove('active');
  });

  tabKeys.addEventListener('click', () => {
    tabKeys.classList.add('active');
    tabSign.classList.remove('active');
    contentKeys.classList.add('active');
    contentSign.classList.remove('active');
  });

  // 4. Load Certificate Status UI
  const updateCertStatus = (activeCert) => {
    chrome.storage.local.get(['extensionLang'], (storage) => {
      const lang = storage.extensionLang || 'en';
      const trans = dictionary[lang] || dictionary.en;

      if (activeCert) {
        certStatusBadge.textContent = trans.cert_active;
        certStatusBadge.style.backgroundColor = "var(--accent-primary-soft)";
        certStatusBadge.style.color = "var(--accent-primary)";
        certExpiryText.innerHTML = `<strong>Device:</strong> ${activeCert.device_name || 'Unknown Device'}<br>${trans.cert_expires}: ${new Date(activeCert.expires_at).toLocaleDateString()}`;
        btnGenerateCert.textContent = trans.btn_regenerate;
      } else {
        certStatusBadge.textContent = trans.cert_none;
        certStatusBadge.style.backgroundColor = "var(--accent-danger-soft)";
        certStatusBadge.style.color = "var(--accent-danger)";
        certExpiryText.textContent = trans.cert_desc;
        btnGenerateCert.textContent = trans.btn_generate;
      }
    });
  };

  // 5. Generate Certificate handler
  btnGenerateCert.addEventListener('click', async () => {
    const password = keygenPasswordInput.value;
    const confirm = keygenConfirmInput.value;
    const deviceName = document.getElementById('keygen-device-name')?.value?.trim() || '';
    keysStatus.classList.add('hidden');

    if (password.length < 8) {
      showKeysError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      showKeysError("Passwords do not match.");
      return;
    }

    btnGenerateCert.disabled = true;
    btnGenerateCert.textContent = "Generating...";

    // Generate a stable device identifier (fingerprint) from browser+user context
    const deviceIdentifier = await generateDeviceIdentifier();

    chrome.storage.local.get(['sanctumToken', 'baseUrl'], async (storage) => {
      const token = storage.sanctumToken;
      const baseUrl = storage.baseUrl;

      try {
        // Send request directly to background worker
        chrome.runtime.sendMessage({
          type: 'GENERATE_KEY',
          payload: {
            password: password,
            email: userEmail.textContent.replace(/\s+/g, '').trim(),
            apiToken: token,
            deviceName: deviceName || 'This Device',
            deviceIdentifier: deviceIdentifier,
          }
        }, (res) => {
          btnGenerateCert.disabled = false;
          btnGenerateCert.textContent = "Generate Certificate";

          if (res && res.status === 'success') {
            keysStatus.classList.remove('hidden', 'alert-danger');
            keysStatus.classList.add('alert-success');

            let successMsg = `<strong>Success!</strong> Certificate generated and registered.`;
            if (res.driveSuccess && res.driveUrl) {
              successMsg += `<br>✅ Auto-backed up to your Google Drive.`;
              successMsg += `<div style="margin-top: 12px;"><button id="btnOpenDriveTsign" data-url="${res.driveUrl}" class="btn-primary" style="width: 100%;">📂 Open Google Drive Backup</button></div>`;
            } else if (res.tsignBase64) {
              successMsg += `<div style="margin-top: 12px;"><button id="btnDownloadTsign" class="btn-secondary" style="width: 100%;">⬇️ Download Local Backup (.tsign)</button></div>`;
            }

            keysStatus.innerHTML = successMsg;

            if (res.driveSuccess && res.driveUrl) {
              document.getElementById('btnOpenDriveTsign').addEventListener('click', (e) => {
                window.open(e.target.getAttribute('data-url'), '_blank');
              });
            } else if (res.tsignBase64) {
              document.getElementById('btnDownloadTsign').addEventListener('click', () => {
                const blob = base64ToBlob(res.tsignBase64, 'application/octet-stream');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = res.fileName || 'trustlesssign_backup.tsign';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }

            checkAuth();
          } else {
            showKeysError(res?.message || "Failed to generate certificate.");
          }
        });
      } catch (err) {
        showKeysError(err.message);
        btnGenerateCert.disabled = false;
      }
    });
  });

  const showKeysError = (msg) => {
    keysStatus.classList.remove('hidden', 'alert-success');
    keysStatus.classList.add('alert-danger');
    keysStatus.textContent = msg;
  };

  // ─── IDENTITY BACKUP: Export .tsign to Google Drive ───────────────────────
  const btnBackupDrive = document.getElementById('btn-backup-drive');
  const btnImportIdentity = document.getElementById('btn-import-identity');
  const importFileInput = document.getElementById('import-tsign-file');

  if (btnBackupDrive) {
    btnBackupDrive.addEventListener('click', async () => {
      chrome.storage.local.get(['trustless_private_key_enc', 'trustless_certificate', 'trustless_cert_serial', 'gdriveToken', 'trustless_email', 'trustless_device_name'], async (storage) => {
        if (!storage.trustless_private_key_enc || !storage.trustless_certificate) {
          showKeysError('No identity found on this device. Generate a certificate first.');
          return;
        }

        const password = await customPrompt('Identity Backup', 'Enter your Master Password to backup identity:');
        if (!password || password.length < 8) {
          showKeysError('Invalid Master Password.');
          return;
        }

        btnBackupDrive.disabled = true;
        btnBackupDrive.textContent = 'Encrypting...';

        try {
          const tsignBlob = await encryptIdentityToTsign({
            privateKey: storage.trustless_private_key_enc,
            certificate: storage.trustless_certificate,
            serialNumber: storage.trustless_cert_serial
          }, password);

          // Upload to Google Drive folder TrustLessSign/Certificated/
          if (storage.gdriveToken) {
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const safeEmail = (storage.trustless_email || 'user').split('@')[0].trim().replace(/[^a-zA-Z0-9]/g, '');
            const safeDeviceName = String(storage.trustless_device_name || 'Extension').trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            const fileName = `${safeDeviceName}_${safeEmail}-${dateStr}.tsign`;

            chrome.runtime.sendMessage({
              type: 'UPLOAD_IDENTITY',
              payload: { tsignBase64: btoa(String.fromCharCode(...new Uint8Array(tsignBlob))), fileName, gdriveToken: storage.gdriveToken }
            }, (res) => {
              if (res && res.status === 'success') {
                keysStatus.classList.remove('hidden', 'alert-danger');
                keysStatus.classList.add('alert-success');
                keysStatus.innerHTML = `✔ Identity backed up to Google Drive: ${fileName}`;
                if (res.gdriveUrl) {
                  keysStatus.innerHTML += `<div style="margin-top: 12px;"><button id="btnOpenManualDrive" data-url="${res.gdriveUrl}" class="btn-primary" style="width: 100%;">📂 Open in Google Drive</button></div>`;
                  setTimeout(() => {
                    const btn = document.getElementById('btnOpenManualDrive');
                    if (btn) btn.addEventListener('click', (e) => {
                      window.open(e.target.getAttribute('data-url'), '_blank');
                    });
                  }, 100);
                }
              } else {
                showKeysError('Failed to upload to Drive: ' + (res?.message || 'Unknown error'));
              }
            });
          } else {
            // Fallback: trigger local download if no Drive token
            const url = URL.createObjectURL(new Blob([tsignBlob], { type: 'application/octet-stream' }));
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const safeEmail = (storage.trustless_email || 'user').split('@')[0].trim().replace(/[^a-zA-Z0-9]/g, '');
            const safeDeviceName = String(storage.trustless_device_name || 'Extension').trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            const fileName = `${safeDeviceName}_${safeEmail}-${dateStr}.tsign`;
            chrome.downloads.download({ url, filename: fileName, saveAs: true });
            keysStatus.classList.remove('hidden', 'alert-danger');
            keysStatus.classList.add('alert-success');
            keysStatus.textContent = 'Identity downloaded locally (no Drive token found).';
          }
        } catch (err) {
          showKeysError('Backup failed: ' + err.message);
        } finally {
          btnBackupDrive.disabled = false;
          btnBackupDrive.textContent = 'Backup to Drive (.tsign)';
        }
      });
    });
  }

  // ─── IDENTITY IMPORT: Decrypt .tsign and restore to storage ───────────────
  if (btnImportIdentity) {
    btnImportIdentity.addEventListener('click', () => {
      importFileInput.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !file.name.endsWith('.tsign')) {
        showKeysError('Please select a valid .tsign file.');
        return;
      }

      const password = await customPrompt('Import Identity', 'Enter the Master Password used when this identity was created:');
      if (!password || password.length < 8) {
        showKeysError('Invalid Master Password.');
        return;
      }

      btnImportIdentity.disabled = true;
      btnImportIdentity.textContent = 'Importing...';

      try {
        const arrayBuf = await file.arrayBuffer();
        const identity = await decryptIdentityFromTsign(arrayBuf, password);

        // Restore identity to chrome.storage.local
        chrome.storage.local.set({
          'trustless_private_key_enc': identity.privateKey,
          'trustless_certificate': identity.certificate,
          'trustless_cert_serial': identity.serialNumber
        }, () => {
          keysStatus.classList.remove('hidden', 'alert-danger');
          keysStatus.classList.add('alert-success');
          keysStatus.textContent = '✔ Identity imported successfully! You can now sign documents.';
          // Refresh cert status
          checkAuth();
        });
      } catch (err) {
        showKeysError('Import failed: ' + err.message + ' (Wrong password or corrupted file?)');
      } finally {
        btnImportIdentity.disabled = false;
        btnImportIdentity.textContent = 'Import Identity (.tsign)';
        importFileInput.value = '';
      }
    });
  }

  // ─── IMAGE SIGNATURES MANAGEMENT ──────────────────────────────────────────
  const btnAddImageSig = document.getElementById('btn-add-image-signature');
  const uploadImgSigFile = document.getElementById('upload-image-signature-file');
  const imgSigList = document.getElementById('image-signatures-list');
  const imgSigLoading = document.getElementById('img-sig-loading');

  const refreshImageSignatures = async () => {
    chrome.storage.local.get(['default_image_signature_id', 'gdriveToken'], async (storage) => {
      imgSigLoading.style.display = 'inline-block';

      try {
        const files = await getAllImageSignaturesLocal();
        const defaultId = storage.default_image_signature_id;

        // Sync un-uploaded visual signatures to Drive in background
        if (storage.gdriveToken && typeof uploadImageSignature === 'function') {
          files.forEach(file => {
            if (!file.driveId) {
              const filename = file.name.includes('.') ? file.name : (file.name + (file.mimeType === 'image/png' ? '.png' : '.jpg'));
              uploadImageSignature(file.dataUrl, filename, file.mimeType, storage.gdriveToken)
                .then(uploadData => {
                  if (uploadData && uploadData.id) {
                    updateImageSignatureDriveIdLocal(file.id, uploadData.id).catch(e => console.error(e));
                  }
                }).catch(e => console.error("Drive sync error", e));
            }
          });
        }

        imgSigList.innerHTML = '';

        if (files.length === 0) {
          imgSigList.innerHTML = '<p style="grid-column: span 2; text-align: center; font-size: 0.75rem; color: var(--text-tertiary); padding: 12px;">No visual signatures uploaded yet.</p>';
        } else {
          files.forEach(file => {
            const isDefault = file.id === defaultId;
            const item = document.createElement('div');
            item.className = 'img-sig-item';
            item.id = `img-sig-item-${file.id}`;
            item.style.cssText = `
              border: 1px solid ${isDefault ? 'var(--accent-primary)' : 'var(--border-subtle)'};
              border-radius: 8px;
              padding: 4px;
              cursor: pointer;
              background: ${isDefault ? 'var(--accent-primary-soft)' : 'var(--surface-secondary)'};
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              transition: all 0.2s ease;
            `;

            item.innerHTML = `
              <div class="del-btn" style="position: absolute; top: 4px; left: 4px; width: 18px; height: 18px; background: rgba(0,0,0,0.6); color: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; z-index: 10;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <img src="${file.dataUrl}" alt="${file.name}" style="width: 100%; height: 50px; object-fit: contain; border-radius: 4px; background: white;">
              <span style="font-size: 0.65rem; margin-top: 4px; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;">${file.name}</span>
              ${isDefault ? '<div class="def-badge" style="position: absolute; top: -4px; right: -4px; background: var(--accent-primary); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; z-index: 10;"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' : ''}
            `;

            // Hover effects for delete button
            item.addEventListener('mouseenter', () => {
              const delBtn = item.querySelector('.del-btn');
              if (delBtn) delBtn.style.opacity = '1';
            });
            item.addEventListener('mouseleave', () => {
              const delBtn = item.querySelector('.del-btn');
              if (delBtn) delBtn.style.opacity = '0';
            });

            // Delete button click
            const delBtnEl = item.querySelector('.del-btn');
            if (delBtnEl) {
              delBtnEl.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this visual signature?')) {
                  item.style.opacity = '0.5';
                  try {
                    await deleteImageSignatureLocal(file.id);
                    chrome.storage.local.get(['default_image_signature_id'], (s) => {
                      if (s.default_image_signature_id === file.id) {
                        chrome.storage.local.remove('default_image_signature_id');
                      }
                    });
                    refreshImageSignatures();
                  } catch (err) {
                    item.style.opacity = '1';
                    alert('Error deleting: ' + err.message);
                  }
                }
              });
            }

            // Click to set as default - NO FLICKERING
            item.addEventListener('click', () => {
              chrome.storage.local.set({ 'default_image_signature_id': file.id }, () => {
                // Update DOM directly instead of reloading to prevent flickering
                document.querySelectorAll('.img-sig-item').forEach(el => {
                  el.style.border = '1px solid var(--border-subtle)';
                  el.style.background = 'var(--surface-secondary)';
                  const badge = el.querySelector('.def-badge');
                  if (badge) badge.remove();
                });

                item.style.border = '1px solid var(--accent-primary)';
                item.style.background = 'var(--accent-primary-soft)';
                item.insertAdjacentHTML('beforeend', '<div class="def-badge" style="position: absolute; top: -4px; right: -4px; background: var(--accent-primary); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; z-index: 10;"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>');
              });
            });

            // Double click to delete
            item.addEventListener('dblclick', async (e) => {
              e.stopPropagation();
              if (confirm('Delete this image signature?')) {
                item.style.opacity = '0.5';
                try {
                  await deleteImageSignatureLocal(file.id);
                  if (isDefault) {
                    chrome.storage.local.remove('default_image_signature_id');
                  }
                  refreshImageSignatures(); // Full refresh is ok for deletion

                  // Background delete from Google Drive
                  if (file.driveId) {
                    chrome.storage.local.get(['gdriveToken'], (st) => {
                      if (st.gdriveToken && typeof deleteImageSignature === 'function') {
                        deleteImageSignature(file.driveId, st.gdriveToken).catch(err => console.error("Drive delete error", err));
                      }
                    });
                  }
                } catch (e) {
                  showKeysError('Failed to delete image: ' + e.message);
                  item.style.opacity = '1';
                }
              }
            });

            imgSigList.appendChild(item);
          });
        }
      } catch (err) {
        imgSigList.innerHTML = `
          <div style="grid-column: span 2; display: flex; flex-direction: column; align-items: center; padding: 16px 8px; background: var(--accent-danger-soft); border-radius: 8px; border: 1px dashed var(--accent-danger);">
            <svg style="color: var(--accent-danger); margin-bottom: 8px;" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-primary);">Failed to load signatures</span>
            <span style="font-size: 0.65rem; color: var(--text-secondary); text-align: center; margin-top: 4px;">Could not retrieve visual signatures from local storage.</span>
          </div>
        `;
      } finally {
        imgSigLoading.style.display = 'none';
      }
    });
  };

  if (btnAddImageSig) {
    btnAddImageSig.addEventListener('click', () => {
      uploadImgSigFile.click();
    });
  }

  if (uploadImgSigFile) {
    uploadImgSigFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        showKeysError('Image size must be less than 25MB.');
        return;
      }

      btnAddImageSig.disabled = true;
      btnAddImageSig.innerHTML = '<svg class="spinner" style="width: 14px; height: 14px; margin-right: 8px; color: currentColor;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...';

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const id = crypto.randomUUID();
            const fileName = `Signature_${new Date().getTime()}`;
            const res = await saveImageSignatureLocal(id, fileName, file.type, reader.result);

            // If it's the first one, set as default
            chrome.storage.local.get(['default_image_signature_id', 'gdriveToken'], (st) => {
              if (!st.default_image_signature_id) {
                chrome.storage.local.set({ 'default_image_signature_id': id }, () => refreshImageSignatures());
              } else {
                refreshImageSignatures();
              }

              // Background sync to Google Drive
              if (st.gdriveToken && typeof uploadImageSignature === 'function') {
                uploadImageSignature(reader.result, fileName + (file.type === 'image/png' ? '.png' : '.jpg'), file.type, st.gdriveToken)
                  .then(uploadData => {
                    if (uploadData && uploadData.id) {
                      updateImageSignatureDriveIdLocal(id, uploadData.id).catch(err => console.error("Update Drive ID error", err));
                    }
                  })
                  .catch(err => console.error("Drive sync error", err));
              }
            });
          } catch (err) {
            showKeysError('Failed to save image locally: ' + err);
          } finally {
            btnAddImageSig.disabled = false;
            btnAddImageSig.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Upload New Image';
            uploadImgSigFile.value = '';
          }
        };
        reader.readAsDataURL(file);
      } catch (e) {
        showKeysError('Failed to read file.');
        btnAddImageSig.disabled = false;
        btnAddImageSig.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Upload New Image';
      }
    });
  }

  // Determine language based on browser UI locale
  const getLangCode = () => {
    const uiLang = (chrome.i18n.getUILanguage() || 'en').toLowerCase();
    if (uiLang.startsWith('id')) return 'id';
    if (uiLang.startsWith('th')) return 'th';
    return 'en';
  };
  const langCode = getLangCode();

  // 6. Load Reason Dropdowns
  const loadReasons = async (baseUrl, token) => {
    try {
      const response = await fetch(`${baseUrl}/api/reasons/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        reasonsCategories = await response.json();
        reasonContainer.classList.remove('hidden');

        // Populate Categories
        categorySelect.innerHTML = '';
        reasonsCategories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = langCode === 'id' ? cat.name_id : langCode === 'th' ? cat.name_th : cat.name_en;
          categorySelect.appendChild(opt);
        });

        // Trigger Subcategory update
        updateSubcategories();
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const updateSubcategories = () => {
    const selectedCatId = categorySelect.value;
    const cat = reasonsCategories.find(c => c.id.toString() === selectedCatId);

    const placeholderText = langCode === 'id' ? '-- Pilih Alasan --' : langCode === 'th' ? '-- เลือกเหตุผล --' : '-- Select Reason --';
    subcategorySelect.innerHTML = `<option value="">${placeholderText}</option>`;
    if (cat && cat.sub_categories) {
      cat.sub_categories.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = langCode === 'id' ? sub.reason_text_id : langCode === 'th' ? sub.reason_text_th : sub.reason_text_en;
        subcategorySelect.appendChild(opt);
      });
    }
  };

  categorySelect.addEventListener('change', updateSubcategories);

  // 7. PDF Upload and Preview Rendering
  const btnPagePrev = document.getElementById('btn-page-prev');
  const btnPageNext = document.getElementById('btn-page-next');
  const pageIndicator = document.getElementById('page-indicator');
  const inputPageGoto = document.getElementById('input-page-goto');
  const paginationControls = document.getElementById('pdf-pagination-controls');

  const renderPdfPage = async (pageNum) => {
    if (!currentLoadedPdf) return;
    try {
      const page = await currentLoadedPdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.6 }); // Scale down for preview
      const context = pdfCanvas.getContext('2d');
      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      // Save sizes
      pdfPageWidthPoints = viewport.width;
      pdfPageHeightPoints = viewport.height;

      // Reset QR Position when page changes
      qrDragBox.style.top = '10px';
      qrDragBox.style.left = '10px';
      qrX = 10;
      qrY = 10;

      // Size adjustment for drag box based on scale
      const canvasRect = pdfCanvas.getBoundingClientRect();
      if (canvasRect.width > 0) {
        const displayScale = 600 / canvasRect.width;
        let isQrCode = (signatureTypeSelect ? signatureTypeSelect.value === 'qr' : true);
        qrDragBox.style.width = `${(isQrCode ? 72 : 115) / displayScale}px`;
        qrDragBox.style.height = `${(isQrCode ? 46 : 76) / displayScale}px`;
      }

      // Update UI
      currentPageNumber = pageNum;
      if (inputPageGoto) {
        inputPageGoto.value = pageNum;
        inputPageGoto.max = currentPdfNumPages;
      }
      const pageIndicatorTotal = document.getElementById('page-indicator-total');
      if (pageIndicatorTotal) {
        pageIndicatorTotal.textContent = currentPdfNumPages;
      }
      if (btnPagePrev) btnPagePrev.disabled = (pageNum <= 1);
      if (btnPageNext) btnPageNext.disabled = (pageNum >= currentPdfNumPages);

    } catch (err) {
      console.error('Failed to render PDF page:', err);
    }
  };

  if (btnPagePrev) {
    btnPagePrev.addEventListener('click', () => {
      if (currentPageNumber > 1) {
        renderPdfPage(currentPageNumber - 1);
      }
    });
  }

  if (btnPageNext) {
    btnPageNext.addEventListener('click', () => {
      if (currentPageNumber < currentPdfNumPages) {
        renderPdfPage(currentPageNumber + 1);
      }
    });
  }

  if (inputPageGoto) {
    const handleGoto = (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1 && val <= currentPdfNumPages && val !== currentPageNumber) {
        renderPdfPage(val);
      } else {
        e.target.value = currentPageNumber;
      }
    };
    inputPageGoto.addEventListener('change', handleGoto);
    inputPageGoto.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGoto(e);
      }
    });
  }

  signFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      previewContainer.classList.add('hidden');
      if (paginationControls) paginationControls.classList.add('hidden');
      if (signatureTypeContainer) signatureTypeContainer.classList.add('hidden');
      if (signerModeContainer) signerModeContainer.classList.add('hidden');
      if (signerNameContainer) signerNameContainer.classList.add('hidden');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
      currentFileBytes = this.result;
      const pdfUint8 = new Uint8Array(currentFileBytes.slice(0));

      previewContainer.classList.remove('hidden');
      if (signatureTypeContainer) signatureTypeContainer.classList.remove('hidden');
      if (signerModeContainer) signerModeContainer.classList.remove('hidden');
      if (signerModeSelect && signerModeSelect.value === 'custom') {
        if (signerNameContainer) signerNameContainer.classList.remove('hidden');
      } else {
        if (signerNameContainer) signerNameContainer.classList.add('hidden');
      }
      signSuccessCard.classList.add('hidden');

      // reset signature type preview
      if (signatureTypeSelect) {
        if (signatureTypeSelect.value === 'image') {
          // manually trigger change event if it's already image
          signatureTypeSelect.dispatchEvent(new Event('change'));
        } else {
          if (qrDragImg) qrDragImg.classList.add('hidden');
          if (qrDragText) qrDragText.classList.remove('hidden');
        }
      }

      // Load and render PDF using PDFJS
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfUint8 });
        currentLoadedPdf = await loadingTask.promise;
        currentPdfNumPages = currentLoadedPdf.numPages;

        if (paginationControls) {
          if (currentPdfNumPages > 1) {
            paginationControls.classList.remove('hidden');
          } else {
            paginationControls.classList.add('hidden');
          }
        }

        await renderPdfPage(1);

      } catch (err) {
        console.error('Failed to load PDF:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // ─── QR DRAG + RESIZE ──────────────────────────────────────────────────────
  let isDragging = false;
  let isResizing = false;
  let startX = 0, startY = 0;
  let resizeStartW = 0, resizeStartH = 0;

  // Create resize handle (SE corner)
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'qr-resize-handle';
  resizeHandle.style.cssText = [
    'position:absolute',
    'bottom:-5px',
    'right:-5px',
    'width:14px',
    'height:14px',
    'background:var(--accent-primary)',
    'border:2px solid var(--surface-primary)',
    'border-radius:3px',
    'cursor:se-resize',
    'z-index:20',
    'opacity:0.85',
    'transition:opacity 0.2s'
  ].join(';');
  qrDragBox.appendChild(resizeHandle);

  // Drag: mousedown on qrDragBox (not on resize handle)
  qrDragBox.addEventListener('mousedown', (e) => {
    if (e.target === resizeHandle) return; // handled by resize
    isDragging = true;
    const rect = qrDragBox.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    e.preventDefault();
  });

  // Resize: mousedown on resize handle
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    resizeStartW = qrDragBox.offsetWidth;
    resizeStartH = qrDragBox.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const containerRect = previewContainer.getBoundingClientRect();
      let left = e.clientX - containerRect.left - startX;
      let top = e.clientY - containerRect.top - startY;

      // Boundary constraints
      left = Math.max(0, Math.min(left, containerRect.width - qrDragBox.offsetWidth));
      top = Math.max(0, Math.min(top, containerRect.height - qrDragBox.offsetHeight));

      qrDragBox.style.left = `${left}px`;
      qrDragBox.style.top = `${top}px`;

      // Map to canvas relative points
      const canvasRect = pdfCanvas.getBoundingClientRect();
      qrX = left - canvasRect.left + containerRect.left;
      qrY = top - canvasRect.top + containerRect.top;
    }

    if (isResizing) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newW = Math.max(30, resizeStartW + dx);
      const newH = Math.max(20, resizeStartH + dy);
      qrDragBox.style.width = `${newW}px`;
      qrDragBox.style.height = `${newH}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });

  if (signerModeSelect) {
    signerModeSelect.addEventListener('change', () => {
      if (signerModeSelect.value === 'custom') {
        if (signerNameContainer) signerNameContainer.classList.remove('hidden');
      } else {
        if (signerNameContainer) signerNameContainer.classList.add('hidden');
      }
    });
  }

  if (signatureTypeSelect) {
    signatureTypeSelect.addEventListener('change', async (e) => {
      const type = e.target.value;
      if (type === 'image') {
        chrome.storage.local.get(['default_image_signature_id'], async (storage) => {
          if (!storage.default_image_signature_id) {
            alert('Please upload a visual signature first.');
            signatureTypeSelect.value = 'qr';
            if (qrDragImg) qrDragImg.classList.add('hidden');
            if (qrDragText) qrDragText.classList.remove('hidden');
            tabKeys.click();
          } else {
            try {
              const imgSig = await getImageSignatureLocal(storage.default_image_signature_id);
              if (imgSig && imgSig.dataUrl) {
                if (qrDragImg) {
                  qrDragImg.src = imgSig.dataUrl;
                  qrDragImg.classList.remove('hidden');
                }
                if (qrDragText) qrDragText.classList.add('hidden');
              } else {
                throw new Error("Not found");
              }
            } catch (err) {
              alert('Failed to load visual signature. Please re-upload.');
              signatureTypeSelect.value = 'qr';
              if (qrDragImg) qrDragImg.classList.add('hidden');
              if (qrDragText) qrDragText.classList.remove('hidden');
            }
          }
        });
      } else {
        if (qrDragImg) qrDragImg.classList.add('hidden');
        if (qrDragText) qrDragText.classList.remove('hidden');
      }

      // Update visual size of drag box
      const canvasRect = pdfCanvas.getBoundingClientRect();
      if (canvasRect.width > 0) {
        const displayScale = 600 / canvasRect.width;
        let isQrCode = (type === 'qr');
        qrDragBox.style.width = `${(isQrCode ? 72 : 115) / displayScale}px`;
        qrDragBox.style.height = `${(isQrCode ? 46 : 76) / displayScale}px`;
      }
    });
  }

  // 8. Sign and Seal Submit
  btnSignSubmit.addEventListener('click', async () => {
    const file = signFileInput.files[0];
    const password = signPasswordInput.value;
    signStatus.classList.add('hidden');

    if (!window.userHasCert) {
      showSignError('Please generate a certificate in the Keys & Cert tab first.');
      return;
    }
    if (!file) {
      showSignError('Please upload a PDF file.');
      return;
    }
    if (!password) {
      showSignError('Please enter your Master Password.');
      return;
    }

    // Toggle progress overlay
    updateProgress('DOWNLOADING', 15);

    let uploadInterval;
    chrome.storage.local.get(['sanctumToken', 'gdriveToken', 'baseUrl', 'trustless_cert_serial'], async (storage) => {
      const token = storage.sanctumToken;
      const gdriveToken = storage.gdriveToken;
      const baseUrl = storage.baseUrl;
      const localSerial = storage.trustless_cert_serial;

      if (!localSerial) {
        progressOverlay.classList.add('hidden');
        showSignError('No certificate found in extension. Please generate or import a certificate first.');
        return;
      }

      try {
        // === [BARU] Pre-Sign Cert Validation (Trustless) ===
        const syncRes = await fetch(`${baseUrl}/certificates/sync-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ serial_number: localSerial })
        });
        const syncData = await syncRes.json();

        if (!syncData.active) {
          progressOverlay.classList.add('hidden');
          const msg = syncData.is_revoked
            ? 'Your certificate has been revoked. Please generate a new certificate from the Dashboard.'
            : 'Your certificate is no longer valid. Please check your Keys & Cert tab.';
          showSignError(msg);
          return;
        }
        // === [END] Pre-Sign Cert Validation ===
      } catch (e) {
        progressOverlay.classList.add('hidden');
        showSignError('Could not verify certificate status with the server. Check your connection.');
        return;
      }

      try {
        // Read file to base64
        const fileBase64 = arrayBufferToBase64(currentFileBytes);

        // Generate QR code base64 locally in popup using qrious
        const verifyToken = crypto.randomUUID();
        const verifyUrl = `${baseUrl}/verify/${verifyToken}`;
        const shortId = `TLS-${verifyToken.substring(0, 8).toUpperCase()}`;

        let uploadedImageBase64 = null;
        let isQrCode = (signatureTypeSelect ? signatureTypeSelect.value === 'qr' : true);

        if (!isQrCode) {
          const st = await chrome.storage.local.get('default_image_signature_id');
          if (st.default_image_signature_id) {
            try {
              const imgSig = await getImageSignatureLocal(st.default_image_signature_id);
              if (imgSig && imgSig.dataUrl) {
                uploadedImageBase64 = imgSig.dataUrl;
              } else {
                isQrCode = true;
              }
            } catch (err) {
              console.error("Error loading image signature", err);
              isQrCode = true;
            }
          } else {
            isQrCode = true;
          }
        }

        let signerName = '';
        if (signerModeSelect && signerModeSelect.value === 'custom') {
          signerName = signerNameInput ? signerNameInput.value.trim() : "";
        } else {
          signerName = document.getElementById('user-name-text').textContent || 'TrustlessSign User';
        }

        if (signerName === 'Authenticated User' || !signerName) {
          const certData = await fetch(`${baseUrl}/api/certificates/me`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          }).then(r => r.json()).catch(() => null);
          if (certData && certData.certificates && certData.certificates.length > 0) {
            const activeCert = certData.certificates.find(c => c.serial_number === localSerial);
            if (activeCert) signerName = activeCert.subject_cn;
          }
        }

        let qrPng;
        if (isQrCode) {
          qrPng = await window.generateModernTSignQR(verifyUrl, optHideFrame);
        } else {
          qrPng = await window.generateSignatureFrame(
            signerName,
            shortId,
            verifyUrl,
            uploadedImageBase64,
            false,
            "Signed by:",
            "Verifikasi di:",
            optHideFrame
          );
        }

        // Compile final reason text
        const selectedSubId = subcategorySelect.value;
        const allSubcategories = reasonsCategories.reduce((acc, cat) => {
          if (cat.sub_categories) {
            return acc.concat(cat.sub_categories);
          }
          return acc;
        }, []);
        const subCategory = allSubcategories.find(s => s.id.toString() === selectedSubId);
        const subText = subCategory ? subCategory.reason_text_id : '';
        const detailText = customReasonText.value;
        const reasonFinal = subText && detailText ? `${subText}: ${detailText}`
          : subText ? subText
            : detailText ? detailText
              : 'Digital Verification';

        // Wait a bit to simulate connecting
        await new Promise(r => setTimeout(r, 1000));
        updateProgress('STAMPING', 45);
        await new Promise(r => setTimeout(r, 800));

        // Start upload simulation
        updateProgress('UPLOADING', 55);
        let uploadPct = 55;
        uploadInterval = setInterval(() => {
          if (uploadPct < 90) {
            uploadPct += Math.floor(Math.random() * 8) + 2;
            updateProgress('UPLOADING', uploadPct);
          } else {
            clearInterval(uploadInterval);
          }
        }, 300);

        // Map coordinates from preview to page size points (scaled to exactly 600px width standard, keeping aspect ratio)
        const canvasRect = pdfCanvas.getBoundingClientRect();
        const displayScale = 600 / canvasRect.width;
        const relativeX = qrX * displayScale;
        const relativeY = qrY * displayScale;

        const now = new Date();
        const timestamp = now.getFullYear() + '.' +
          String(now.getMonth() + 1).padStart(2, '0') + '.' +
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') + '-' +
          String(now.getMinutes()).padStart(2, '0') + '-' +
          String(now.getSeconds()).padStart(2, '0');
        finalFileName = `signed_ext_${timestamp}-${file.name}`;

        const pageStamps = [];
        // if (currentPdfNumPages > 1) {
        for (let i = 1; i <= currentPdfNumPages; i++) {
          const stampStr = await window.generatePageStamp(shortId, i, currentPdfNumPages, timestamp);
          pageStamps.push(stampStr);
        }
        // }

        // console.log("[DEBUG] Hide Frame:", optHideFrame);
        // console.log("[DEBUG] Sealed Enabled:", optSealedEnabled, sealedPermsState);

        // Build footer prefix based on current language
        const currentLangCode = langSelect ? langSelect.value : langCode;
        const footerTranslationsExt = {
          en: "This document has been electronically signed. To Verify visit: ",
          id: "Dokumen ini ditandatangani secara elektronik. Verifikasi di: ",
          th: "เอกสารนี้ได้รับการลงนามทางอิเล็กทรอนิกส์แล้ว ตรวจสอบได้ที่: "
        };
        const footerPrefix = footerTranslationsExt[currentLangCode] || footerTranslationsExt.en;

        // Build the short verify base URL from baseUrl
        const verifyUrlShort = `${baseUrl}/verify`;

        // Call background worker to sign & upload
        chrome.runtime.sendMessage({
          type: 'SIGN_DOCUMENT',
          payload: {
            pdfBase64: fileBase64,
            filename: finalFileName,
            pageStamps: pageStamps,
            gdriveToken: gdriveToken,
            apiToken: token,
            qrPosition: {
              page: currentPageNumber,
              x: relativeX,
              y: relativeY,
              size: isQrCode ? 72 : 115
            },
            reason_sub_category_id: selectedSubId ? parseInt(selectedSubId) : null,
            reason_final: reasonFinal,
            notes: reasonNotesText.value,
            password: password,
            qrPngBase64: qrPng,
            verifyToken: verifyToken,
            footerPrefix: footerPrefix,
            verifyUrlShort: verifyUrlShort,
            hideFrame: optHideFrame,
            sealedPerms: optSealedEnabled ? { ...sealedPermsState } : null,
            signerName: signerName
          }
        }, (res) => {
          clearInterval(uploadInterval);

          if (res && (res.status === 'success' || res.status === 'warning')) {
            updateProgress('SUCCESS', 100);
            signedPdfBase64 = res.pdfBase64;

            setTimeout(() => {
              progressOverlay.style.display = 'none';

              if (res.status === 'warning') {
                const successTitle = document.querySelector('#sign-success-card h4');
                const successDesc = document.querySelector('#sign-success-card p');
                if (successTitle) {
                  successTitle.textContent = "Saved Locally";
                  successTitle.style.color = "var(--accent-warning)";
                }
                if (successDesc) {
                  successDesc.textContent = res.message || "Google Drive upload failed. File saved locally.";
                }
              }
              const btnViewDrive = document.getElementById('btn-view-drive');
              if (res.gdriveUrl) {
                btnViewDrive.href = res.gdriveUrl;
                btnViewDrive.classList.remove('hidden');
              } else {
                btnViewDrive.classList.add('hidden');
              }
              signSuccessCard.classList.remove('hidden');
            }, 1200);
          } else {
            progressOverlay.style.display = 'none';
            console.error("Signing failed:", res?.message || "Document signing failed.");
            showSignError(res?.message || "Document signing failed.");
          }
        });

      } catch (err) {
        if (uploadInterval) clearInterval(uploadInterval);
        progressOverlay.style.display = 'none';
        console.error("Signing error:", err);
      }
    });
  });

  const showSignError = (msg) => {
    signStatus.classList.remove('hidden');
    signStatus.textContent = msg;
  };

  // Custom Promise-based prompt modal
  const customPrompt = (title, desc) => {
    return new Promise((resolve) => {
      const modal = document.getElementById('password-prompt-modal');
      const titleEl = document.getElementById('pwd-prompt-title');
      const descEl = document.getElementById('pwd-prompt-desc');
      const inputEl = document.getElementById('pwd-prompt-input');
      const btnSubmit = document.getElementById('btn-pwd-prompt-submit');
      const btnCancel = document.getElementById('btn-pwd-prompt-cancel');

      titleEl.textContent = title;
      descEl.textContent = desc;
      inputEl.value = '';
      inputEl.type = 'password';
      modal.classList.add('visible');
      setTimeout(() => inputEl.focus(), 100);

      const cleanup = () => {
        modal.classList.remove('visible');
        btnSubmit.removeEventListener('click', onSubmit);
        btnCancel.removeEventListener('click', onCancel);
        inputEl.removeEventListener('keydown', onKeydown);
      };

      const onSubmit = () => {
        resolve(inputEl.value);
        cleanup();
      };

      const onCancel = () => {
        resolve(null);
        cleanup();
      };

      const onKeydown = (e) => {
        if (e.key === 'Enter') onSubmit();
        if (e.key === 'Escape') onCancel();
      };

      btnSubmit.addEventListener('click', onSubmit);
      btnCancel.addEventListener('click', onCancel);
      inputEl.addEventListener('keydown', onKeydown);
    });
  };

  // Helper function to update progress overlay
  const updateProgress = (stage, pct) => {
    progressOverlay.style.display = 'flex';
    progressBar.style.width = `${pct}%`;
    progressPct.textContent = `${pct}%`;

    const isIndo = langCode === 'id';
    const isThai = langCode === 'th';

    const tProgress = {
      downloading: isIndo ? "Membaca berkas asli dari Google Drive..." : isThai ? "กำลังอ่านไฟล์ต้นฉบับจาก Google Drive..." : "Reading original file from Google Drive...",
      stamping: isIndo ? "Menyisipkan tanda tangan kriptografi & QR Code..." : isThai ? "กำลังฝังลายเซ็นเข้ารหัสและ QR Code..." : "Embedding cryptographic signature & QR Code...",
      uploading: isIndo ? "Mengunggah dokumen ter-stamp kembali ke Google Drive..." : isThai ? "กำลังอัปโหลดเอกสารที่ประทับตรากลับไปยัง Google Drive..." : "Uploading stamped document back to Google Drive...",
      success: isIndo ? "Sukses! Mencatat URL dokumen ter-stamp ke server TrustlessSign." : isThai ? "สำเร็จ! บันทึก URL เอกสารที่ประทับตราไปยังเซิร์ฟเวอร์ TrustlessSign เรียบร้อยแล้ว" : "Success! Recorded stamped document URL to TrustlessSign server.",
      title: isIndo ? "Memproses Dokumen Berkas..." : isThai ? "กำลังประมวลผลเอกสาร..." : "Processing Document...",
      step1: isIndo ? "Membaca berkas asli dari Google Drive" : isThai ? "อ่านไฟล์ต้นฉบับจาก Google Drive" : "Read original file from Google Drive",
      step2: isIndo ? "Menyisipkan tanda tangan kriptografi & QR Code" : isThai ? "ฝังลายเซ็นเข้ารหัสและ QR Code" : "Embed cryptographic signature & QR Code",
      step3: isIndo ? "Mengunggah dokumen ter-stamp kembali ke Google Drive" : isThai ? "อัปโหลดเอกสารที่ประทับตรากลับไปยัง Google Drive" : "Upload stamped document back to Google Drive"
    };

    // Update progress overlay title dynamically
    const titleEl = progressOverlay.querySelector('h4');
    if (titleEl) {
      titleEl.textContent = tProgress.title;
    }

    // Map stages
    const steps = {
      'DOWNLOADING': { text: tProgress.downloading, elements: [stepDownload] },
      'STAMPING': { text: tProgress.stamping, elements: [stepDownload, stepStamp] },
      'UPLOADING': { text: tProgress.uploading, elements: [stepDownload, stepStamp, stepUpload] },
      'SUCCESS': { text: tProgress.success, elements: [stepDownload, stepStamp, stepUpload] }
    };

    const currentStep = steps[stage];
    if (currentStep) {
      progressDesc.textContent = currentStep.text;

      const stepNames = {
        'step-download': tProgress.step1,
        'step-stamp': tProgress.step2,
        'step-upload': tProgress.step3
      };

      // Reset icons and texts
      ['step-download', 'step-stamp', 'step-upload'].forEach(id => {
        const el = document.getElementById(id);
        const iconEl = el.querySelector('.step-icon');
        const textEl = el.querySelector('.step-text');

        iconEl.innerHTML = '⏳';
        textEl.textContent = stepNames[id];
        textEl.style.color = 'var(--text-tertiary)';
        textEl.style.fontWeight = 'normal';
      });

      currentStep.elements.forEach((el, idx) => {
        const iconEl = el.querySelector('.step-icon');
        const textEl = el.querySelector('.step-text');

        if (idx === currentStep.elements.length - 1 && stage !== 'SUCCESS') {
          iconEl.innerHTML = '<span class="spin">🔄</span>';
          textEl.style.color = 'var(--text-primary)';
          textEl.style.fontWeight = 'bold';
          if (el.id === 'step-upload') {
            textEl.textContent = `${tProgress.step3} (${pct}%)`;
          }
        } else {
          iconEl.innerHTML = '✔️';
          textEl.style.color = 'var(--text-secondary)';
          textEl.style.fontWeight = 'normal';
        }
      });
    }
  };

  // Download signed PDF local trigger
  btnDownloadSigned.addEventListener('click', () => {
    if (!signedPdfBase64) return;
    const file = signFileInput.files[0];

    // Convert base64 to blob to ensure filename is respected by chrome.downloads API
    const byteCharacters = atob(signedPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: blobUrl,
      filename: finalFileName,
      saveAs: true
    }, () => {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    });
  });

  // Initial Theme, Language and Auth checks
  initTheme();
  initLanguage();
  checkAuth();

  // Footer Setup
  try {
    const manifest = chrome.runtime.getManifest();
    if (extensionVersion) {
      extensionVersion.textContent = manifest.version_name || manifest.version;
    }
  } catch (e) {
    console.error('Error fetching manifest:', e);
  }

  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://saweria.co/vnot01' });
    });
  }

  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    });
  }

  if (termsBtn) {
    termsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('terms.html') });
    });
  }

  // Password Visibility Toggle
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
        } else {
          input.type = 'password';
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
      }
    });
  });
});



// ─── DEVICE IDENTIFIER ─────────────────────────────────────────────────────────
// Generates a stable, non-tracking pseudo-fingerprint from browser context
async function generateDeviceIdentifier() {
  const rawData = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(rawData));
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
}
