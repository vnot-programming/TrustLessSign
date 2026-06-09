// background.js for TrustlessSign Safari Extension

importScripts('assets/forge.min.js', 'assets/pdf-lib.min.js', 'signing/signer.js', 'signing/gdrive.js');

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const baseUrl = sender?.tab?.url ? new URL(sender.tab.url).origin : "https://tsign.vnot.my.id";

  if (request.type === 'GENERATE_KEY') {
    handleGenerateKey(request.payload, baseUrl)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ status: 'error', message: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.type === 'SIGN_DOCUMENT') {
    handleSignDocument(request.payload, baseUrl)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ status: 'error', message: err.message }));
    return true;
  }
});

/**
 * Generate keypair, encrypt private key with password, issue certificate from backend, and store them.
 */
async function handleGenerateKey(payload, baseUrl) {
  const { password, email, apiToken } = payload;

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  // 1. Generate RSA key pair locally using signer helper
  const keypair = generateKeyPair();

  // 2. Encrypt private key using Master Password using signer helper
  const encryptedPrivateKeyPem = encryptPrivateKey(keypair.privateKey, password);

  // 3. Create CSR using signer helper
  const csrPem = generateCSR(keypair, email);

  // 4. Request certificate from Laravel CA backend
  const response = await fetch(`${baseUrl}/api/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({ csr_pem: csrPem })
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to issue certificate from CA.');
  }

  const certificatePem = resData.certificate.cert_pem;
  const serialNumber = resData.certificate.serial_number;

  // 5. Store private key and certificate in chrome.storage.local
  await new Promise((resolve, reject) => {
    chrome.storage.local.set({
      'trustless_private_key_enc': encryptedPrivateKeyPem,
      'trustless_certificate': certificatePem,
      'trustless_cert_serial': serialNumber
    }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });

  return { status: 'success', serial: serialNumber };
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
  if (gdriveToken) {
    try {
      gdriveUrl = await uploadToGDrive(filename, signedPdfStr, gdriveToken);

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

    } catch (gdriveErr) {
      console.error('Google Drive Upload error:', gdriveErr);
      // Fallback: remains registered as is_saved_to_drive = false, return the file locally
    }
  }

  // Convert signedPdfBytes back to base64 for local download in UI
  const signedPdfBase64 = forge.util.encode64(signedPdfStr);

  return {
    status: 'success',
    verifyToken: verifyToken,
    hash: hash,
    gdriveUrl: gdriveUrl,
    pdfBase64: signedPdfBase64
  };
}
