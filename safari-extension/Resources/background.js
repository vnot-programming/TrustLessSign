// service-worker.js for TrustlessSign Extension (Manifest V3)
self.window = self;

importScripts('../assets/forge.min.js', '../assets/pdf-lib.min.js', '../signing/signer.js', '../signing/gdrive.js');

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.storage.local.get(['baseUrl'], (storage) => {
    let baseUrl = storage.baseUrl;
    if (!baseUrl) {
      if (sender?.tab?.url && !sender.tab.url.startsWith('chrome-extension://')) {
        baseUrl = new URL(sender.tab.url).origin;
      } else {
        baseUrl = "https://tsign.vnot.my.id";
      }
    }

    if (request.type === 'GENERATE_KEY') {
      handleGenerateKey(request.payload, baseUrl)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ status: 'error', message: err.message }));
    }

    if (request.type === 'SIGN_DOCUMENT') {
      handleSignDocument(request.payload, baseUrl)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ status: 'error', message: err.message }));
    }

    if (request.type === 'UPLOAD_IDENTITY') {
      handleUploadIdentity(request.payload)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ status: 'error', message: err.message }));
    }
  });

  return true; // Keep channel open for async response
});

/**
 * Generate keypair, encrypt private key with password, issue certificate from backend, and store them.
 */
