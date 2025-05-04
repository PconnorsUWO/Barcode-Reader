/**
 * Barcode Scanner App
 * A mobile-first web application for scanning barcodes using device cameras.
 * Implementation uses html5-qrcode library for barcode scanning.
 */

// DOM Elements
const video = document.getElementById("video")
const cameraSwitchBtn = document.getElementById("camera-switch")
const statusMessage = document.getElementById("status-message")
const errorContainer = document.getElementById("error-container")
const errorTitle = document.getElementById("error-title")
const errorText = document.getElementById("error-text")
const retryButton = document.getElementById("retry-button")
const manualForm = document.getElementById("manual-form")
const barcodeInput = document.getElementById("barcode-input")
const locationInput = document.getElementById("location-input")

// App state
let currentStream = null
let availableCameras = []
let currentCameraIndex = 0
let facingMode = "environment" // Start with back camera by default
let html5QrCode = null
let isScanning = false

/**
 * Initialize the application
 */
function initApp() {
  // Check if the browser supports mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError(
      "Camera Not Supported",
      "Your browser does not support camera access. Please try using a modern browser like Chrome, Firefox, or Safari."
    )
    return
  }

  // Set up event listeners
  cameraSwitchBtn.addEventListener("click", switchCamera)
  retryButton.addEventListener("click", retryCamera)
  manualForm.addEventListener("submit", handleManualSubmit)

  // Initialize HTML5 QR Code scanner
  initQRCodeScanner()

  // Enumerate available video devices
  enumerateDevices()
}
/**
 * Initialize the HTML5 QR Code scanner
 */
function initQRCodeScanner() {
  // Create a new instance of the scanner
  // Important: Use the "reader" div instead of "video" 
  html5QrCode = new Html5Qrcode("reader", { 
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

  // For iOS, we need to ensure there's user interaction before starting camera
  // So we'll show a start button if it's the first time
  updateStatus("Tap 'Start Camera' to begin scanning");
  const startButton = document.createElement('button');
  startButton.innerText = "Start Camera";
  startButton.className = "primary-button";
  startButton.style.position = "absolute";
  startButton.style.top = "50%";
  startButton.style.left = "50%";
  startButton.style.transform = "translate(-50%, -50%)";
  startButton.style.zIndex = "20";
  document.querySelector('.camera-container').appendChild(startButton);
  
  startButton.addEventListener('click', () => {
    startButton.remove();
    startScanner();
  });
  
}

/**
 * Check if the device is running iOS
 */
function isIOS() {
  return [
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || 
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document) ||
  (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && 
   /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));
}

function startScanner() {
  // First, get all cameras
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      availableCameras = devices;
      console.log("Available cameras:", devices); // Debug information
      
      // Try to find back camera by label
      let backCameraId = null;
      for (let i = 0; i < devices.length; i++) {
        const label = devices[i].label.toLowerCase();
        if (label.includes('back') || 
            label.includes('rear') || 
            label.includes('environment')) {
          backCameraId = devices[i].id;
          currentCameraIndex = i;
          break;
        }
      }
      
      // If no back camera found by label, default to the last camera
      // (typically the back camera on iOS devices)
      if (!backCameraId && devices.length > 1) {
        backCameraId = devices[devices.length - 1].id;
        currentCameraIndex = devices.length - 1;
      } else if (!backCameraId) {
        // Only one camera, use it
        backCameraId = devices[0].id;
        currentCameraIndex = 0;
      }
      
      // For iOS, use deviceId approach
      if (isIOS()) {
        const config = {
          fps: 10,
          qrbox: {
            width: 250,
            height: 150,
          },
          aspectRatio: 1.0,
          disableFlip: false, // Allow flipping for proper orientation
          videoConstraints: {
            deviceId: { exact: backCameraId }
          }
        };
        
        // Use backCameraId directly
        html5QrCode.start(
          backCameraId,
          config,
          onScanSuccess,
          onScanFailure
        ).then(() => {
          isScanning = true;
          updateStatus("Camera active. Position barcode in the frame.");
          errorContainer.classList.add("hidden");
        }).catch(err => {
          console.error("Error starting scanner:", err);
          // Fall back to facingMode if deviceId fails
          startWithFacingMode();
        });
      } else {
        // For non-iOS devices, use facingMode approach
        startWithFacingMode();
      }
      
      // Update UI
      cameraSwitchBtn.style.display = devices.length > 1 ? "flex" : "none";
      
    } else {
      showError(
        "No Cameras Found",
        "No cameras were found on your device. Please ensure you've granted permission."
      );
    }
  }).catch(err => {
    console.error("Camera enumeration error:", err);
    showError("Camera Access Error", `Error accessing cameras: ${err.message || err}`);
  });
}

