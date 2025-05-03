/**
 * Barcode Scanner Web App
 *
 * A mobile-first web application that uses the device camera to scan barcodes.
 * Features include:
 * - Native BarcodeDetector API with fallback to ZXing
 * - Camera permission handling
 * - Camera switching
 * - Scan guide overlay
 * - Scan results display
 * - Scan history with localStorage
 * - Error handling
 * - Flashlight toggle (when supported)
 * - Manual entry fallback
 */

// Main app class
class BarcodeScannerApp {
    constructor() {
      // DOM elements
      this.video = document.getElementById("video")
      this.scanResult = document.getElementById("scanResult")
      this.resultCode = document.getElementById("resultCode")
      this.resultFormat = document.getElementById("resultFormat")
      this.resultTime = document.getElementById("resultTime")
      this.closeResult = document.getElementById("closeResult")
      this.switchCameraBtn = document.getElementById("switchCamera")
      this.flashlightBtn = document.getElementById("flashlight")
      this.historyToggleBtn = document.getElementById("historyToggle")
      this.historyPanel = document.getElementById("historyPanel")
      this.closeHistoryBtn = document.getElementById("closeHistory")
      this.clearHistoryBtn = document.getElementById("clearHistory")
      this.historyList = document.getElementById("historyList")
      this.emptyHistory = document.getElementById("emptyHistory")
      this.manualEntryForm = document.getElementById("manualEntryForm")
      this.manualCode = document.getElementById("manualCode")
      this.statusMessage = document.getElementById("statusMessage")
      this.statusText = document.getElementById("statusText")
  
      // App state
      this.stream = null
      this.videoTrack = null
      this.cameras = []
      this.currentCamera = 0
      this.detector = null
      this.scanning = false
      this.torchAvailable = false
      this.torchOn = false
      this.scanHistory = []
      this.lastScannedCode = null
      this.scanTimeout = null
  
      // Initialize the app
      this.init()
    }
  
    /**
     * Initialize the app
     */
    async init() {
      // Set up event listeners
      this.setupEventListeners()
  
      // Load scan history from localStorage
      this.loadScanHistory()
  
      // Check for BarcodeDetector support and initialize
      await this.initBarcodeDetector()
  
      // Start the camera
      await this.startCamera()
    }
  
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
      // Close scan result
      this.closeResult.addEventListener("click", () => {
        this.scanResult.classList.add("hidden")
        this.resumeScanning()
      })
  
      // Switch camera
      this.switchCameraBtn.addEventListener("click", () => {
        this.switchCamera()
      })
  
      // Toggle flashlight
      this.flashlightBtn.addEventListener("click", () => {
        this.toggleFlashlight()
      })
  
      // Toggle history panel
      this.historyToggleBtn.addEventListener("click", () => {
        this.historyPanel.classList.remove("hidden")
        this.updateHistoryList()
      })
  
      // Close history panel
      this.closeHistoryBtn.addEventListener("click", () => {
        this.historyPanel.classList.add("hidden")
      })
  
      // Clear history
      this.clearHistoryBtn.addEventListener("click", () => {
        this.clearScanHistory()
      })
  
      // Manual entry form
      this.manualEntryForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const code = this.manualCode.value.trim()
        if (code) {
          this.handleScanResult({
            rawValue: code,
            format: "manual-entry",
          })
          this.manualCode.value = ""
        }
      })
  
      // Handle orientation changes
      window.addEventListener("resize", () => {
        this.adjustVideoSize()
      })
    }
  
    /**
     * Initialize the barcode detector
     * Uses native BarcodeDetector API if available, otherwise falls back to ZXing
     */
    async initBarcodeDetector() {
      try {
        // Check if BarcodeDetector is supported
        if ("BarcodeDetector" in window) {
          // Get supported formats
          const formats = await BarcodeDetector.getSupportedFormats()
          console.log("Supported formats:", formats)
  
          // Create detector with all supported formats
          this.detector = new BarcodeDetector({ formats })
          this.showStatus("Using native BarcodeDetector API", 2000)
        } else {
          // Fall back to ZXing library
          await this.loadZXingLibrary()
          this.showStatus("Using ZXing library for barcode detection", 2000)
        }
      } catch (error) {
        console.error("Error initializing barcode detector:", error)
        this.showStatus("Failed to initialize barcode detector. Please try again.", 3000)
      }
    }
  
    /**
     * Load the ZXing library as a fallback
     */
    async loadZXingLibrary() {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.ZXing) {
          resolve()
          return
        }
  
        // Load ZXing script
        const script = document.createElement("script")
        script.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js"
        script.onload = () => {
          window.ZXing = ZXing // Make ZXing available globally
          resolve()
        }
        script.onerror = () => {
          reject(new Error("Failed to load ZXing library"))
        }
        document.body.appendChild(script)
      })
    }
  
    /**
     * Start the camera and begin scanning
     */
    async startCamera() {
      try {
        // Get available video devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.cameras = devices.filter((device) => device.kind === "videoinput")
  
        // If no cameras found, show error
        if (this.cameras.length === 0) {
          throw new Error("No cameras found on this device")
        }
  
        // Hide switch camera button if only one camera
        if (this.cameras.length <= 1) {
          this.switchCameraBtn.style.display = "none"
        }
  
        // Get camera constraints
        const constraints = {
          video: {
            facingMode: "environment", // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
            deviceId: this.cameras.length > 0 ? { exact: this.cameras[this.currentCamera].deviceId } : undefined,
          },
          audio: false,
        }
  
        // Request camera access
        this.stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.videoTrack = this.stream.getVideoTracks()[0]
  
        // Set video source and play
        this.video.srcObject = this.stream
        await this.video.play()
  
        // Check if torch/flashlight is available
        this.checkTorchAvailability()
  
        // Adjust video size based on orientation
        this.adjustVideoSize()
  
        // Start scanning for barcodes
        this.startScanning()
      } catch (error) {
        console.error("Error starting camera:", error)
  
        // Handle different error types
        if (error.name === "NotAllowedError") {
          this.showStatus("Camera access denied. Please allow camera access and reload the page.", 0)
        } else if (error.name === "NotFoundError") {
          this.showStatus("No camera found on this device.", 0)
        } else {
          this.showStatus(`Camera error: ${error.message}`, 0)
        }
      }
    }
  
    /**
     * Switch between available cameras
     */
    async switchCamera() {
      if (this.cameras.length <= 1) return
  
      // Stop current stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
      }
  
      // Switch to next camera
      this.currentCamera = (this.currentCamera + 1) % this.cameras.length
  
      try {
        // Get new stream with selected camera
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: this.cameras[this.currentCamera].deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
  
        this.videoTrack = this.stream.getVideoTracks()[0]
        this.video.srcObject = this.stream
        await this.video.play()
  
        // Check torch availability for new camera
        this.checkTorchAvailability()
  
        // Resume scanning
        this.startScanning()
      } catch (error) {
        console.error("Error switching camera:", error)
        this.showStatus("Failed to switch camera. Please try again.", 3000)
  
        // Try to restart with the previous camera
        this.currentCamera = (this.currentCamera - 1 + this.cameras.length) % this.cameras.length
        this.startCamera()
      }
    }
  
    /**
     * Check if the torch/flashlight is available on the current camera
     */
    async checkTorchAvailability() {
      try {
        // Check if ImageCapture API is available
        if ("ImageCapture" in window && this.videoTrack) {
          const imageCapture = new ImageCapture(this.videoTrack)
  
          // Check if torch is supported
          const capabilities = this.videoTrack.getCapabilities()
          this.torchAvailable = !!capabilities.torch
  
          // Update flashlight button visibility
          this.flashlightBtn.style.display = this.torchAvailable ? "flex" : "none"
  
          // Reset torch state
          this.torchOn = false
        } else {
          this.torchAvailable = false
          this.flashlightBtn.style.display = "none"
        }
      } catch (error) {
        console.error("Error checking torch availability:", error)
        this.torchAvailable = false
        this.flashlightBtn.style.display = "none"
      }
    }
  
    /**
     * Toggle the flashlight/torch
     */
    async toggleFlashlight() {
      if (!this.torchAvailable || !this.videoTrack) return
  
      try {
        // Toggle torch state
        this.torchOn = !this.torchOn
  
        // Apply torch setting
        await this.videoTrack.applyConstraints({
          advanced: [{ torch: this.torchOn }],
        })
  
        // Update button appearance
        this.flashlightBtn.classList.toggle("active", this.torchOn)
      } catch (error) {
        console.error("Error toggling flashlight:", error)
        this.showStatus("Failed to toggle flashlight", 2000)
      }
    }
  
    /**
     * Adjust video size based on screen orientation
     */
    adjustVideoSize() {
      // Get video dimensions
      const videoWidth = this.video.videoWidth
      const videoHeight = this.video.videoHeight
  
      if (videoWidth === 0 || videoHeight === 0) return
  
      // Get container dimensions
      const containerWidth = this.video.parentElement.clientWidth
      const containerHeight = this.video.parentElement.clientHeight
  
      // Calculate aspect ratios
      const videoRatio = videoWidth / videoHeight
      const containerRatio = containerWidth / containerHeight
  
      // Adjust video size to cover the container while maintaining aspect ratio
      if (containerRatio > videoRatio) {
        this.video.style.width = "100%"
        this.video.style.height = "auto"
      } else {
        this.video.style.width = "auto"
        this.video.style.height = "100%"
      }
    }
  
    /**
     * Start scanning for barcodes
     */
    startScanning() {
      if (this.scanning) return
  
      this.scanning = true
  
      // Use requestAnimationFrame for smooth scanning
      const scan = async () => {
        if (!this.scanning || !this.video || this.video.paused || this.video.ended) {
          return
        }
  
        try {
          let barcodes = []
  
          // Use native BarcodeDetector if available
          if ("BarcodeDetector" in window && this.detector) {
            barcodes = await this.detector.detect(this.video)
          }
          // Otherwise use ZXing as fallback
          else if (window.ZXing) {
            barcodes = await this.scanWithZXing()
          }
  
          // Process detected barcodes
          if (barcodes.length > 0) {
            // Process the first detected barcode
            this.handleScanResult(barcodes[0])
  
            // Pause scanning briefly after detection
            this.pauseScanning()
          }
        } catch (error) {
          console.error("Error during scanning:", error)
        }
  
        // Continue scanning
        if (this.scanning) {
          requestAnimationFrame(scan)
        }
      }
  
      // Start the scanning loop
      requestAnimationFrame(scan)
    }
  
    /**
     * Scan for barcodes using ZXing library (fallback method)
     */
    async scanWithZXing() {
      return new Promise((resolve) => {
        try {
          // Create a canvas to capture the video frame
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
  
          // Set canvas dimensions to match video
          canvas.width = this.video.videoWidth
          canvas.height = this.video.videoHeight
  
          // Draw current video frame to canvas
          context.drawImage(this.video, 0, 0, canvas.width, canvas.height)
  
          // Get image data from canvas
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  
          // Create ZXing reader
          const reader = new ZXing.BrowserMultiFormatReader()
  
          // Try to decode the image
          try {
            const result = reader.decodeFromImageData(imageData)
  
            if (result) {
              // Convert to format compatible with BarcodeDetector API
              resolve([
                {
                  rawValue: result.text,
                  format: result.format.toString().toLowerCase(),
                  boundingBox: null,
                },
              ])
              return
            }
          } catch (error) {
            // No barcode found, which is normal
          }
  
          // No barcode detected
          resolve([])
        } catch (error) {
          console.error("ZXing scanning error:", error)
          resolve([])
        }
      })
    }
  
    /**
     * Handle a successful barcode scan
     */
    handleScanResult(barcode) {
      // Check if this is a duplicate of the last scan
      if (this.lastScannedCode === barcode.rawValue) {
        return
      }
  
      // Update last scanned code
      this.lastScannedCode = barcode.rawValue
  
      // Get current timestamp
      const timestamp = new Date()
      const formattedTime = timestamp.toLocaleTimeString()
      const formattedDate = timestamp.toLocaleDateString()
  
      // Display the scan result
      this.resultCode.textContent = barcode.rawValue
      this.resultFormat.textContent = barcode.format || "unknown"
      this.resultTime.textContent = `${formattedDate} ${formattedTime}`
      this.scanResult.classList.remove("hidden")
  
      // Add to scan history
      this.addToScanHistory({
        code: barcode.rawValue,
        format: barcode.format || "unknown",
        timestamp: timestamp.getTime(),
        formattedTime: `${formattedDate} ${formattedTime}`,
      })
    }
  
    /**
     * Pause scanning temporarily (after successful scan)
     */
    pauseScanning() {
      this.scanning = false
  
      // Clear any existing timeout
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout)
      }
  
      // Resume scanning after delay
      this.scanTimeout = setTimeout(() => {
        this.resumeScanning()
      }, 2000)
    }
  
    /**
     * Resume scanning after pause
     */
    resumeScanning() {
      // Reset last scanned code to allow rescanning the same code
      this.lastScannedCode = null
  
      // Restart scanning if not already scanning
      if (!this.scanning) {
        this.startScanning()
      }
    }
  
    /**
     * Add a scan to the history
     */
    addToScanHistory(scan) {
      // Add to beginning of array
      this.scanHistory.unshift(scan)
  
      // Limit history to 10 items
      if (this.scanHistory.length > 10) {
        this.scanHistory = this.scanHistory.slice(0, 10)
      }
  
      // Save to localStorage
      this.saveScanHistory()
  
      // Update history list if visible
      if (!this.historyPanel.classList.contains("hidden")) {
        this.updateHistoryList()
      }
    }
  
    /**
     * Save scan history to localStorage
     */
    saveScanHistory() {
      try {
        localStorage.setItem("barcodeScans", JSON.stringify(this.scanHistory))
      } catch (error) {
        console.error("Error saving scan history:", error)
      }
    }
  
    /**
     * Load scan history from localStorage
     */
    loadScanHistory() {
      try {
        const savedHistory = localStorage.getItem("barcodeScans")
        if (savedHistory) {
          this.scanHistory = JSON.parse(savedHistory)
        }
      } catch (error) {
        console.error("Error loading scan history:", error)
        this.scanHistory = []
      }
    }
  
    /**
     * Clear scan history
     */
    clearScanHistory() {
      this.scanHistory = []
      this.saveScanHistory()
      this.updateHistoryList()
    }
  
    /**
     * Update the history list in the UI
     */
    updateHistoryList() {
      // Clear current list
      this.historyList.innerHTML = ""
  
      // Show empty message if no history
      if (this.scanHistory.length === 0) {
        this.emptyHistory.style.display = "flex"
        return
      }
  
      // Hide empty message
      this.emptyHistory.style.display = "none"
  
      // Add each scan to the list
      this.scanHistory.forEach((scan) => {
        const item = document.createElement("li")
        item.className = "history-item"
  
        item.innerHTML = `
          <div class="history-item-header">
            <span class="history-item-format">${scan.format}</span>
            <span class="history-item-time">${scan.formattedTime}</span>
          </div>
          <div class="history-item-code">${scan.code}</div>
        `
  
        this.historyList.appendChild(item)
      })
    }
  
    /**
     * Show a status message to the user
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms (0 for persistent)
     */
    showStatus(message, duration = 3000) {
      this.statusText.textContent = message
      this.statusMessage.classList.remove("hidden")
  
      // Clear any existing timeout
      if (this.statusTimeout) {
        clearTimeout(this.statusTimeout)
      }
  
      // Hide after duration (if not persistent)
      if (duration > 0) {
        this.statusTimeout = setTimeout(() => {
          this.statusMessage.classList.add("hidden")
        }, duration)
      }
    }
  
    /**
     * Hide the status message
     */
    hideStatus() {
      this.statusMessage.classList.add("hidden")
    }
  }
  
  // Initialize the app when the DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    new BarcodeScannerApp()
  })
  