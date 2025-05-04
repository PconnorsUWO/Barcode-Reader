import { initQRCodeScanner, startScanner, switchCamera, stopScanner } from './modules/scanner.js';
import { enumerateDevices, handleManualSubmit } from './modules/helpers.js';
import { checkServerStatus } from './modules/api.js';
import { dom, showError } from './modules/ui.js';

export function initApp() {
  // Check for camera support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError(
      'Camera Not Supported',
      'Your browser does not support camera access. Please use a modern browser.'
    );
    return;
  }

  // Set up event listeners
  dom.cameraSwitchBtn.addEventListener('click', switchCamera);
  dom.retryButton.addEventListener('click', () => {
    dom.errorContainer.classList.add('hidden');
    startScanner();
  });
  dom.manualForm.addEventListener('submit', handleManualSubmit);



  // Check API connection
  checkServerStatus();

  // Initialize scanner and devices
  initQRCodeScanner();
  enumerateDevices();
  

}
