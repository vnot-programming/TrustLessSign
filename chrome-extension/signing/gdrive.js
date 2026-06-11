// gdrive.js - Google Drive upload and sharing helpers for TrustlessSign

/**
 * Helper to get or create a folder in Google Drive
 */
async function getOrCreateFolder(folderName, parentId, gdriveToken) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  // 1. Search for folder
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${gdriveToken}`
    }
  });

  if (!searchRes.ok) {
    throw new Error('Failed to search for Google Drive folder');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    // Folder exists, return its ID
    return searchData.files[0].id;
  }

  // 2. Folder does not exist, create it
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gdriveToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${folderName}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Upload base64 encoded file to Google Drive using multipart upload API
 */
async function uploadToGDrive(filename, signedPdfStr, gdriveToken) {
  // 1. Get or create root "TrustLessSign" folder
  const rootFolderId = await getOrCreateFolder('TrustLessSign', null, gdriveToken);

  // 2. Get or create subfolder "Month.Year" (e.g., "06.2026")
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const subFolderName = `${month}.${year}`;
  
  const targetFolderId = await getOrCreateFolder(subFolderName, rootFolderId, gdriveToken);

  // 3. Upload file to target folder
  const meta = {
    name: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    mimeType: 'application/pdf',
    parents: [targetFolderId]
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
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${errorText}`);
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
