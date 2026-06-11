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
    const manifest = chrome.runtime.getManifest();
    window.postMessage({
      type: 'TRUSTLESS_PING_RESPONSE',
      version: manifest.version_name || manifest.version || 'unknown'
    }, '*');
    return;
  }

  // Handle Key Generation Request from Web Dashboard
  if (data.type === 'TRUSTLESS_GENERATE_KEY_REQUEST') {
    chrome.runtime.sendMessage({ type: 'GENERATE_KEY', payload: data.payload }, (response) => {
      window.postMessage({
        type: 'TRUSTLESS_GENERATE_KEY_RESPONSE',
        payload: response
      }, '*');
    });
    return;
  }

  // Handle Document Signing Request from Web Dashboard
  if (data.type === 'TRUSTLESS_SIGN_REQUEST') {
    chrome.runtime.sendMessage({ type: 'SIGN_DOCUMENT', payload: data.payload }, (response) => {
      window.postMessage({
        type: 'TRUSTLESS_SIGN_RESPONSE',
        payload: response
      }, '*');
    });
    return;
  }
});
