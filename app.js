/**
 * Barcode Scanner App
 * A mobile-first web application for scanning barcodes using device cameras.
 * This implementation focuses on camera access and UI without actual barcode scanning.
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
const currentCameraIndex = 0
let facingMode = "environment" // Start with back camera by default

/**
 * Initialize the application
 */
function initApp() {
  // Check if the browser supports mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError(
      "Camera Not Supported",
      "Your browser does not support camera access. Please try using a modern browser like Chrome, Firefox, or Safari.",
    )
    return
  }

  // Check BarcodeDetector API support
  checkBarcodeAPISupport().then(support => {
    console.log('BarcodeDetector API support:', support);
  });

  // Set up event listeners
  cameraSwitchBtn.addEventListener("click", switchCamera)
  retryButton.addEventListener("click", retryCamera)
  manualForm.addEventListener("submit", handleManualSubmit)

  // Start camera
  startCamera()

  // Enumerate available video devices
  enumerateDevices()

  // Set up mobile optimizations
  setupMobileOptimizations()
}

/**
 * Start the camera with the current facing mode
 */
async function startCamera() {
  try {
    // Stop any existing stream
    if (currentStream) {
      stopCurrentStream()
    }

    // Set status message
    updateStatus("Requesting camera access...")

    // Request camera access with preferred facing mode
    const constraints = {
      video: {
        facingMode: facingMode,
        // Adjust for better mobile performance
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        // Add these for better mobile performance
        frameRate: { max: 30 },
      },
      audio: false,
    }

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Set the stream to the video element
    video.srcObject = stream
    currentStream = stream

    // Ensure video plays on iOS
    video.setAttribute('playsinline', true)
    video.setAttribute('autoplay', true)
    video.muted = true

    // iOS sometimes needs a manual play() call
    try {
      await video.play()
    } catch (e) {
      console.warn("Auto-play failed, waiting for user interaction", e)
      // Will need user interaction on iOS
    }

    // Update status
    updateStatus("Camera active. Position barcode in the frame.")

    // Hide any error messages
    errorContainer.classList.add("hidden")

    // Set up barcode detection if available
    if (window.barcodeAPISupport?.supported) {
      setupBarcodeDetection();
    }
  } catch (error) {
    console.error("Error accessing camera:", error)

    // Handle specific errors
    if (error.name === "NotAllowedError") {
      showError(
        "Camera Access Denied",
        "You need to grant camera permission to use the barcode scanner. Please check your browser settings and try again.",
      )
    } else if (error.name === "NotFoundError") {
      showError(
        "No Camera Found",
        "We couldn't find a camera on your device. Please make sure your camera is connected and working properly.",
      )
    } else {
      showError("Camera Error", `There was a problem accessing your camera: ${error.message}`)
    }
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
  // Toggle facing mode
  facingMode = facingMode === "environment" ? "user" : "environment"

  // Update status
  updateStatus("Switching camera...")

  // Restart camera with new facing mode
  startCamera()
}

/**
 * Stop the current video stream
 */
function stopCurrentStream() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      track.stop()
    })
    video.srcObject = null
    currentStream = null
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
  startCamera()
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
    // In a real app, you would process the barcode here
    updateStatus(`Manual barcode entered: ${barcodeValue}`)

    // Clear the input
    barcodeInput.value = ""

    // For demo purposes, just log the value
    console.log("Barcode submitted manually:", barcodeValue)

    // In a real implementation, you would call a function to process the barcode
    // processBarcode(barcodeValue);
  } else {
    updateStatus("Please enter a valid barcode")
  }
}

/**
 * Check if the BarcodeDetector API is supported
 * and display supported formats
 */
