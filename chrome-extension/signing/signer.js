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
async function embedQrAndMetadata(pdfUint8, qrPngBase64, qrPosition, metadata) {
  const pdfDoc = await PDFLib.PDFDocument.load(pdfUint8);
  const pages = pdfDoc.getPages();
  const targetPageIdx = Math.min((qrPosition?.page || 1) - 1, pages.length - 1);
  const targetPage = pages[targetPageIdx];
  const { width: pdfWidth, height: pdfHeight } = targetPage.getSize();

  // Convert coordinate from top-left (web UI) to bottom-left (pdf-lib)
  const scale = pdfWidth / 600;
  const qrSize = (qrPosition?.size || 80) * scale;
  const targetX = (qrPosition?.x || 50) * scale;
  const targetY = pdfHeight - ((qrPosition?.y || 50) * scale) - qrSize;

  // Embed visual QR code
  const qrImageBytes = forge.util.decode64(qrPngBase64.replace(/^data:image\/png;base64,/, ''));
  const qrImageUint8 = new Uint8Array(qrImageBytes.length);
  for (let i = 0; i < qrImageBytes.length; i++) {
    qrImageUint8[i] = qrImageBytes.charCodeAt(i);
  }

  const qrImage = await pdfDoc.embedPng(qrImageUint8);
  targetPage.drawImage(qrImage, {
    x: targetX,
    y: targetY,
    width: qrSize,
    height: qrSize
  });

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
