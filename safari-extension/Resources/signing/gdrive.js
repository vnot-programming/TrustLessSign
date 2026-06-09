// gdrive.js - Google Drive upload and sharing helpers for TrustlessSign

/**
 * Upload base64 encoded file to Google Drive using multipart upload API
 */
async function uploadToGDrive(filename, signedPdfStr, gdriveToken) {
  const meta = {
    name: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    mimeType: 'application/pdf'
  };

  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let multipartBody = '';
  multipartBody += delimiter;
  multipartBody += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
  multipartBody += JSON.stringify(meta);
  multipartBody += delimiter;
  multipartBody += 'Content-Type: application/pdf\r\n';
  multipartBody += 'Content-Transfer-Encoding: base64\r\n\r\n';
  multipartBody += forge.util.encode64(signedPdfStr);
  multipartBody += closeDelimiter;

  // Upload file
  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gdriveToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!uploadRes.ok) {
    throw new Error('Google Drive upload failed.');
  }

  const uploadData = await uploadRes.json();
  const fileId = uploadData.id;

  // Share permission: anyone as reader
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gdriveToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
