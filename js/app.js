/**
 * Camera App - Main JavaScript
 * This script handles camera access, stream display, and photo capture
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const videoElement = document.getElementById('video');
    const captureButton = document.getElementById('capture');
    const photoElement = document.getElementById('photo');
    const photoContainer = document.getElementById('photo-container');
    const retakeButton = document.getElementById('retake');
    const errorMessage = document.getElementById('error-message');

    // Global stream reference to stop camera when needed
    let stream = null;

    // Check if the browser supports getUserMedia
    const hasGetUserMedia = () => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    };

    /**
     * Initialize the camera stream
     */
    const initCamera = async () => {
        if (!hasGetUserMedia()) {
            displayError('Your browser does not support camera access.');
            return;
        }

        try {
            // Request access to the user's camera with specific constraints for mobile
            // We're setting facingMode to 'user' which is the front camera
            // For back camera, use 'environment' instead
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // Get the media stream
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Connect the stream to the video element
            videoElement.srcObject = stream;
            
            // Safari on iOS requires playing the video explicitly after user interaction
            videoElement.play().catch(error => {
                console.error('Error playing video:', error);
            });
            
            // Show the capture button once camera is ready
            captureButton.disabled = false;
            
            // Hide error message if it was previously shown
            errorMessage.classList.add('hidden');
        } catch (error) {
            // Handle errors when accessing the camera
            handleCameraError(error);
        }
    };

    /**
     * Handle errors when accessing the camera
     */
    const handleCameraError = (error) => {
        console.error('Camera access error:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            displayError('Camera access was denied. Please grant permission to use your camera.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            displayError('No camera found. Please make sure your device has a camera.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            displayError('Camera is already in use by another application.');
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            displayError('Camera constraints not satisfied. Try a different camera.');
        } else {
            displayError(`Error accessing camera: ${error.message}`);
        }
    };

    /**
     * Display error message to the user
     */
    const displayError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    /**
     * Capture a photo from the video stream
     */
    const capturePhoto = () => {
        if (!stream) {
            displayError('Camera stream not available.');
            return;
        }

        try {
            // Create a temporary canvas to capture the video frame
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Set canvas dimensions to match the video
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            
            // Draw the video frame onto the canvas, mirroring it horizontally
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Convert the canvas to a data URL
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            // Set the image source to the captured photo
            photoElement.src = dataUrl;
            
            // Show the photo container
            photoContainer.classList.remove('hidden');
            
            // Optional: Stop the camera stream after capturing
            // stopCamera();
        } catch (error) {
            console.error('Error capturing photo:', error);
            displayError('Failed to capture photo. Please try again.');
        }
    };

    /**
     * Stop the camera stream
     */
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            stream = null;
            videoElement.srcObject = null;
        }
    };

    /**
     * Event listeners
     */
    
    // Initialize camera when the page loads
    initCamera();

    // Capture photo on button click
    captureButton.addEventListener('click', capturePhoto);

    // Retake photo button handler
    retakeButton.addEventListener('click', () => {
        photoContainer.classList.add('hidden');
        
        // If camera was stopped, restart it
        if (!stream) {
            initCamera();
        }
    });

    // Stop camera when page is hidden/closed
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            stopCamera();
        } else if (document.visibilityState === 'visible' && !stream) {
            initCamera();
        }
    });

    // Safari on iOS specific: video might not autoplay properly
    videoElement.addEventListener('loadedmetadata', () => {
        // Try to play the video after metadata is loaded
        videoElement.play().catch(error => {
            console.error('Error playing video after metadata loaded:', error);
        });
    });
});