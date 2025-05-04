import { dom, updateStatus, showError } from './ui.js';
import { sendScanToServer } from './api.js';
import { saveScanToHistory } from './history.js';

let html5QrCode;
let availableCameras = [];
let currentCameraIndex = 0;
let isScanning = false;

export function initQRCodeScanner() {
  // First check if the library is loaded
  if (typeof Html5Qrcode === 'undefined') {
    console.error("HTML5 QR Code library not loaded");
    updateStatus("Error: QR code scanner library not loaded. Please refresh the page.");
    
    // Create a button anyway so user can try
    createStartButton();
    return;
  }
  
  try {
    // Initialize the QR code scanner
    html5QrCode = new Html5Qrcode('reader', {
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
    
    // Call createStartButton instead of duplicating code
    createStartButton();
    
  } catch (err) {
    console.error("Error initializing QR scanner:", err);
    updateStatus("Error initializing scanner. Please try again.");
    
    // Create button anyway
    createStartButton();
  }
}

function createStartButton() {
  console.log("Creating start button");
  
  // Remove any existing start buttons first
  const existingButton = document.getElementById('start-scanner-button');
  if (existingButton) {
    existingButton.remove();
    console.log("Removed existing button");
  }
  
  // Create start button with extreme styling for maximum visibility
  const startButton = document.createElement('button');
  startButton.innerText = 'START CAMERA';
  startButton.className = 'primary-button';
  startButton.id = 'start-scanner-button';
  
  // Extreme styling to ensure visibility on all devices
  Object.assign(startButton.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '2147483647', // Maximum z-index possible
    padding: '20px 30px',
    fontSize: '22px',
    fontWeight: 'bold',
    background: '#FF5722', // Bright orange for visibility
    color: 'white',
    border: '3px solid black',
    borderRadius: '10px',
    boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    animation: 'pulse 2s infinite'
  });
  
  // Create and add the pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
      100% { transform: translate(-50%, -50%) scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  // Add to body
  document.body.appendChild(startButton);
  console.log("Start button created and added to document body");
  
  // Add event listener with error handling
  startButton.addEventListener('click', () => {
    console.log("Start button clicked");
    try {
      startButton.remove();
      startScanner();
    } catch (err) {
      console.error("Error starting scanner:", err);
      updateStatus("Error starting scanner: " + err.message);
    }
  });
  
  // Double-ensure button is visible by setting a timeout and doing
  // another visibility check
  setTimeout(() => {
    console.log("Checking button visibility");
    if (startButton.offsetParent === null) {
      console.log("Button is not visible, forcing display");
      startButton.style.display = 'block';
      // Force reflow
      startButton.getBoundingClientRect();
    }
  }, 1000);
  
  // Set a direct timeout to force scanner start if button isn't clicked
  // after 10 seconds (optional - remove if unwanted behavior)
  /* 
  setTimeout(() => {
    if (document.getElementById('start-scanner-button')) {
      console.log("Auto-starting scanner after timeout");
      startButton.remove();
      startScanner();
    }
  }, 10000);
  */
}

export async function startScanner() {
  try {
    // Fix: Use Html5Qrcode class (capital H) instead of the instance variable
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