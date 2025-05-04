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
  if (isIOS()) {
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
  } else {
    // Start automatically on non-iOS devices
    startScanner();
  }
}

/**
 * Check if the device is running iOS
 */
function isIOS() {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (userAgent.includes("Mac") && "ontouchend" in document) ||
         /iPad|iPhone|iPod/.test(navigator.platform) ||
         (navigator.userAgent.includes("Safari") && 
          !navigator.userAgent.includes("Chrome") && 
          "ontouchend" in document);
}

// Remove the duplicate startScanner() function and use this implementation:
function startScanner() {
  // First, get all cameras
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      availableCameras = devices;
      
      // For iOS, prefer the back camera and use deviceId instead of facingMode
      if (isIOS()) {
        currentCameraIndex = 0; // Back camera on iOS is typically index 0
        const cameraId = devices[currentCameraIndex].id;
        
        const config = {
          fps: 10,
          qrbox: {
            width: 250,
            height: 150,
          },
          aspectRatio: 1.0,
          disableFlip: true, // Important for iOS
          videoConstraints: {
            deviceId: { exact: cameraId }
          }
        };
        
        // Use cameraId directly instead of facingMode for iOS
        html5QrCode.start(
          cameraId,
          config,
          onScanSuccess,
          onScanFailure
        ).then(() => {
          isScanning = true;
          updateStatus("Camera active. Position barcode in the frame.");
          errorContainer.classList.add("hidden");
        }).catch(err => {
          console.error("Error starting scanner:", err);
          showError("Scanner Error", `Could not start the scanner: ${err.message || err}`);
        });
      } else {
        // For non-iOS devices, continue using facingMode approach
        const config = {
          fps: 10,
          qrbox: {
            width: 250,
            height: 150,
          },
          videoConstraints: {
            facingMode: facingMode
          }
        };
        
        html5QrCode.start(
          { facingMode },
          config,
          onScanSuccess,
          onScanFailure
        ).then(() => {
          isScanning = true;
          updateStatus("Camera active. Position barcode in the frame.");
          errorContainer.classList.add("hidden");
        }).catch(err => {
          console.error("Error starting scanner:", err);
          showError("Scanner Error", `Could not start the scanner: ${err.message || err}`);
        });
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
    showError("Camera Access Error", `Error accessing cameras: ${err.message || err}`);
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
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      
      if (isIOS()) {
        // On iOS, switch camera index
        currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      } else {
        // For other devices, toggle facing mode
        facingMode = facingMode === "environment" ? "user" : "environment";
      }
      
      updateStatus("Switching camera...");
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