// Content script for TrustlessSign to bridge communication between web application and extension background

// 1. Set presence attribute on the HTML element to avoid inline script CSP violation
try {
  document.documentElement.dataset.trustlessSignInstalled = "true";
} catch (err) {
  console.error('Failed to set TrustlessSign presence attribute:', err);
}

// 2. Listen to messages from the page window and relay them to the background script
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  if (!data || !data.type) return;

  const validRequests = [
    'TRUSTLESS_PING_REQUEST',
    'TRUSTLESS_GENERATE_KEY_REQUEST',
    'TRUSTLESS_SIGN_REQUEST',
    'TRUSTLESS_GET_CERT_SERIAL_REQUEST',
    'TRUSTLESS_FETCH_IMAGE_SIG_REQUEST'
  ];
  if (!validRequests.includes(data.type)) return;

  // Check if extension context was invalidated (e.g., extension reloaded without page refresh)
  if (!chrome || !chrome.runtime || !chrome.runtime.getManifest || !chrome.runtime.sendMessage) {
    console.error('Extension context invalidated. Page must be refreshed.');
    window.postMessage({
      type: 'TRUSTLESS_SIGN_ERROR',
      payload: { error: 'EXTENSION_INVALIDATED', message: 'The extension was updated. Please refresh the page.' }
    }, '*');
    return;
  }

  // Handle Ping — reply with installed=true and current extension version
  if (data.type === 'TRUSTLESS_PING_REQUEST') {
    try {
      const manifest = chrome.runtime.getManifest();
      window.postMessage({
        type: 'TRUSTLESS_PING_RESPONSE',
        version: manifest.version_name || manifest.version || 'unknown'
      }, '*');
    } catch (err) {
      console.error('Extension context invalidated (ping failed):', err);
    }
    return;
  }

  // Handle Get Certificate Serial Request from Web Dashboard
  if (data.type === 'TRUSTLESS_GET_CERT_SERIAL_REQUEST') {
    chrome.storage.local.get(
      ['trustless_cert_serial', 'trustless_private_key_enc', 'trustless_certificate'],
      (storage) => {
        const hasCert = !!(
          storage.trustless_cert_serial &&
          storage.trustless_private_key_enc &&
          storage.trustless_certificate
        );
        window.postMessage({
          type: 'TRUSTLESS_GET_CERT_SERIAL_RESPONSE',
          payload: {
            serial: storage.trustless_cert_serial || null,
            hasCert: hasCert,
          }
        }, '*');
      }
    );
    return;
  }

  // Handle Key Generation Request from Web Dashboard
  if (data.type === 'TRUSTLESS_GENERATE_KEY_REQUEST') {
    try {
      chrome.runtime.sendMessage({ type: 'GENERATE_KEY', payload: data.payload }, (response) => {
        window.postMessage({
          type: 'TRUSTLESS_GENERATE_KEY_RESPONSE',
          payload: response
        }, '*');
      });
    } catch (err) {
      console.error('Generate Key message failed:', err);
      window.postMessage({
        type: 'TRUSTLESS_GENERATE_KEY_RESPONSE',
        payload: { status: 'error', message: 'Extension context invalidated. Please refresh the page.' }
      }, '*');
    }
    return;
  }

  // Handle Document Signing Request from Web Dashboard
  if (data.type === 'TRUSTLESS_SIGN_REQUEST') {
    try {
      chrome.runtime.sendMessage({ type: 'SIGN_DOCUMENT', payload: data.payload }, (response) => {
        window.postMessage({
          type: 'TRUSTLESS_SIGN_RESPONSE',
          payload: response
        }, '*');
      });
    } catch (err) {
      console.error('Sign Document message failed:', err);
      window.postMessage({
        type: 'TRUSTLESS_SIGN_ERROR',
        payload: { error: 'EXTENSION_INVALIDATED', message: 'Extension context invalidated. Please refresh the page.' }
      }, '*');
    }
    return;
  }

  // Handle Fetch Image Signature Request from Web Dashboard
  if (data.type === 'TRUSTLESS_FETCH_IMAGE_SIG_REQUEST') {
    try {
      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_SIG' }, (response) => {
        window.postMessage({
          type: 'TRUSTLESS_FETCH_IMAGE_SIG_RESPONSE',
          payload: response
        }, '*');
      });
    } catch (err) {
      console.error('Fetch Image Sig message failed:', err);
      window.postMessage({
        type: 'TRUSTLESS_FETCH_IMAGE_SIG_RESPONSE',
        payload: { status: 'error', message: 'Extension context invalidated. Please refresh the page.' }
      }, '*');
    }
    return;
  }
});