async function checkBarcodeAPISupport() {
  // Check if BarcodeDetector exists in the window object
  const isBarcodeDetectorSupported = 'BarcodeDetector' in window;
  
  // Create an element to show support status
  const supportStatusElement = document.createElement('div');
  supportStatusElement.className = 'api-support-status';
  supportStatusElement.style.padding = '10px';
  supportStatusElement.style.backgroundColor = isBarcodeDetectorSupported ? '#e1f5fe' : '#ffebee';
  supportStatusElement.style.marginBottom = '10px';
  supportStatusElement.style.borderRadius = '4px';
  
  if (isBarcodeDetectorSupported) {
    try {
      // Get supported formats
      const supportedFormats = await BarcodeDetector.getSupportedFormats();
      
      supportStatusElement.innerHTML = `
        <strong>Good news!</strong> Your device supports the BarcodeDetector API.<br>
        Supported formats: ${supportedFormats.join(', ')}
      `;
      
      // Store supported formats for later use
      window.barcodeAPISupport = {
        supported: true,
        formats: supportedFormats
      };
    } catch (error) {
      supportStatusElement.innerHTML = `
        <strong>Limited Support:</strong> BarcodeDetector API is available but encountered an error: ${error.message}
      `;
      window.barcodeAPISupport = { supported: false };
    }
  } else {
    supportStatusElement.innerHTML = `
      <strong>Limited Support:</strong> Your browser doesn't support the BarcodeDetector API.<br>
      The app will fall back to manual entry. For better experience, try Chrome on Android.
    `;
    window.barcodeAPISupport = { supported: false };
  }
  
  // Add to the DOM - insert before the manual entry section
  const manualEntry = document.querySelector('.manual-entry');
  manualEntry.parentNode.insertBefore(supportStatusElement, manualEntry);
  
  return window.barcodeAPISupport;
}

/**
 * Set up barcode detection if supported
 */
function setupBarcodeDetection() {
  if (window.barcodeAPISupport?.supported) {
    try {
      const barcodeDetector = new BarcodeDetector({
        // Use all supported formats
        formats: window.barcodeAPISupport.formats
      });
      
      // Process frames every 300ms to prevent performance issues
      let lastDetectionTime = 0;
      
      // Set up detection interval
      const detectionInterval = setInterval(() => {
        if (!currentStream || !video.srcObject || video.paused || video.hidden) {
          return; // Skip if video isn't playing
        }
        
        const now = Date.now();
        if (now - lastDetectionTime < 300) {
          return; // Throttle detection
        }
        
        lastDetectionTime = now;
        
        // Process the current video frame
        barcodeDetector.detect(video)
          .then(barcodes => {
            if (barcodes.length > 0) {
              // We found at least one barcode
              const barcode = barcodes[0]; // Use the first one detected
              
              console.log("Barcode detected:", barcode);
              updateStatus(`Barcode detected: ${barcode.rawValue}`);
              
              // Flash visual feedback
              document.querySelector('.scan-area').style.border = '2px solid #4CAF50';
              setTimeout(() => {
                document.querySelector('.scan-area').style.border = '2px dashed rgba(255, 255, 255, 0.5)';
              }, 500);
              
              // In a real app, you would process the barcode here
              // processBarcode(barcode.rawValue);
            }
          })
          .catch(err => {
            console.error("Barcode detection error:", err);
          });
      }, 100);
      
      // Store the interval ID for cleanup
      window.barcodeDetectionInterval = detectionInterval;
      
      return true;
    } catch (error) {
      console.error("Error setting up barcode detection:", error);
      return false;
    }
  }
  return false;
}

/**
 * Handle fullscreen and orientation for mobile
 */
function setupMobileOptimizations() {
  // Prevent bounce scrolling on iOS
  document.body.addEventListener('touchmove', function(event) {
    event.preventDefault()
  }, { passive: false })
  
  // Lock orientation if supported
  if (screen.orientation && screen.orientation.lock) {
    try {
      // Try to lock to portrait orientation
      screen.orientation.lock('portrait').catch(e => {
        console.warn("Orientation lock not supported:", e)
      })
    } catch (e) {
      console.warn("Orientation API not fully supported")
    }
  }
  
  // Handle iOS standalone mode (when added to home screen)
  if (navigator.standalone) {
    document.body.classList.add('ios-standalone')
  }
}

/**
 * Handle page visibility changes to manage camera resources
 */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, pause the camera to save resources
    if (video.srcObject) {
      video.pause()
    }
  } else {
    // Page is visible again, resume the camera
    if (video.srcObject) {
      video.play()
    }
  }
})

/**
 * Handle orientation changes to adjust the UI
 */
window.addEventListener("orientationchange", () => {
  // Give the browser time to adjust the viewport
  setTimeout(() => {
    // Adjust video display for new orientation
    const videoTrack = currentStream ? currentStream.getVideoTracks()[0] : null
    if (videoTrack) {
      // Force layout recalculation
      video.style.display = 'none'
      requestAnimationFrame(() => {
        video.style.display = 'block'
        console.log("Orientation changed, display adjusted")
      })
    }
  }, 200)
})

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp)
