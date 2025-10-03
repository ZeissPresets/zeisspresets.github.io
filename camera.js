// Camera Management Module
class CameraManager {
  constructor() {
    this.video = document.getElementById('video');
    this.currentStream = null;
    this.isFrontCamera = true;
    this.isCameraActive = false;
    this.focusIndicator = document.getElementById('focus-indicator');
    this.cameraStatus = document.getElementById('camera-status');
    this.aiStatus = document.getElementById('ai-status');
    
    this.initializeCamera();
  }
  
  // Initialize camera
  async initializeCamera() {
    try {
      await this.startCamera();
      this.isCameraActive = true;
      this.cameraStatus.textContent = 'Kamera Aktif';
      this.aiStatus.textContent = 'AI: Siap';
      this.showToast('Kamera berhasil diaktifkan', 'success');
    } catch (error) {
      console.error('Error initializing camera:', error);
      this.cameraStatus.textContent = 'Kamera Error';
      this.aiStatus.textContent = 'AI: Offline';
      this.showToast('Tidak dapat mengakses kamera', 'error');
    }
  }
  
  // Start camera with specified constraints
  async startCamera() {
    const constraints = {
      video: {
        facingMode: this.isFrontCamera ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false
    };
    
    // Stop existing stream if any
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.currentStream;
      
      // Set up video event listeners
      this.video.onloadedmetadata = () => {
        console.log('Camera resolution:', this.video.videoWidth, 'x', this.video.videoHeight);
      };
      
      this.video.onerror = (error) => {
        console.error('Video error:', error);
        this.showToast('Error video stream', 'error');
      };
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }
  
  // Switch between front and back camera
  async switchCamera() {
    this.isFrontCamera = !this.isFrontCamera;
    this.aiStatus.textContent = 'AI: Switching Camera...';
    
    try {
      await this.startCamera();
      this.aiStatus.textContent = 'AI: Siap';
      this.showToast(`Kamera ${this.isFrontCamera ? 'Depan' : 'Belakang'} diaktifkan`, 'success');
    } catch (error) {
      console.error('Error switching camera:', error);
      this.aiStatus.textContent = 'AI: Error';
      this.showToast('Gagal mengganti kamera', 'error');
    }
  }
  
  // Capture photo from video stream
  capturePhoto() {
    if (!this.isCameraActive) {
      this.showToast('Kamera tidak aktif', 'error');
      return null;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    const context = canvas.getContext('2d');
    
    // Draw current video frame to canvas
    context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for AI processing
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Return both data URL and image data
    return {
      dataURL: canvas.toDataURL('image/jpeg', 0.95),
      imageData: imageData,
      width: canvas.width,
      height: canvas.height
    };
  }
  
  // Activate AI Focus with visual indicator
  activateAIFocus() {
    this.focusIndicator.classList.add('active');
    this.aiStatus.textContent = 'AI: Focusing...';
    
    // Simulate focus process
    setTimeout(() => {
      this.focusIndicator.style.borderColor = 'rgba(16, 185, 129, 0.8)';
      this.aiStatus.textContent = 'AI: Focus Locked';
      this.showToast('AI Focus terkunci', 'success');
    }, 1000);
  }
  
  // Deactivate AI Focus
  deactivateAIFocus() {
    this.focusIndicator.classList.remove('active');
    this.aiStatus.textContent = 'AI: Siap';
  }
  
  // Enable night mode (simulated)
  enableNightMode() {
    this.aiStatus.textContent = 'AI: Night Mode';
    this.video.style.filter = 'brightness(0.8) contrast(1.2)';
    this.showToast('Night Mode diaktifkan', 'success');
  }
  
  // Disable night mode
  disableNightMode() {
    this.aiStatus.textContent = 'AI: Siap';
    this.video.style.filter = 'none';
  }
  
  // Get camera capabilities
  async getCameraCapabilities() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return null;
    }
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      return {
        devices: videoDevices,
        hasMultipleCameras: videoDevices.length > 1,
        currentCamera: this.isFrontCamera ? 'front' : 'back'
      };
    } catch (error) {
      console.error('Error getting camera capabilities:', error);
      return null;
    }
  }
  
  // Take multiple photos for HDR processing
  async captureHDRBrackets() {
    const brackets = [];
    
    // Simulate taking multiple exposures
    for (let i = 0; i < 3; i++) {
      const photo = this.capturePhoto();
      if (photo) {
        brackets.push(photo);
        
        // Simulate different exposures
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return brackets;
  }
  
  // Get current camera settings
  getCameraSettings() {
    if (!this.currentStream) return null;
    
    const videoTrack = this.currentStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
    
    return {
      resolution: {
        width: settings.width || 0,
        height: settings.height || 0,
        frameRate: settings.frameRate || 0
      },
      capabilities: {
        zoom: capabilities.zoom || { min: 1, max: 1 },
        focus: capabilities.focusMode || ['none'],
        exposure: capabilities.exposureMode || ['none']
      },
      current: {
        zoom: settings.zoom || 1,
        focus: settings.focusMode || 'none',
        exposure: settings.exposureMode || 'none'
      }
    };
  }
  
  // Clean up camera resources
  cleanup() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }
    this.isCameraActive = false;
    this.cameraStatus.textContent = 'Kamera Nonaktif';
    this.aiStatus.textContent = 'AI: Offline';
  }
  
  // Utility method to show toast messages
  showToast(message, type = 'info') {
    const event = new CustomEvent('showToast', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }
}

// Create global camera manager instance
const cameraManager = new CameraManager();