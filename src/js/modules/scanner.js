import { dom, updateStatus, showError } from './ui.js';
import { sendScanToServer } from './api.js';
import { saveScanToHistory } from './history.js';

let html5QrCode;
let availableCameras = [];
let currentCameraIndex = 0;
let isScanning = false;

export function initQRCodeScanner() {
  html5QrCode = new html5QrCode('reader', {
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E
    ]
  });
  
  updateStatus("Tap 'Start Camera' to begin scanning");
  
  // Remove any existing start buttons first
  const existingButton = document.getElementById('start-scanner-button');
  if (existingButton) existingButton.remove();
  
  // Create start button with improved styling for mobile
  const startButton = document.createElement('button');
  startButton.innerText = 'Start Camera';
  startButton.className = 'primary-button';
  startButton.id = 'start-scanner-button';
  
  // More aggressive styling to ensure visibility on mobile
  Object.assign(startButton.style, {
    position: 'fixed',  // Changed from absolute to fixed
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '9999',     // Much higher z-index
    padding: '15px 25px', // Larger touch target for mobile
    fontSize: '18px',   // Larger text for mobile
    background: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  });
  
  // Append to body instead of camera container for maximum visibility
  document.body.appendChild(startButton);
  
  startButton.addEventListener('click', () => {
    startButton.remove();
    startScanner();
  });
  
  // Ensure button is visible even if page is still loading
  setTimeout(() => {
    // Force the button to refresh its position
    startButton.style.display = 'none';
    setTimeout(() => startButton.style.display = 'block', 10);
  }, 500);
}

export async function startScanner() {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      availableCameras = devices;
      const backCameraId = devices.find(d => /back|rear|environment/i.test(d.label))?.id || devices[devices.length - 1].id;
      dom.cameraSwitchBtn.style.display = devices.length > 1 ? 'flex' : 'none';
      const config = isIOS()
        ? { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0, disableFlip: false, videoConstraints: { deviceId: { exact: backCameraId } } }
        : { fps: 10, qrbox: { width: 250, height: 150 }, videoConstraints: { facingMode: 'environment' } };
      await html5QrCode.start(isIOS() ? backCameraId : { facingMode: 'environment' }, config, onScanSuccess, onScanFailure);
      isScanning = true;
      updateStatus('Camera active. Position barcode in the frame.');
      dom.errorContainer.classList.add('hidden');
    } else {
      showError('No Cameras Found', 'No cameras were found on your device.');
    }
  } catch (err) {
    console.error('Error starting scanner:', err);
    showError('Scanner Error', `Could not start the scanner: ${err.message}`);
  }
}

export function switchCamera() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      updateStatus('Switching camera...');
      startScanner();
    }).catch(err => console.error('Error stopping scanner:', err));
  }
}

export async function stopScanner() {
  if (html5QrCode && isScanning) {
    await html5QrCode.stop();
    isScanning = false;
  }
}

function onScanSuccess(decodedText, decodedResult) {
  const successSound = new Audio(/* base64 audio data */);
  successSound.play().catch(() => {});
  dom.scanArea.style.border = '2px solid #4CAF50';
  setTimeout(() => dom.scanArea.style.border = '2px dashed rgba(255, 255, 255, 0.5)', 500);
  const locationValue = dom.locationInput.value.trim() || 'Unknown Location';
  updateStatus(`Scanned at ${locationValue}: ${decodedText}`);
  const scanRecord = { barcode: decodedText, location: locationValue, timestamp: new Date().toISOString() };
  saveScanToHistory(scanRecord);
  sendScanToServer(scanRecord);
  if (isScanning) html5QrCode.pause().then(() => setTimeout(() => html5QrCode.resume(), 2000));
}

function onScanFailure(error) {
  if (error !== 'No QR code found') console.error('Scan error:', error);
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}