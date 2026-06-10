// popup.js for TrustlessSign Extension (Manifest V3)

document.addEventListener('DOMContentLoaded', async () => {
  const bodyEl = document.body;
  const btnPopout = document.getElementById('btn-popout');
  const viewLogin = document.getElementById('view-login');
  const viewMain = document.getElementById('view-main');
  
  // Login fields
  const loginUrlInput = document.getElementById('login-url');
  const btnLoginGoogle = document.getElementById('btn-google-login') || document.getElementById('btn-login-google');
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

  // Shared state variables
  let currentFileBytes = null;
  let pdfPageWidthPoints = 600;
  let pdfPageHeightPoints = 800;
  let qrX = 10;
  let qrY = 10;
  let signedPdfBase64 = null;
  let reasonsCategories = [];

  // Setup PDFjs
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';

  // 1. Detect Popout View
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('popout') === 'true') {
    bodyEl.classList.remove('popup-view');
    btnPopout.classList.add('hidden'); // Hide popout button in popout view
  }

  // Popout click listener
  btnPopout.addEventListener('click', () => {
    const width = 450;
    const height = 700;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html?popout=true'),
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top
    }, () => {
      window.close();
    });
  });

  // 2. Check Auth Status
  const checkAuth = async () => {
    chrome.storage.local.get(['sanctumToken', 'gdriveToken', 'baseUrl'], async (storage) => {
      const token = storage.sanctumToken;
      const baseUrl = storage.baseUrl || loginUrlInput.value;

      if (!token) {
        showLoginView();
        return;
      }

      try {
        // Fetch current user details via Sanctum
        const response = await fetch(`${baseUrl}/api/reasons/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        // Fetch user cert details
        const meRes = await fetch(`${baseUrl}/api/certificates/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let activeCert = null;
        if (meRes.ok) {
          activeCert = await meRes.json();
        }

        // Auth successful: show dashboard and load components
        showMainView();
        updateCertStatus(activeCert);
        loadReasons(baseUrl, token);

        // Fetch user info from Google GDrive or fallback
        userName.textContent = activeCert ? activeCert.subject_cn : "Authenticated User";
        userEmail.textContent = "TrustlessSign Member";

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

  // Google Login via launchWebAuthFlow
  btnLoginGoogle.addEventListener('click', () => {
    const baseUrl = loginUrlInput.value.replace(/\/$/, '');
    const redirectUrl = chrome.identity.getRedirectURL();

    loginStatus.textContent = "Connecting to Google...";

    const authUrl = `${baseUrl}/auth/google/redirect?redirect_to_extension=${encodeURIComponent(redirectUrl)}`;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (callbackUrl) => {
      if (chrome.runtime.lastError || !callbackUrl) {
        console.error(chrome.runtime.lastError);
        loginStatus.textContent = "Google Sign-in failed.";
        return;
      }

      try {
        const url = new URL(callbackUrl);
        const token = url.searchParams.get('token');
        const gdriveToken = url.searchParams.get('gdrive_token');

        if (token) {
          chrome.storage.local.set({
            sanctumToken: token,
            gdriveToken: gdriveToken,
            baseUrl: baseUrl
          }, () => {
            loginStatus.textContent = "";
            checkAuth();
          });
        } else {
          loginStatus.textContent = "Tokens not found in callback.";
        }
      } catch (e) {
        console.error(e);
        loginStatus.textContent = "Error parsing login redirect.";
      }
    });
  });

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
    if (activeCert) {
      certStatusBadge.textContent = "CERTIFICATE ACTIVE";
      certStatusBadge.style.backgroundColor = "var(--accent-primary-soft)";
      certStatusBadge.style.color = "var(--accent-primary)";
      certExpiryText.textContent = `Expires: ${new Date(activeCert.expires_at).toLocaleDateString()}`;
      btnGenerateCert.textContent = "Re-generate / Replace Certificate";
    } else {
      certStatusBadge.textContent = "NO CERTIFICATE FOUND";
      certStatusBadge.style.backgroundColor = "var(--accent-danger-soft)";
      certStatusBadge.style.color = "var(--accent-danger)";
      certExpiryText.textContent = "Please generate a secure cryptographic key below.";
      btnGenerateCert.textContent = "Generate Certificate";
    }
  };

  // 5. Generate Certificate handler
  btnGenerateCert.addEventListener('click', async () => {
    const password = keygenPasswordInput.value;
    const confirm = keygenConfirmInput.value;
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

    chrome.storage.local.get(['sanctumToken', 'baseUrl'], async (storage) => {
      const token = storage.sanctumToken;
      const baseUrl = storage.baseUrl;

      try {
        // Send request directly to background worker
        chrome.runtime.sendMessage({
          type: 'GENERATE_KEY',
          payload: {
            password: password,
            email: userEmail.textContent,
            apiToken: token
          }
        }, (res) => {
          btnGenerateCert.disabled = false;
          btnGenerateCert.textContent = "Generate Certificate";

          if (res && res.status === 'success') {
            keysStatus.classList.remove('hidden', 'alert-danger');
            keysStatus.classList.add('alert-success');
            keysStatus.textContent = "Success! Certificate generated and registered.";
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
        headers: { 'Authorization': `Bearer ${token}` }
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
  signFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      previewContainer.classList.add('hidden');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function() {
      currentFileBytes = this.result;
      const pdfUint8 = new Uint8Array(currentFileBytes);
      
      previewContainer.classList.remove('hidden');
      signSuccessCard.classList.add('hidden');

      // Load and render PDF using PDFJS
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfUint8 });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

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

        // Reset QR Position
        qrDragBox.style.top = '10px';
        qrDragBox.style.left = '10px';
        qrX = 10;
        qrY = 10;

      } catch (err) {
        console.error('Failed to render PDF preview:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // Simple QR drag tracker inside canvas
  let isDragging = false;
  let startX = 0, startY = 0;

  qrDragBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - qrDragBox.offsetLeft;
    startY = e.clientY - qrDragBox.offsetTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
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
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 8. Sign and Seal Submit
  btnSignSubmit.addEventListener('click', async () => {
    const file = signFileInput.files[0];
    const password = signPasswordInput.value;
    signStatus.classList.add('hidden');

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

    chrome.storage.local.get(['sanctumToken', 'gdriveToken', 'baseUrl'], async (storage) => {
      const token = storage.sanctumToken;
      const gdriveToken = storage.gdriveToken;
      const baseUrl = storage.baseUrl;

      try {
        // Read file to base64
        const fileBase64 = arrayBufferToBase64(currentFileBytes);

        // Generate QR code base64 locally in popup using qrious
        const verifyToken = crypto.randomUUID();
        const verifyUrl = `${baseUrl}/verify/${verifyToken}`;
        const qr = new QRious({
          value: verifyUrl,
          size: 150,
          level: 'H'
        });
        const qrPng = qr.toDataURL('image/png');

        // Compile final reason text
        const selectedSubId = subcategorySelect.value;
        const subCategory = subCategories.find(s => s.id.toString() === selectedSubId);
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
        const uploadInterval = setInterval(() => {
          if (uploadPct < 90) {
            uploadPct += Math.floor(Math.random() * 8) + 2;
            updateProgress('UPLOADING', uploadPct);
          } else {
            clearInterval(uploadInterval);
          }
        }, 300);

        // Map coordinates from preview to page size points (scaled to 600px width standard)
        const canvasRect = pdfCanvas.getBoundingClientRect();
        const relativeX = (qrX / canvasRect.width) * 600;
        const relativeY = (qrY / canvasRect.height) * 800; // standard approx

        // Call background worker to sign & upload
        chrome.runtime.sendMessage({
          type: 'SIGN_DOCUMENT',
          payload: {
            pdfBase64: fileBase64,
            filename: file.name,
            gdriveToken: gdriveToken,
            apiToken: token,
            qrPosition: {
              page: 1,
              x: relativeX,
              y: relativeY,
              size: 80
            },
            reason_sub_category_id: selectedSubId ? parseInt(selectedSubId) : null,
            reason_final: reasonFinal,
            notes: reasonNotesText.value,
            password: password,
            qrPngBase64: qrPng
          }
        }, (res) => {
          clearInterval(uploadInterval);

          if (res && res.status === 'success') {
            updateProgress('SUCCESS', 100);
            signedPdfBase64 = res.pdfBase64;

            setTimeout(() => {
              progressOverlay.style.display = 'none';
              signSuccessCard.classList.remove('hidden');
            }, 1200);
          } else {
            progressOverlay.style.display = 'none';
            showSignError(res?.message || "Document signing failed.");
          }
        });

      } catch (err) {
        clearInterval(uploadInterval);
        progressOverlay.style.display = 'none';
        showSignError(err.message);
      }
    });
  });

  const showSignError = (msg) => {
    signStatus.classList.remove('hidden');
    signStatus.textContent = msg;
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
    
    // We can use chrome.downloads or data URL trigger
    const dataUrl = `data:application/pdf;base64,${signedPdfBase64}`;
    chrome.downloads.download({
      url: dataUrl,
      filename: `signed_${file.name}`,
      saveAs: true
    });
  });

  // Initial Auth Check
  checkAuth();
});

// Helper: Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
