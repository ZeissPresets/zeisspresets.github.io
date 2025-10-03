// Main Application Script - AI Camera Pro
class AICameraApp {
    constructor() {
        this.camera = cameraManager;
        this.ai = aiCore;
        this.currentPhoto = null;
        this.isProcessing = false;
        this.gallery = [];
        
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.bindEvents();
        this.loadGallery();
        this.updateSettingsDisplay();
        
        // Listen for toast events from camera manager
        window.addEventListener('showToast', (event) => {
            this.showToast(event.detail.message, event.detail.type);
        });
        
        console.log('AI Camera Pro initialized');
    }

    // Bind all event listeners
    bindEvents() {
        // Camera controls
        document.getElementById('switchCamera').addEventListener('click', () => {
            this.camera.switchCamera();
        });

        document.getElementById('capture').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('autoFocus').addEventListener('click', () => {
            this.camera.activateAIFocus();
        });

        document.getElementById('nightMode').addEventListener('click', () => {
            this.toggleNightMode();
        });

        // AI controls
        document.getElementById('ai-mode').addEventListener('change', (e) => {
            this.updateAISettings({ mode: e.target.value });
        });

        document.getElementById('ai-intensity').addEventListener('input', (e) => {
            document.getElementById('ai-intensity-value').textContent = e.target.value;
            this.updateAISettings({ intensity: parseInt(e.target.value) });
        });

        // Process controls
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processWithAI();
        });

        document.getElementById('saveResult').addEventListener('click', () => {
            this.saveResult();
        });

        document.getElementById('ai-optimize').addEventListener('click', () => {
            this.autoOptimize();
        });

        // Gallery controls
        document.getElementById('gallery-filter').addEventListener('change', (e) => {
            this.filterGallery(e.target.value);
        });

        document.getElementById('clear-gallery').addEventListener('click', () => {
            this.clearGallery();
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    // Capture photo from camera
    capturePhoto() {
        const photo = this.camera.capturePhoto();
        
        if (photo) {
            this.currentPhoto = photo;
            this.displayCapturedPhoto(photo);
            this.analyzePhoto(photo.imageData);
            this.enableProcessing();
            this.showToast('Foto berhasil diambil', 'success');
        } else {
            this.showToast('Gagal mengambil foto', 'error');
        }
    }

    // Display captured photo in before canvas
    displayCapturedPhoto(photo) {
        const canvas = document.getElementById('before-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = photo.width;
        canvas.height = photo.height;
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = photo.dataURL;
    }

    // Analyze photo and update UI
    analyzePhoto(imageData) {
        const analysis = this.ai.models.analysis.analyze(imageData);
        
        // Update analysis bars
        this.updateAnalysisDisplay(analysis);
        
        // Update AI recommendations
        this.updateAIRecommendations(analysis);
        
        return analysis;
    }

    // Update analysis display with new data
    updateAnalysisDisplay(analysis) {
        const elements = {
            brightness: { bar: 'brightness-bar', value: 'brightness-value' },
            contrast: { bar: 'contrast-bar', value: 'contrast-value' },
            focusScore: { bar: 'focus-bar', value: 'focus-value' },
            noiseLevel: { bar: 'noise-bar', value: 'noise-value' }
        };

        Object.entries(elements).forEach(([key, ids]) => {
            const value = analysis[key];
            document.getElementById(ids.bar).style.width = `${value}%`;
            document.getElementById(ids.value).textContent = `${value}%`;
        });

        // Update AI score
        document.getElementById('ai-score').textContent = `${analysis.overallScore}%`;
        document.getElementById('before-score').textContent = `${analysis.overallScore}%`;

        // Update score circle
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.style.background = `conic-gradient(var(--primary) ${analysis.overallScore}%, transparent 0%)`;

        // Update AI conclusion
        this.updateAIConclusion(analysis);
    }

    // Update AI conclusion based on analysis
    updateAIConclusion(analysis) {
        let conclusion = '';
        
        if (analysis.overallScore >= 85) {
            conclusion = 'Kualitas gambar sangat baik!';
        } else if (analysis.overallScore >= 70) {
            conclusion = 'Kualitas gambar baik, dapat ditingkatkan dengan AI';
        } else if (analysis.overallScore >= 50) {
            conclusion = 'Kualitas gambar sedang, butuh enhancement AI';
        } else {
            conclusion = 'Kualitas gambar rendah, disarankan menggunakan AI enhancement';
        }

        document.getElementById('ai-conclusion').textContent = conclusion;
    }

    // Update AI recommendations
    updateAIRecommendations(analysis) {
        const recommendations = this.ai.getAIRecommendations(analysis);
        
        if (recommendations.length > 0) {
            const mainRecommendation = recommendations[0];
            document.getElementById('ai-recommendation').textContent = mainRecommendation.message;
        }
    }

    // Enable processing button
    enableProcessing() {
        document.getElementById('processBtn').disabled = false;
    }

    // Process photo with AI
    async processWithAI() {
        if (!this.currentPhoto || this.isProcessing) return;

        this.isProcessing = true;
        this.showProcessingUI(true);

        try {
            const startTime = Date.now();
            
            // Get current AI settings
            const aiSettings = this.getCurrentAISettings();
            
            // Process with AI
            const result = await this.ai.processImage(this.currentPhoto.imageData, aiSettings);
            
            // Display results
            this.displayAIResults(result);
            
            // Add to gallery
            this.addToGallery(result);
            
            // Show success message
            const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
            this.showToast(`Foto diproses AI dalam ${processTime} detik`, 'success');
            
        } catch (error) {
            console.error('AI processing error:', error);
            this.showToast('Gagal memproses foto dengan AI', 'error');
        } finally {
            this.isProcessing = false;
            this.showProcessingUI(false);
        }
    }

    // Show/hide processing UI
    showProcessingUI(show) {
        const processBtn = document.getElementById('processBtn');
        const progressContainer = document.getElementById('progress-container');
        const resultContainer = document.getElementById('result-container');
        
        if (show) {
            processBtn.disabled = true;
            processBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zM4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM10 8c-.552 0-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5S10.552 8 10 8z"/></svg> Memproses...';
            progressContainer.style.display = 'block';
            resultContainer.style.display = 'none';
            this.startProgressAnimation();
        } else {
            processBtn.disabled = false;
            processBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg> Proses dengan AI';
            progressContainer.style.display = 'none';
            resultContainer.style.display = 'block';
            document.getElementById('saveResult').disabled = false;
        }
    }

    // Start progress animation
    startProgressAnimation() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressTime = document.getElementById('progress-time');
        const progressStage = document.getElementById('progress-stage');
        const steps = document.querySelectorAll('.step');
        
        // Reset steps
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
        steps[0].classList.add('active');
        
        let progress = 0;
        const stages = [
            'Menganalisis gambar...',
            'Memproses HDR+...',
            'Meningkatkan fokus...',
            'Enhancement warna...',
            'Final processing...'
        ];
        
        const interval = setInterval(() => {
            if (progress >= 100) {
                clearInterval(interval);
                return;
            }
            
            progress += Math.random() * 5;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
            
            // Update estimated time
            const remaining = Math.max(0, Math.round((100 - progress) / 5));
            progressTime.textContent = `Estimasi: ${remaining} detik`;
            
            // Update stage
            const stageIndex = Math.floor(progress / 20);
            if (stageIndex < stages.length) {
                progressStage.textContent = stages[stageIndex];
            }
            
            // Update steps
            steps.forEach((step, index) => {
                if (progress >= (index + 1) * 25) {
                    step.classList.add('completed');
                    if (index < steps.length - 1) {
                        steps[index + 1].classList.add('active');
                    }
                }
            });
            
        }, 200);
    }

    // Display AI processing results
    displayAIResults(result) {
        // Display enhanced image
        const afterCanvas = document.getElementById('after-canvas');
        const afterCtx = afterCanvas.getContext('2d');
        
        afterCanvas.width = result.enhancedImage.width;
        afterCanvas.height = result.enhancedImage.height;
        afterCtx.putImageData(result.enhancedImage, 0, 0);
        
        // Update scores
        document.getElementById('after-score').textContent = `${result.finalAnalysis.overallScore}%`;
        
        // Update image stats
        document.getElementById('before-focus').textContent = `${result.analysis.focusScore}%`;
        document.getElementById('before-dynamic').textContent = `${result.analysis.dynamicRange}%`;
        document.getElementById('before-noise').textContent = `${result.analysis.noiseLevel}%`;
        
        document.getElementById('after-focus').textContent = `${result.finalAnalysis.focusScore}%`;
        document.getElementById('after-dynamic').textContent = `${result.finalAnalysis.dynamicRange}%`;
        document.getElementById('after-noise').textContent = `${result.finalAnalysis.noiseLevel}%`;
        
        // Update improvements
        document.getElementById('improvement-quality').textContent = `+${result.improvements.quality}%`;
        document.getElementById('improvement-focus').textContent = `+${result.improvements.focus}%`;
        document.getElementById('improvement-color').textContent = `+${result.improvements.color}%`;
        document.getElementById('improvement-detail').textContent = `+${result.improvements.detail}%`;
        
        // Update AI insights
        document.getElementById('image-type').textContent = this.formatImageType(result.analysis.imageType);
        document.getElementById('ai-model').textContent = 'Neural Network v2.1';
        document.getElementById('process-time').textContent = `${(result.performance.processingTime / 1000).toFixed(1)}s`;
        
        // Store result for saving
        this.currentResult = result;
    }

    // Format image type for display
    formatImageType(type) {
        const types = {
            'portrait': 'Portrait',
            'landscape': 'Landscape',
            'night': 'Night',
            'macro': 'Macro',
            'general': 'General'
        };
        return types[type] || type;
    }

    // Add processed photo to gallery
    addToGallery(result) {
        const canvas = document.getElementById('after-canvas');
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        
        const galleryItem = {
            id: Date.now(),
            dataURL: dataURL,
            analysis: result.finalAnalysis,
            improvements: result.improvements,
            type: result.analysis.imageType,
            timestamp: new Date().toLocaleString(),
            settings: this.getCurrentAISettings()
        };
        
        this.gallery.unshift(galleryItem);
        this.saveGallery();
        this.renderGallery();
    }

    // Render gallery items
    renderGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        const filter = document.getElementById('gallery-filter').value;
        
        // Clear existing items except empty state
        const existingItems = galleryGrid.querySelectorAll('.gallery-item');
        existingItems.forEach(item => item.remove());
        
        // Remove empty state if there are items
        const emptyState = galleryGrid.querySelector('.empty-gallery');
        if (this.gallery.length > 0 && emptyState) {
            emptyState.remove();
        }
        
        // Add gallery items
        this.gallery
            .filter(item => filter === 'all' || item.type === filter)
            .forEach(item => {
                const galleryItem = this.createGalleryItem(item);
                galleryGrid.appendChild(galleryItem);
            });
        
        // Add empty state if no items
        if (this.gallery.length === 0 && !emptyState) {
            galleryGrid.innerHTML = `
                <div class="empty-gallery">
                    <div class="empty-icon">📷</div>
                    <p>Belum ada foto yang diproses AI</p>
                    <small>Ambil foto dan proses dengan AI untuk melihat hasilnya di sini</small>
                </div>
            `;
        }
    }

    // Create gallery item element
    createGalleryItem(item) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <img src="${item.dataURL}" alt="AI Enhanced Photo">
            <div class="gallery-overlay">
                <div class="gallery-info">
                    <span class="gallery-score">${item.analysis.overallScore}%</span>
                    <span class="gallery-type">${this.formatImageType(item.type)}</span>
                </div>
                <div class="gallery-improvement">
                    +${item.improvements.quality}% kualitas
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            this.showGalleryItem(item);
        });
        
        return div;
    }

    // Show gallery item in detail view
    showGalleryItem(item) {
        // In a real app, this would show a modal with the full-size image
        this.showToast(`Membuka foto ${this.formatImageType(item.type)} - Skor: ${item.analysis.overallScore}%`);
    }

    // Filter gallery by type
    filterGallery(type) {
        this.renderGallery();
    }

    // Clear gallery
    clearGallery() {
        if (this.gallery.length === 0) return;
        
        if (confirm('Hapus semua foto dari galeri?')) {
            this.gallery = [];
            this.saveGallery();
            this.renderGallery();
            this.showToast('Galeri dibersihkan', 'success');
        }
    }

    // Save result to file
    saveResult() {
        if (!this.currentResult) return;
        
        const canvas = document.getElementById('after-canvas');
        const link = document.createElement('a');
        link.download = `ai-enhanced-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
        
        this.showToast('Foto berhasil disimpan', 'success');
    }

    // Auto-optimize settings based on current photo
    autoOptimize() {
        if (!this.currentPhoto) {
            this.showToast('Ambil foto terlebih dahulu', 'warning');
            return;
        }
        
        const analysis = this.analyzePhoto(this.currentPhoto.imageData);
        const recommendations = this.ai.getAIRecommendations(analysis);
        
        if (recommendations.length > 0) {
            const mainRecommendation = recommendations[0];
            this.updateAISettings(mainRecommendation.suggestedSetting);
            this.updateSettingsDisplay();
            this.showToast('Pengaturan dioptimasi oleh AI', 'success');
        }
    }

    // Toggle night mode
    toggleNightMode() {
        const nightModeBtn = document.getElementById('nightMode');
        const isActive = nightModeBtn.classList.contains('active');
        
        if (isActive) {
            nightModeBtn.classList.remove('active');
            this.camera.disableNightMode();
        } else {
            nightModeBtn.classList.add('active');
            this.camera.enableNightMode();
        }
    }

    // Update AI settings
    updateAISettings(settings) {
        this.ai.updateSettings(settings);
        this.updateSettingsDisplay();
    }

    // Get current AI settings from UI
    getCurrentAISettings() {
        return {
            intensity: parseInt(document.getElementById('ai-intensity').value),
            mode: document.getElementById('ai-mode').value
        };
    }

    // Update settings display
    updateSettingsDisplay() {
        const intensity = document.getElementById('ai-intensity').value;
        const mode = document.getElementById('ai-mode').value;
        
        document.getElementById('ai-intensity-value').textContent = intensity;
        
        // You can add more UI updates here if needed
    }

    // Load gallery from localStorage
    loadGallery() {
        try {
            const saved = localStorage.getItem('aiCameraGallery');
            if (saved) {
                this.gallery = JSON.parse(saved);
                this.renderGallery();
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.gallery = [];
        }
    }

    // Save gallery to localStorage
    saveGallery() {
        try {
            // Only save recent items to avoid storage issues
            const recentItems = this.gallery.slice(0, 50);
            localStorage.setItem('aiCameraGallery', JSON.stringify(recentItems));
        } catch (error) {
            console.error('Error saving gallery:', error);
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        // Set message and type
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        toast.classList.add('show');
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Clean up resources
    cleanup() {
        this.camera.cleanup();
        console.log('AI Camera Pro cleaned up');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiCameraApp = new AICameraApp();
});