async function handleGenerateKey(payload, baseUrl) {
  const { password, email, apiToken, deviceName, deviceIdentifier } = payload;

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  // 1. Generate RSA key pair locally using signer helper
  const keypair = generateKeyPair();

  // 2. Encrypt private key using Master Password using signer helper
  const encryptedPrivateKeyPem = encryptPrivateKey(keypair.privateKey, password);

  // 3. Create CSR using signer helper
  const csrPem = generateCSR(keypair, email);

  // 4. Request certificate from Laravel CA backend — send device info for multi-device tracking
  const response = await fetch(`${baseUrl}/api/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      csr_pem:           csrPem,
      device_name:       deviceName       || 'Unknown Device',
      device_identifier: deviceIdentifier || null,
    })
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to issue certificate from CA.');
  }

  const certificatePem = resData.certificate.cert_pem;
  const serialNumber   = resData.certificate.serial_number;

  // 5. Store private key and certificate in chrome.storage.local
  await new Promise((resolve, reject) => {
    chrome.storage.local.set({
      'trustless_private_key_enc': encryptedPrivateKeyPem,
      'trustless_certificate':     certificatePem,
      'trustless_cert_serial':     serialNumber
    }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });

  // 6. Automatically backup to Google Drive
  let tsignBase64Local = null;
  let fileNameLocal = null;
  let driveUrlLocal = null;
  let driveSuccess = false;

  try {
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, (t) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(t);
      });
    });

    if (token) {
      const identityObj = {
        privateKey: encryptedPrivateKeyPem,
        certificate: certificatePem,
        serialNumber: serialNumber
      };
      
      const tsignBuffer = await encryptIdentityToTsign(identityObj, password);
      tsignBase64Local = arrayBufferToBase64(tsignBuffer);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      fileNameLocal = `trustlesssign_identity_${ts}.tsign`;
      
      const uploadResult = await uploadIdentityToDrive(fileNameLocal, tsignBase64Local, token);
      driveSuccess = true;
      driveUrlLocal = uploadResult.url;
      console.log('Successfully backed up identity to Google Drive.');
    }
  } catch (err) {
    console.warn('Failed to auto-backup identity to GDrive:', err);
  }

  return { 
    status: 'success', 
    serial: serialNumber,
    driveSuccess: driveSuccess,
    tsignBase64: tsignBase64Local,
    fileName: fileNameLocal,
    driveUrl: driveUrlLocal
  };
}

/**
 * Sign document offline, optionally upload to GDrive, and register metadata on Laravel.
 */
async function handleSignDocument(payload, baseUrl) {
  const { 
    pdfBase64, 
    filename, 
    gdriveToken, 
    apiToken, 
    qrPosition, 
    reason_sub_category_id, 
    reason_final, 
    notes, 
    password,
    qrPngBase64
  } = payload;

  // 1. Retrieve & decrypt private key
  const storage = await new Promise((resolve) => {
    chrome.storage.local.get([
      'trustless_private_key_enc', 
      'trustless_certificate', 
      'trustless_cert_serial'
    ], resolve);
  });

  const encKey = storage.trustless_private_key_enc;
  const certPem = storage.trustless_certificate;
  const certSerial = storage.trustless_cert_serial;

  if (!encKey || !certPem) {
    throw new Error('No cryptographic key found. Please generate a certificate first.');
  }

  // Decrypt using signer helper
  const privateKey = decryptPrivateKey(encKey, password);

  // 2. Load PDF bytes
  const pdfBytes = forge.util.decode64(pdfBase64);
  const pdfUint8 = new Uint8Array(pdfBytes.length);
  for (let i = 0; i < pdfBytes.length; i++) {
    pdfUint8[i] = pdfBytes.charCodeAt(i);
  }

  // 3. Generate verify_token & metadata block
  const verifyToken = crypto.randomUUID();
  const metadata = {
    certificate_serial: certSerial,
    verify_token: verifyToken,
    original_filename: filename,
    author: payload.author || 'TrustlessSign User',
    reason: reason_final || 'Digital Verification',
    signed_at: new Date().toISOString()
  };

  // 4. Embed QR & metadata using signer helper
  const stampResult = await embedQrAndMetadata(pdfUint8, qrPngBase64, qrPosition, metadata);
  const { signedPdfStr, hash, targetX, targetY, qrSize, targetPageIdx } = stampResult;

  // 5. Sign final PDF hash
  const forgeMd = forge.md.sha256.create();
  forgeMd.update(signedPdfStr);
  const signature = privateKey.sign(forgeMd);
  const signatureBase64 = forge.util.encode64(signature);

  // 6. Register on Laravel backend (deferred state: is_saved_to_drive = false)
  const registerResponse = await fetch(`${baseUrl}/api/documents/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      certificate_serial: certSerial,
      is_saved_to_drive: false,
      gdrive_url_signed: null,
      original_filename: filename,
      verify_token: verifyToken,
      doc_hash_sha256: hash,
      qr_position: { page: targetPageIdx + 1, x: targetX, y: targetY, size: qrSize },
      reason_sub_category_id: reason_sub_category_id || null,
      reason_final: reason_final || null,
      notes: notes || null
    })
  });

  if (!registerResponse.ok) {
    const regError = await registerResponse.json();
    throw new Error(regError.message || 'Failed to register document metadata on server.');
  }

  // 7. Handle GDrive Upload using gdrive helper if token is present
  let gdriveUrl = null;
  let isLocalFallback = false;
  let localFallbackMessage = '';

  if (gdriveToken) {
    let currentGdriveToken = gdriveToken;
    let uploadSuccess = false;

    try {
      gdriveUrl = await uploadToGDrive(filename, signedPdfStr, currentGdriveToken);
      uploadSuccess = true;
    } catch (gdriveErr) {
      console.error('Google Drive Upload error:', gdriveErr);
      
      // Check if it's an authentication error
      if (gdriveErr.message && (gdriveErr.message.includes('401') || gdriveErr.message.includes('Invalid Credentials') || gdriveErr.message.includes('UNAUTHENTICATED'))) {
        try {
          // Attempt to refresh the token via backend
          const refreshRes = await fetch(`${baseUrl}/api/gdrive/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.status === 'success' && refreshData.gdrive_token) {
              currentGdriveToken = refreshData.gdrive_token;
              
              // Update local storage so future calls use the new token
              await new Promise((resolve) => {
                chrome.storage.local.set({ gdriveToken: currentGdriveToken }, resolve);
              });
              
              // Retry upload
              gdriveUrl = await uploadToGDrive(filename, signedPdfStr, currentGdriveToken);
              uploadSuccess = true;
            } else {
              throw new Error('Refresh endpoint did not return a token.');
            }
          } else {
            throw new Error('Failed to refresh token from backend.');
          }
        } catch (refreshErr) {
          console.error('Failed to auto-refresh Google Drive token:', refreshErr);
          isLocalFallback = true;
          localFallbackMessage = 'Google Drive session expired and could not be refreshed. File saved locally.';
        }
      } else {
        isLocalFallback = true;
        localFallbackMessage = 'Google Drive upload failed. File saved locally.';
      }
    }

    if (uploadSuccess) {
      // Update register on backend with drive URL and is_saved_to_drive = true
      await fetch(`${baseUrl}/api/documents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          certificate_serial: certSerial,
          is_saved_to_drive: true,
          gdrive_url_signed: gdriveUrl,
          original_filename: filename,
          verify_token: verifyToken,
          doc_hash_sha256: hash,
          qr_position: { page: targetPageIdx + 1, x: targetX, y: targetY, size: qrSize },
          reason_sub_category_id: reason_sub_category_id || null,
          reason_final: reason_final || null,
          notes: notes || null
        })
      });
    }
  }

  // Convert signedPdfBytes back to base64 for local download in UI
  const signedPdfBase64 = forge.util.encode64(signedPdfStr);

  return {
    status: isLocalFallback ? 'warning' : 'success',
    message: isLocalFallback ? localFallbackMessage : 'Success',
    verifyToken: verifyToken,
    hash: hash,
    gdriveUrl: gdriveUrl,
    pdfBase64: signedPdfBase64
  };
}

/**
 * Upload encrypted .tsign identity backup to Google Drive (TrustLessSign/Certificated/)
 */
async function handleUploadIdentity(payload) {
  const { tsignBase64, fileName, gdriveToken } = payload;

  if (!gdriveToken) {
    throw new Error('No Google Drive token found. Please re-authenticate.');
  }
  if (!tsignBase64 || !fileName) {
    throw new Error('Missing .tsign data or filename.');
  }

  const uploadedData = await uploadIdentityToDrive(fileName, tsignBase64, gdriveToken);
  return { status: 'success', fileName: uploadedData.name, gdriveUrl: uploadedData.url };
}

