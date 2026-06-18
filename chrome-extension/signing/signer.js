// signer.js - Cryptographic signing helper for TrustlessSign

/**
 * Encrypt private key using Master Password (AES-256 via PKCS#5 PBKDF2)
 */
function encryptPrivateKey(privateKey, password) {
  return forge.pki.encryptRsaPrivateKey(privateKey, password, {
    algorithm: 'aes256',
    count: 10000,
    md: forge.md.sha256.create()
  });
}

/**
 * Decrypt private key using Master Password
 */
function decryptPrivateKey(encryptedPem, password) {
  try {
    return forge.pki.decryptRsaPrivateKey(encryptedPem, password);
  } catch (err) {
    throw new Error('Incorrect Master Password. Decryption failed.');
  }
}

/**
 * Generate RSA key pair locally
 */
function generateKeyPair() {
  return forge.pki.rsa.generateKeyPair(2048);
}

/**
 * Create CSR (Certificate Signing Request) PEM
 */
function generateCSR(keypair, email) {
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keypair.publicKey;
  csr.setSubject([
    { name: 'commonName', value: email },
    { name: 'countryName', value: 'ID' },
    { name: 'organizationName', value: 'TrustlessSign' }
  ]);
  csr.sign(keypair.privateKey, forge.md.sha256.create());
  return forge.pki.certificationRequestToPem(csr);
}

/**
 * Embed QR code visual signature into PDF and set metadata subject
 */
async function embedQrAndMetadata(pdfUint8, qrPngBase64, qrPosition, metadata, pageStamps = []) {
  const pdfDoc = await PDFLib.PDFDocument.load(pdfUint8, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const targetPageIdx = Math.min((qrPosition?.page || 1) - 1, pages.length - 1);
  const targetPage = pages[targetPageIdx];
  const { width: pdfWidth, height: pdfHeight } = targetPage.getSize();

  // Convert coordinate from top-left (web UI) to bottom-left (pdf-lib)
  const scale = pdfWidth / 600;
  const qrSize = (qrPosition?.size || 80) * scale;
  const targetX = (qrPosition?.x || 50) * scale;
  // Embed visual QR code or image signature
  const qrImageBytes = forge.util.decode64(qrPngBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''));
  const qrImageUint8 = new Uint8Array(qrImageBytes.length);
  for (let i = 0; i < qrImageBytes.length; i++) {
    qrImageUint8[i] = qrImageBytes.charCodeAt(i);
  }

  // Detect image type by magic bytes
  let qrImage;
  if (qrImageUint8[0] === 0xFF && qrImageUint8[1] === 0xD8) {
    qrImage = await pdfDoc.embedJpg(qrImageUint8);
  } else {
    qrImage = await pdfDoc.embedPng(qrImageUint8);
  }

  const aspect = qrImage.height / qrImage.width;
  const drawHeight = qrSize * aspect;
  
  // Re-calculate targetY using actual drawHeight
  const targetY = pdfHeight - ((qrPosition?.y || 50) * scale) - drawHeight;

  targetPage.drawImage(qrImage, {
    x: targetX,
    y: targetY,
    width: qrSize,
    height: drawHeight
  });

  // Add Footer and Marginal Page Stamps on EVERY page to prevent page swapping
  const shortcode = metadata.verify_token ? metadata.verify_token.substring(0, 8).toUpperCase() : 'UNKNOWN';
  const footerText = `This document has been electronically signed. To Verify visit : https://tsign.vnot.my.id/verify/${shortcode}`;
  const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    // Draw Footer at bottom left
    page.drawText(footerText, {
      x: 30,
      y: 15,
      size: 9,
      font: helveticaFont,
      color: PDFLib.rgb(0.3, 0.3, 0.3)
    });

    if (pageStamps && pageStamps[i]) {
      const stampBytes = forge.util.decode64(pageStamps[i].replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''));
      const stampUint8 = new Uint8Array(stampBytes.length);
      for (let j = 0; j < stampBytes.length; j++) {
        stampUint8[j] = stampBytes.charCodeAt(j);
      }
      
      let stampImage;
      if (stampUint8[0] === 0xFF && stampUint8[1] === 0xD8) {
        stampImage = await pdfDoc.embedJpg(stampUint8);
      } else {
        stampImage = await pdfDoc.embedPng(stampUint8);
      }

      const stampAspect = stampImage.height / stampImage.width;
      const ribbonWidth = 400;
      const ribbonHeight = ribbonWidth * stampAspect;

      page.drawImage(stampImage, {
        x: 15,
        y: 50,
        width: ribbonWidth,
        height: ribbonHeight,
        rotate: PDFLib.degrees(90)
      });
    }
  }

  pdfDoc.setTitle(metadata.original_filename);
  pdfDoc.setAuthor(metadata.author || 'TrustlessSign User');
  
  let subjectText = metadata.reason;
  if (!subjectText) {
    const d = new Date(metadata.signed_at || Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    subjectText = `${metadata.author || 'TrustlessSign User'} Signed at ${yyyy}/${mm}/${dd}`;
  }
  pdfDoc.setSubject(subjectText);
  pdfDoc.setKeywords(['TrustlessSign', 'Digital Signature', 'Zero-Trust']);
  pdfDoc.setCreator('TrustlessSign Zero-Trust Seal');
  pdfDoc.setProducer('TrustlessSign Crypto-Engine (Web3)');
  const signedPdfBytes = await pdfDoc.save();

  // Compute SHA-256 of final signed PDF
  const forgeMd = forge.md.sha256.create();
  let signedPdfStr = '';
  for (let i = 0; i < signedPdfBytes.length; i++) {
    signedPdfStr += String.fromCharCode(signedPdfBytes[i]);
  }
  forgeMd.update(signedPdfStr);
  const finalHash = forgeMd.digest().toHex();

  return {
    signedPdfStr: signedPdfStr,
    signedPdfBytes: signedPdfBytes,
    hash: finalHash,
    targetX: targetX,
    targetY: targetY,
    qrSize: qrSize,
    targetPageIdx: targetPageIdx
  };
}

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

