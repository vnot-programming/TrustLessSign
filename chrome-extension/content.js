// Content script for TrustlessSign to bridge communication between web application and extension background

// 1. Inject the extension presence flag into the main window context
const injectPresenceFlag = () => {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement('script');
    script.textContent = 'window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ = true;';
    container.appendChild(script);
    script.remove();
  } catch (err) {
    console.error('Failed to inject TrustlessSign presence flag:', err);
  }
};

injectPresenceFlag();

// 2. Listen to messages from the page window and relay them to the background script
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  if (!data || !data.type) return;

  // Handle Ping
  if (data.type === 'TRUSTLESS_PING_REQUEST') {
    window.postMessage({ type: 'TRUSTLESS_PING_RESPONSE' }, '*');
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
