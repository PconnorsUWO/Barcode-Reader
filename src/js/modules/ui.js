export const dom = {
    video: document.getElementById('video'),
    cameraSwitchBtn: document.getElementById('camera-switch'),
    statusMessage: document.getElementById('status-message'),
    errorContainer: document.getElementById('error-container'),
    errorTitle: document.getElementById('error-title'),
    errorText: document.getElementById('error-text'),
    retryButton: document.getElementById('retry-button'),
    manualForm: document.getElementById('manual-form'),
    barcodeInput: document.getElementById('barcode-input'),
    locationInput: document.getElementById('location-input'),
    scanArea: document.querySelector('.scan-area'),
    cameraContainer: document.querySelector('.camera-container'),
  };
  
  export function updateStatus(message) {
    dom.statusMessage.textContent = message;
  }
  
  export function showError(title, message) {
    dom.errorTitle.textContent = title;
    dom.errorText.textContent = message;
    dom.errorContainer.classList.remove('hidden');
    updateStatus('');
  }