// ─── .TSIGN PROPRIETARY FORMAT CRYPTO ─────────────────────────────────────────
const TSIGN_MAGIC    = new Uint8Array([0x54, 0x53, 0x47, 0x4E]); // "TSGN"
const TSIGN_APP_SALT = 'TrustLessSign_Identity_v1_DO_NOT_MODIFY';

async function deriveKeyFromPassword(password, salt) {
  const enc        = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password + TSIGN_APP_SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 310000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptIdentityToTsign(identityObj, password) {
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const key  = await deriveKeyFromPassword(password, salt);

  const enc       = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(identityObj));

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  const result = new Uint8Array(4 + 12 + 32 + ciphertext.byteLength);
  result.set(TSIGN_MAGIC, 0);
  result.set(iv,          4);
  result.set(salt,        16);
  result.set(new Uint8Array(ciphertext), 48);
  return result.buffer;
}

async function decryptIdentityFromTsign(arrayBuffer, password) {
  const data  = new Uint8Array(arrayBuffer);
  if (data.length < 48) throw new Error('Invalid .tsign file: File too short.');
  
  const magic = data.slice(0, 4);
  if (magic[0] !== TSIGN_MAGIC[0] || magic[1] !== TSIGN_MAGIC[1] || magic[2] !== TSIGN_MAGIC[2] || magic[3] !== TSIGN_MAGIC[3]) {
    throw new Error('Invalid .tsign file. Not a TrustlessSign Identity file.');
  }

  const iv         = data.slice(4, 16);
  const salt       = data.slice(16, 48);
  const ciphertext = data.slice(48);

  const key = await deriveKeyFromPassword(password, salt);

  try {
    const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintextBuffer));
  } catch (err) {
    throw new Error('Decryption failed. Incorrect Master Password or corrupted file.');
  }
}

// Convert Base64 to Blob
function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: mimeType });
}
