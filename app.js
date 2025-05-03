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

  // Set up event listeners
  cameraSwitchBtn.addEventListener("click", switchCamera)
  retryButton.addEventListener("click", retryCamera)
  manualForm.addEventListener("submit", handleManualSubmit)

  // Start camera
  startCamera()

  // Enumerate available video devices
  enumerateDevices()
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
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Set the stream to the video element
    video.srcObject = stream
    currentStream = stream

    // Update status
    updateStatus("Camera active. Position barcode in the frame.")

    // Hide any error messages
    errorContainer.classList.add("hidden")
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
    // You could add specific orientation handling here if needed
    console.log("Orientation changed")
  }, 200)
})

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp)