// Helper function to start with facingMode
function startWithFacingMode() {
  const config = {
    fps: 10,
    qrbox: {
      width: 250,
      height: 150,
    },
    videoConstraints: {
      facingMode: "environment" // Force environment (back camera)
    }
  };
  
  html5QrCode.start(
    { facingMode: "environment" }, // Always try environment first
    config,
    onScanSuccess,
    onScanFailure
  ).then(() => {
    isScanning = true;
    updateStatus("Camera active. Position barcode in the frame.");
    errorContainer.classList.add("hidden");
  }).catch(err => {
    console.error("Error starting scanner with facingMode:", err);
    showError("Scanner Error", `Could not start the scanner: ${err.message || err}`);
  });
}

/**
 * Handle successful scan
 */
function onScanSuccess(decodedText, decodedResult) {
  // Play a success sound (optional)
  const successSound = new Audio("data:audio/wav;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABSAJAJAQgAAgAAAAYaKY3QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
  successSound.play().catch(e => console.log("Sound play error:", e));
  
  // Get the current location from input field
  const locationValue = locationInput.value.trim() || "Unknown Location";
  
  // Highlight the scan area to provide visual feedback
  const scanArea = document.querySelector('.scan-area');
  scanArea.style.border = '2px solid #4CAF50';
  setTimeout(() => {
    scanArea.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
  }, 500);
  
  // Show the result with location
  updateStatus(`Scanned at ${locationValue}: ${decodedText}`);
  
  // Log the result with location
  console.log(`Barcode scanned at ${locationValue}: ${decodedText}`, decodedResult);
  
  // Store the scan in a structured format
  const scanRecord = {
    barcode: decodedText,
    location: locationValue,
    timestamp: new Date().toISOString()
  };
  
  // Save to local storage (you could expand this to save to a database)
  saveScanToHistory(scanRecord);
  
  // In a real app, you would process the barcode here
  // processBarcode(decodedText, locationValue);
  
  // Pause for a moment to show the result before scanning again
  if (isScanning) {
    html5QrCode.pause().then(() => {
      setTimeout(() => {
        html5QrCode.resume();
      }, 2000);
    });
  }
}

/**
 * Save scan to history (local storage)
 */
function saveScanToHistory(scanRecord) {
  try {
    // Get existing history
    const scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    
    // Add new scan record
    scanHistory.push(scanRecord);
    
    // Save back to local storage (limit to last 100 scans)
    localStorage.setItem('scanHistory', JSON.stringify(
      scanHistory.slice(-100)
    ));
  } catch (error) {
    console.error("Error saving scan to history:", error);
  }
}

/**
 * Handle scan failures
 */
function onScanFailure(error) {
  // Most failures are just "no barcode found" which we can ignore
  // Only log actual errors
  if (error !== "No QR code found") {
    console.error("Scan error:", error);
  }
}

/**
 * Enumerate available video devices
 */
async function enumerateDevices() {
  try {
    // Get all media devices
    const devices = await navigator.mediaDevices.enumerateDevices()

    // Filter for video input devices (cameras)
    availableCameras = devices.filter((device) => device.kind === "videoinput")

    // Update camera switch button visibility
    cameraSwitchBtn.style.display = availableCameras.length > 1 ? "flex" : "none"
  } catch (error) {
    console.error("Error enumerating devices:", error)
    cameraSwitchBtn.style.display = "none"
  }
}

/**
 * Switch between available cameras
 */
function switchCamera() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      
      // For all devices, switch camera index
      currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      updateStatus("Switching camera...");
      
      // Restart with the new camera
      startScanner();
    }).catch(err => {
      console.error("Error stopping scanner:", err);
    });
  }
}

/**
 * Stop the current scanning session
 */
function stopScanner() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
    }).catch(err => {
      console.error("Error stopping scanner:", err);
    });
  }
}

/**
 * Show error message
 */
function showError(title, message) {
  errorTitle.textContent = title
  errorText.textContent = message
  errorContainer.classList.remove("hidden")
  updateStatus("")
}

/**
 * Retry camera access after error
 */
function retryCamera() {
  errorContainer.classList.add("hidden")
  startScanner()
}

/**
 * Update status message
 */
function updateStatus(message) {
  statusMessage.textContent = message
}

/**
 * Handle manual barcode submission
 */
function handleManualSubmit(event) {
  event.preventDefault()
  const barcodeValue = barcodeInput.value.trim()
  const locationValue = locationInput.value.trim() || "Unknown Location"

  if (barcodeValue) {
    // Process the manually entered barcode with location
    updateStatus(`Manual barcode at ${locationValue}: ${barcodeValue}`)

    // Clear the input
    barcodeInput.value = ""

    // Log the value with location
    console.log("Barcode submitted manually at " + locationValue + ":", barcodeValue)
    
    // Save to history
    saveScanToHistory({
      barcode: barcodeValue,
      location: locationValue,
      timestamp: new Date().toISOString(),
      method: "manual"
    });

    // In a real implementation, you would call the same processing function
    // processBarcode(barcodeValue, locationValue);
  } else {
    updateStatus("Please enter a valid barcode")
  }
}

// Clean up resources when the page is closing
window.addEventListener("beforeunload", () => {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().catch(err => console.error(err));
  }
});

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp)