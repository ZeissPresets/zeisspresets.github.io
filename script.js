// Elemen DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const processingCanvas = document.getElementById('processing-canvas');
const startCameraBtn = document.getElementById('start-camera');
const takePhotoBtn = document.getElementById('take-photo');
const uploadPhotoBtn = document.getElementById('upload-photo');
const fileInput = document.getElementById('file-input');
const enhancePhotoBtn = document.getElementById('enhance-photo');
const downloadResultBtn = document.getElementById('download-result');
const resetBtn = document.getElementById('reset');
const originalPhoto = document.getElementById('original-photo');
const enhancedPhoto = document.getElementById('enhanced-photo');
const originalPlaceholder = document.getElementById('original-placeholder');
const enhancedPlaceholder = document.getElementById('enhanced-placeholder');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const timeRemaining = document.getElementById('time-remaining');
const toggleFlashBtn = document.getElementById('toggle-flash');
const switchCameraBtn = document.getElementById('switch-camera');
const toggleGridBtn = document.getElementById('toggle-grid');
const toggleBeautyBtn = document.getElementById('toggle-beauty');
const enhanceToggleBtn = document.getElementById('enhance-toggle');
const galleryBtn = document.getElementById('gallery-btn');
const settingsBtn = document.getElementById('settings-btn');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const errorClose = document.getElementById('error-close');
const steps = document.querySelectorAll('.step');
const currentTimeDisplay = document.getElementById('current-time');
const toggleComparisonBtn = document.getElementById('toggle-comparison');
const comparisonContainer = document.querySelector('.comparison');

// Enhancement options
const sharpnessOption = document.getElementById('sharpness');
const noiseReductionOption = document.getElementById('noise-reduction');
const colorEnhancementOption = document.getElementById('color-enhancement');
const detailEnhancementOption = document.getElementById('detail-enhancement');

// State
let stream = null;
let originalImageData = null;
let enhancedImageData = null;
let isFlashOn = false;
let isGridVisible = true;
let isBeautyModeOn = false;
let isEnhanceModeOn = true;
let currentFacingMode = 'environment';
let enhancementWorker = null;
let processingInterval = null;
let timeUpdateInterval = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

startCameraBtn.addEventListener('click', startCamera);
takePhotoBtn.addEventListener('click', takePhoto);
uploadPhotoBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
enhancePhotoBtn.addEventListener('click', enhancePhoto);
downloadResultBtn.addEventListener('click', downloadResult);
resetBtn.addEventListener('click', resetApp);
toggleFlashBtn.addEventListener('click', toggleFlash);
switchCameraBtn.addEventListener('click', switchCamera);
toggleGridBtn.addEventListener('click', toggleGrid);
toggleBeautyBtn.addEventListener('click', toggleBeauty);
enhanceToggleBtn.addEventListener('click', toggleEnhanceMode);
galleryBtn.addEventListener('click', showGallery);
settingsBtn.addEventListener('click', showSettings);
errorClose.addEventListener('click', () => errorMessage.classList.add('hidden'));
video.addEventListener('click', handleFocus);
toggleComparisonBtn.addEventListener('click', toggleComparisonView);

// Inisialisasi aplikasi
function initApp() {
    initWorker();
    updateTime();
    timeUpdateInterval = setInterval(updateTime, 1000);
    console.log('AI Photo Enhancer Pro dimuat');
}

// Update waktu
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    currentTimeDisplay.textContent = timeString;
}

// Inisialisasi Web Worker
function initWorker() {
    if (window.Worker) {
        try {
            enhancementWorker = new Worker('module.js');
            
            enhancementWorker.onmessage = function(e) {
                const { type, data, progress: workerProgress } = e.data;
                
                if (type === 'progress') {
                    updateProgress(workerProgress);
                } else if (type === 'result') {
                    enhancedImageData = data;
                    displayEnhancedPhoto(enhancedImageData);
                    finishEnhancement();
                } else if (type === 'error') {
                    showError('Terjadi kesalahan dalam pemrosesan AI. Coba lagi.');
                    finishEnhancement();
                }
            };
            
            enhancementWorker.onerror = function(error) {
                console.error('Worker error:', error);
                showError('Web Worker tidak dapat berjalan. Menggunakan fallback processing.');
                enhancementWorker = null;
                finishEnhancement();
            };
        } catch (error) {
            console.error('Failed to initialize worker:', error);
            enhancementWorker = null;
        }
    }
}

// Fungsi untuk menampilkan error
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Fungsi untuk memulai kamera
async function startCamera() {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: currentFacingMode,
                focusMode: 'continuous'
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        startCameraBtn.disabled = true;
        takePhotoBtn.disabled = false;
        toggleFlashBtn.disabled = false;
        switchCameraBtn.disabled = false;
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
    }
}

// Fungsi untuk mengganti kamera
async function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await startCamera();
}

// Fungsi untuk mengontrol flash
function toggleFlash() {
    if (!stream) return;
    
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.torch) {
        isFlashOn = !isFlashOn;
        track.applyConstraints({
            advanced: [{ torch: isFlashOn }]
        }).then(() => {
            toggleFlashBtn.classList.toggle('active', isFlashOn);
        }).catch(error => {
            console.error('Error controlling flash:', error);
            showError('Flash tidak didukung pada perangkat ini.');
        });
    } else {
        showError('Flash tidak didukung pada perangkat ini.');
    }
}

// Fungsi untuk toggle grid
function toggleGrid() {
    isGridVisible = !isGridVisible;
    const gridOverlay = document.querySelector('.grid-overlay');
    gridOverlay.style.display = isGridVisible ? 'block' : 'none';
    toggleGridBtn.classList.toggle('active', isGridVisible);
}

// Fungsi untuk toggle beauty mode
function toggleBeauty() {
    isBeautyModeOn = !isBeautyModeOn;
    toggleBeautyBtn.classList.toggle('active', isBeautyModeOn);
    
    if (isBeautyModeOn) {
        showNotification('Beauty mode diaktifkan');
    } else {
        showNotification('Beauty mode dinonaktifkan');
    }
}

// Fungsi untuk toggle enhance mode
function toggleEnhanceMode() {
    isEnhanceModeOn = !isEnhanceModeOn;
    enhanceToggleBtn.classList.toggle('active', isEnhanceModeOn);
    
    if (isEnhanceModeOn) {
        showNotification('AI Enhancement diaktifkan');
    } else {
        showNotification('AI Enhancement dinonaktifkan');
    }
}

// Fungsi untuk mengambil foto
function takePhoto() {
    try {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        originalImageData = canvas.toDataURL('image/jpeg', 0.9);
        displayOriginalPhoto(originalImageData);
        enhancePhotoBtn.disabled = false;
        
        showNotification('Foto berhasil diambil');
        
    } catch (error) {
        console.error('Error taking photo:', error);
        showError('Gagal mengambil foto. Coba lagi.');
    }
}

// Fungsi untuk menangani upload file
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showError('Silakan pilih file gambar (JPEG, PNG, dll.)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            originalImageData = e.target.result;
            displayOriginalPhoto(originalImageData);
            enhancePhotoBtn.disabled = false;
            showNotification('Foto berhasil diupload');
        } catch (error) {
            console.error('Error loading image:', error);
            showError('Gagal memuat gambar. Pastikan file tidak rusak.');
        }
    };
    
    reader.onerror = function() {
        showError('Gagal membaca file. Coba dengan gambar lain.');
    };
    
    reader.readAsDataURL(file);
    event.target.value = '';
}

// Fungsi untuk menampilkan foto asli
function displayOriginalPhoto(imageData) {
    originalPhoto.src = imageData;
    originalPhoto.classList.remove('hidden');
    originalPlaceholder.classList.add('hidden');
}

// Fungsi untuk memperindah foto
async function enhancePhoto() {
    if (!originalImageData) {
        showError('Ambil atau upload foto terlebih dahulu!');
        return;
    }
    
    if (!isEnhanceModeOn) {
        showError('AI Enhancement dinonaktifkan. Aktifkan terlebih dahulu.');
        return;
    }
    
    progressContainer.classList.remove('hidden');
    progress.style.width = '0%';
    progressText.textContent = '0%';
    timeRemaining.textContent = 'Perkiraan waktu: 10 detik';
    
    steps.forEach(step => step.classList.remove('active'));
    steps[0].classList.add('active');
    
    enhancePhotoBtn.disabled = true;
    takePhotoBtn.disabled = true;
    
    try {
        // Prepare enhancement options
        const options = {
            sharpness: sharpnessOption.checked,
            noiseReduction: noiseReductionOption.checked,
            colorEnhancement: colorEnhancementOption.checked,
            detailEnhancement: detailEnhancementOption.checked,
            beautyMode: isBeautyModeOn
        };
        
        if (enhancementWorker) {
            enhancementWorker.postMessage({
                type: 'enhance',
                imageData: originalImageData,
                options: options
            });
        } else {
            await processWithFallback(options);
        }
    } catch (error) {
        console.error('Error enhancing photo:', error);
        showError('Terjadi kesalahan saat memproses foto. Coba lagi.');
        finishEnhancement();
    }
}

// Fallback processing tanpa worker
async function processWithFallback(options) {
    return new Promise((resolve) => {
        let progressValue = 0;
        let currentStep = 0;
        
        processingInterval = setInterval(() => {
            progressValue += Math.random() * 10;
            if (progressValue >= 100) {
                progressValue = 100;
                clearInterval(processingInterval);
                
                processImageDirectly(options).then(result => {
                    enhancedImageData = result;
                    displayEnhancedPhoto(enhancedImageData);
                    resolve();
                }).catch(error => {
                    console.error('Fallback processing error:', error);
                    showError('Pemrosesan gambar gagal. Coba dengan gambar lain.');
                    resolve();
                });
            }
            
            progress.style.width = `${progressValue}%`;
            progressText.textContent = `${Math.round(progressValue)}%`;
            
            const remaining = Math.round((100 - progressValue) / 10);
            timeRemaining.textContent = `Perkiraan waktu: ${remaining} detik`;
            
            if (progressValue > 25 && currentStep < 1) {
                steps[currentStep].classList.remove('active');
                currentStep = 1;
                steps[currentStep].classList.add('active');
            } else if (progressValue > 50 && currentStep < 2) {
                steps[currentStep].classList.remove('active');
                currentStep = 2;
                steps[currentStep].classList.add('active');
            } else if (progressValue > 75 && currentStep < 3) {
                steps[currentStep].classList.remove('active');
                currentStep = 3;
                steps[currentStep].classList.add('active');
            }
        }, 500);
    });
}

// Fungsi untuk memproses gambar langsung
async function processImageDirectly(options) {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = function() {
                try {
                    processingCanvas.width = img.width;
                    processingCanvas.height = img.height;
                    
                    const ctx = processingCanvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0);
                    
                    let imageData = ctx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
                    
                    // Apply enhancements based on options
                    if (options.sharpness) {
                        imageData = applySharpening(imageData);
                    }
                    
                    if (options.noiseReduction) {
                        imageData = reduceNoise(imageData);
                    }
                    
                    if (options.colorEnhancement) {
                        imageData = enhanceColors(imageData);
                    }
                    
                    if (options.detailEnhancement) {
                        imageData = enhanceDetails(imageData);
                    }
                    
                    if (options.beautyMode) {
                        imageData = applyBeautyFilter(imageData);
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    
                    const enhancedDataURL = processingCanvas.toDataURL('image/jpeg', 0.95);
                    resolve(enhancedDataURL);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = function() {
                reject(new Error('Gagal memuat gambar'));
            };
            
            img.src = originalImageData;
            
        } catch (error) {
            reject(error);
        }
    });
}

// Basic image processing functions
function applySharpening(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);
    
    const kernel = [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                        sum += originalData[idx] * kernel[ky + 1][kx + 1];
                    }
                }
                
                const idx = (y * width + x) * 4 + c;
                data[idx] = Math.max(0, Math.min(255, sum));
            }
        }
    }
    
    return imageData;
}

function reduceNoise(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const values = [];
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                        values.push(originalData[idx]);
                    }
                }
                
                values.sort((a, b) => a - b);
                const median = values[4];
                
                const idx = (y * width + x) * 4 + c;
                data[idx] = median;
            }
        }
    }
    
    return imageData;
}

function enhanceColors(imageData) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const saturation = 1.2;
        
        data[i] = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
        data[i+1] = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
        data[i+2] = Math.max(0, Math.min(255, gray + (b - gray) * saturation));
    }
    
    return imageData;
}

function enhanceDetails(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);
    
    // Local contrast enhancement
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const localContrast = calculateLocalContrast(originalData, x, y, width);
            
            if (localContrast > 10 && localContrast < 100) {
                const enhanceFactor = 1 + (localContrast / 200);
                
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    const center = originalData[idx];
                    
                    let sum = 0;
                    let count = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            if (ky === 0 && kx === 0) continue;
                            const neighborIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += originalData[neighborIdx];
                            count++;
                        }
                    }
                    
                    const average = sum / count;
                    const detail = center - average;
                    data[idx] = Math.max(0, Math.min(255, center + detail * enhanceFactor * 0.3));
                }
            }
        }
    }
    
    return imageData;
}

function applyBeautyFilter(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);
    
    // Simple skin smoothing (beauty filter)
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            // Check if pixel is likely skin tone
            const r = originalData[(y * width + x) * 4];
            const g = originalData[(y * width + x) * 4 + 1];
            const b = originalData[(y * width + x) * 4 + 2];
            
            if (isSkinTone(r, g, b)) {
                // Apply stronger smoothing to skin areas
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let ky = -2; ky <= 2; ky++) {
                        for (let kx = -2; kx <= 2; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += originalData[idx];
                            count++;
                        }
                    }
                    
                    const idx = (y * width + x) * 4 + c;
                    data[idx] = sum / count;
                }
            }
        }
    }
    
    return imageData;
}

function isSkinTone(r, g, b) {
    // Simple skin tone detection
    return r > 95 && g > 40 && b > 20 && 
           Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
           Math.abs(r - g) > 15 && r > g && r > b;
}

function calculateLocalContrast(data, x, y, width) {
    let min = 255;
    let max = 0;
    
    for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
            for (let c = 0; c < 3; c++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                min = Math.min(min, data[idx]);
                max = Math.max(max, data[idx]);
            }
        }
    }
    
    return max - min;
}

// Fungsi untuk update progress
function updateProgress(progressValue) {
    progress.style.width = `${progressValue}%`;
    progressText.textContent = `${Math.round(progressValue)}%`;
    
    const remaining = Math.round((100 - progressValue) / 10);
    timeRemaining.textContent = `Perkiraan waktu: ${remaining} detik`;
    
    if (progressValue > 25 && !steps[1].classList.contains('active')) {
        steps[0].classList.remove('active');
        steps[1].classList.add('active');
    } else if (progressValue > 50 && !steps[2].classList.contains('active')) {
        steps[1].classList.remove('active');
        steps[2].classList.add('active');
    } else if (progressValue > 75 && !steps[3].classList.contains('active')) {
        steps[2].classList.remove('active');
        steps[3].classList.add('active');
    }
}

// Fungsi untuk menampilkan foto yang sudah ditingkatkan
function displayEnhancedPhoto(imageData) {
    enhancedPhoto.src = imageData;
    enhancedPhoto.classList.remove('hidden');
    enhancedPhoto.classList.add('enhanced-appear');
    enhancedPlaceholder.classList.add('hidden');
    showNotification('Foto berhasil diperindah dengan AI');
}

// Fungsi yang dipanggil ketika proses selesai
function finishEnhancement() {
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    
    progress.style.width = '100%';
    progressText.textContent = '100%';
    timeRemaining.textContent = 'Selesai!';
    
    downloadResultBtn.disabled = false;
    takePhotoBtn.disabled = false;
    
    setTimeout(() => {
        progressContainer.classList.add('hidden');
    }, 2000);
}

// Fungsi untuk mengunduh hasil
function downloadResult() {
    if (!enhancedImageData) {
        showError('Tidak ada hasil untuk diunduh!');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.download = `enhanced-photo-${Date.now()}.jpg`;
        link.href = enhancedImageData;
        link.click();
        showNotification('Foto berhasil diunduh');
    } catch (error) {
        console.error('Error downloading result:', error);
        showError('Gagal mengunduh hasil. Coba lagi.');
    }
}

// Fungsi untuk menangani fokus
function handleFocus(e) {
    if (!stream) return;
    
    const rect = video.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    applyAIFocus(x, y);
}

// Fungsi untuk menerapkan fokus AI
function applyAIFocus(x, y) {
    const focusArea = document.getElementById('focus-area');
    focusArea.style.left = `${x * 100}%`;
    focusArea.style.top = `${y * 100}%`;
    
    focusArea.style.animation = 'none';
    setTimeout(() => {
        focusArea.style.animation = 'pulse 2s infinite';
    }, 10);
}

// Fungsi untuk toggle comparison view
function toggleComparisonView() {
    comparisonContainer.classList.toggle('single-view');
    
    if (comparisonContainer.classList.contains('single-view')) {
        toggleComparisonBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Tampilkan Perbandingan';
    } else {
        toggleComparisonBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Tampilkan Hasil Saja';
    }
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add keyframes for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Fungsi untuk menampilkan galeri (placeholder)
function showGallery() {
    showNotification('Fitur galeri akan segera hadir');
}

// Fungsi untuk menampilkan pengaturan (placeholder)
function showSettings() {
    showNotification('Fitur pengaturan akan segera hadir');
}

// Fungsi untuk mereset aplikasi
function resetApp() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    
    video.srcObject = null;
    originalPhoto.src = '';
    enhancedPhoto.src = '';
    originalPhoto.classList.add('hidden');
    enhancedPhoto.classList.add('hidden');
    originalPlaceholder.classList.remove('hidden');
    enhancedPlaceholder.classList.remove('hidden');
    progressContainer.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    startCameraBtn.disabled = false;
    takePhotoBtn.disabled = true;
    enhancePhotoBtn.disabled = true;
    downloadResultBtn.disabled = true;
    toggleFlashBtn.disabled = true;
    switchCameraBtn.disabled = true;
    
    // Reset enhancement options
    sharpnessOption.checked = true;
    noiseReductionOption.checked = true;
    colorEnhancementOption.checked = true;
    detailEnhancementOption.checked = true;
    
    // Reset modes
    isBeautyModeOn = false;
    isEnhanceModeOn = true;
    toggleBeautyBtn.classList.remove('active');
    enhanceToggleBtn.classList.add('active');
    
    // Reset comparison view
    comparisonContainer.classList.remove('single-view');
    toggleComparisonBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Tampilkan Hasil Saja';
    
    originalImageData = null;
    enhancedImageData = null;
    
    showNotification('Aplikasi telah direset');
}