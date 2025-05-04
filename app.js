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
  html5QrCode = new Html5Qrcode("video", { formatsToSupport: [ 
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E
  ] });

  // Start the scanner when we initialize the app
  startScanner()
}

/**
 * Start the barcode scanner
 */
function startScanner() {
  // First, get all cameras
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      availableCameras = devices
      const cameraId = devices[currentCameraIndex].id
      
      // Update UI
      cameraSwitchBtn.style.display = devices.length > 1 ? "flex" : "none"
      updateStatus("Starting camera...")
      
      // Configuration for scanner
      const config = {
        fps: 10,
        qrbox: {
          width: 250,
          height: 150,
        },
        // Use the selected camera id
        videoConstraints: {
          deviceId: cameraId,
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        }
      };

      // Start scanning
      html5QrCode.start(
        { facingMode },
        config,
        onScanSuccess,
        onScanFailure
      ).then(() => {
        isScanning = true;
        updateStatus("Camera active. Position barcode in the frame.")
        errorContainer.classList.add("hidden")
      }).catch(err => {
        console.error("Error starting scanner:", err);
        showError(
          "Scanner Error", 
          `Could not start the scanner: ${err.message || err}`
        );
      });
    } else {
      showError(
        "No Cameras Found",
        "No cameras were found on your device. Please ensure you've granted permission and that your device has a camera."
      );
    }
  }).catch(err => {
    showError(
      "Camera Access Error",
      `Error accessing cameras: ${err.message || err}`
    );
  });
}

/**
 * Handle successful scan
 */
function onScanSuccess(decodedText, decodedResult) {
  // Play a success sound (optional)
  const successSound = new Audio("data:audio/wav;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABSAJAJAQgAAgAAAAYaKY3QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
  successSound.play().catch(e => console.log("Sound play error:", e));
  
  // Highlight the scan area to provide visual feedback
  const scanArea = document.querySelector('.scan-area');
  scanArea.style.border = '2px solid #4CAF50';
  setTimeout(() => {
    scanArea.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
  }, 500);
  
  // Show the result
  updateStatus(`Scanned: ${decodedText}`);
  
  // Log the result 
  console.log(`Barcode scanned: ${decodedText}`, decodedResult);
  
  // In a real app, you would process the barcode here
  // processBarcode(decodedText);
  
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
  // Stop the current scanner
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      
      // Toggle facing mode
      facingMode = facingMode === "environment" ? "user" : "environment";
      
      // Update status
      updateStatus("Switching camera...");
      
      // Restart scanner
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

  if (barcodeValue) {
    // Process the manually entered barcode
    updateStatus(`Manual barcode entered: ${barcodeValue}`)

    // Clear the input
    barcodeInput.value = ""

    // Log the value
    console.log("Barcode submitted manually:", barcodeValue)

    // In a real implementation, you would call the same processing function
    // processBarcode(barcodeValue);
  } else {
    updateStatus("Please enter a valid barcode")
  }
}

/**
 * Handle page visibility changes to manage scanner resources
 */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, pause scanning to save resources
    if (html5QrCode && isScanning) {
      html5QrCode.pause();
    }
  } else {
    // Page is visible again, resume scanning
    if (html5QrCode && isScanning) {
      html5QrCode.resume();
    }
  }
})

// Clean up resources when the page is closing
window.addEventListener("beforeunload", () => {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().catch(err => console.error(err));
  }
});

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp)