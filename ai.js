// AI Core Engine - Advanced Image Processing
class AICore {
    constructor() {
        this.models = {
            hdr: new HDRModel(),
            focus: new FocusModel(),
            enhancement: new EnhancementModel(),
            analysis: new AnalysisModel(),
            style: new StyleTransferModel()
        };
        
        this.settings = {
            intensity: 8,
            mode: 'auto'
        };
        
        this.performance = {
            processingTime: 0,
            memoryUsage: 0,
            modelLoadTime: 0
        };
        
        this.initializeAI();
    }

    // Initialize AI models and resources
    async initializeAI() {
        console.log('Initializing AI Core...');
        
        try {
            // Initialize all AI models
            await Promise.all([
                this.models.hdr.initialize(),
                this.models.focus.initialize(),
                this.models.enhancement.initialize(),
                this.models.analysis.initialize(),
                this.models.style.initialize()
            ]);
            
            this.performance.modelLoadTime = Date.now();
            console.log('AI Core initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AI Core:', error);
            throw error;
        }
    }

    // Main AI processing pipeline
    async processImage(imageData, userSettings = {}) {
        const startTime = Date.now();
        
        // Merge user settings with defaults
        const settings = { ...this.settings, ...userSettings };
        
        try {
            // Step 1: AI Analysis
            const analysis = await this.models.analysis.analyze(imageData);
            
            // Step 2: Determine processing strategy
            const strategy = this.determineProcessingStrategy(analysis, settings);
            
            // Step 3: Apply AI enhancements based on strategy
            let enhancedImage = imageData;
            
            if (strategy.hdr) {
                enhancedImage = await this.models.hdr.process(enhancedImage, settings.intensity);
            }
            
            if (strategy.focus) {
                enhancedImage = await this.models.focus.enhance(enhancedImage, settings.intensity);
            }
            
            if (strategy.enhancement) {
                enhancedImage = await this.models.enhancement.process(enhancedImage, settings);
            }
            
            if (strategy.style) {
                enhancedImage = await this.models.style.apply(enhancedImage, strategy.style);
            }
            
            // Step 4: Final quality assessment
            const finalAnalysis = await this.models.analysis.analyze(enhancedImage);
            
            // Calculate performance metrics
            this.performance.processingTime = Date.now() - startTime;
            this.performance.memoryUsage = this.calculateMemoryUsage(enhancedImage);
            
            return {
                enhancedImage: enhancedImage,
                analysis: analysis,
                finalAnalysis: finalAnalysis,
                strategy: strategy,
                improvements: this.calculateImprovements(analysis, finalAnalysis),
                performance: { ...this.performance }
            };
            
        } catch (error) {
            console.error('AI processing failed:', error);
            throw error;
        }
    }

    // Determine optimal processing strategy based on analysis
    determineProcessingStrategy(analysis, settings) {
        const strategy = {
            hdr: false,
            focus: false,
            enhancement: false,
            style: 'natural'
        };
        
        // Use AI mode if specified, otherwise auto-detect
        const mode = settings.mode !== 'auto' ? settings.mode : analysis.imageType;
        
        // Set strategy based on mode
        switch(mode) {
            case 'portrait':
                strategy.hdr = true;
                strategy.focus = true;
                strategy.enhancement = true;
                strategy.style = 'portrait';
                break;
            case 'landscape':
                strategy.hdr = true;
                strategy.focus = true;
                strategy.enhancement = true;
                strategy.style = 'vibrant';
                break;
            case 'night':
                strategy.hdr = true;
                strategy.focus = true;
                strategy.enhancement = true;
                strategy.style = 'night';
                break;
            case 'macro':
                strategy.focus = true;
                strategy.enhancement = true;
                strategy.style = 'natural';
                break;
            case 'sports':
                strategy.focus = true;
                strategy.enhancement = true;
                strategy.style = 'natural';
                break;
            default: // auto
                strategy.hdr = analysis.dynamicRange < 70;
                strategy.focus = analysis.focusScore < 75;
                strategy.enhancement = true;
                strategy.style = analysis.imageType === 'portrait' ? 'portrait' : 'natural';
        }
        
        return strategy;
    }

    // Calculate improvements between original and enhanced
    calculateImprovements(original, enhanced) {
        return {
            quality: Math.max(0, enhanced.overallScore - original.overallScore),
            focus: Math.max(0, enhanced.focusScore - original.focusScore),
            color: Math.max(0, enhanced.colorScore - original.colorScore),
            detail: Math.max(0, enhanced.detailScore - original.detailScore),
            dynamicRange: Math.max(0, enhanced.dynamicRange - original.dynamicRange),
            noiseReduction: Math.max(0, original.noiseLevel - enhanced.noiseLevel)
        };
    }

    // Calculate memory usage
    calculateMemoryUsage(imageData) {
        return imageData.data.length * 4 / (1024 * 1024); // MB
    }

    // Get AI recommendations based on analysis
    getAIRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.focusScore < 60) {
            recommendations.push({
                type: 'focus',
                priority: 'high',
                message: 'Gunakan AI Focus untuk meningkatkan ketajaman',
                suggestedSetting: { mode: 'sports' }
            });
        }
        
        if (analysis.dynamicRange < 65) {
            recommendations.push({
                type: 'hdr',
                priority: 'high',
                message: 'Aktifkan HDR+ untuk rentang dinamis yang lebih baik',
                suggestedSetting: { mode: 'landscape' }
            });
        }
        
        if (analysis.noiseLevel > 30) {
            recommendations.push({
                type: 'noise',
                priority: 'medium',
                message: 'Tingkatkan noise reduction untuk gambar yang lebih bersih',
                suggestedSetting: { intensity: 9 }
            });
        }
        
        if (analysis.colorScore < 70) {
            recommendations.push({
                type: 'color',
                priority: 'medium',
                message: 'Tingkatkan color enhancement untuk warna yang lebih hidup',
                suggestedSetting: { mode: 'portrait' }
            });
        }
        
        if (analysis.brightness < 50) {
            recommendations.push({
                type: 'exposure',
                priority: 'high',
                message: 'Gambar terlalu gelap, gunakan Night Mode',
                suggestedSetting: { mode: 'night' }
            });
        }
        
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                priority: 'low',
                message: 'Kualitas gambar sudah baik. Pertahankan pengaturan saat ini.',
                suggestedSetting: {}
            });
        }
        
        // Sort by priority
        recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        return recommendations;
    }

    // Update AI settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.settings;
    }

    // Get AI performance metrics
    getPerformanceMetrics() {
        return {
            ...this.performance,
            modelStatus: 'loaded',
            availableMemory: this.getAvailableMemory(),
            processingPower: this.getProcessingPower()
        };
    }

    // Utility methods
    getAvailableMemory() {
        return performance.memory ? performance.memory.jsHeapSizeLimit / (1024 * 1024) : 0;
    }

    getProcessingPower() {
        return navigator.hardwareConcurrency || 4;
    }
}

// HDR Processing Model
class HDRModel {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        // Simulate model loading
        await new Promise(resolve => setTimeout(resolve, 500));
        this.initialized = true;
    }

    async process(imageData, intensity) {
        if (!this.initialized) await this.initialize();
        
        const enhanced = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        const data = enhanced.data;
        const factor = 0.3 + (intensity / 15); // 0.3 to 0.97
        
        // Advanced HDR processing
        this.applyToneMapping(data, factor);
        this.enhanceDetails(data, imageData.width, imageData.height, intensity);
        this.balanceExposure(data);
        
        return enhanced;
    }

    applyToneMapping(data, factor) {
        for (let i = 0; i < data.length; i += 4) {
            // Normalize RGB values
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply adaptive tone mapping curve
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const enhanced = this.reinhardToneMapping(luma, factor);
            
            // Scale RGB values proportionally
            const scale = enhanced / luma;
            data[i] = Math.min(255, r * scale * 255);
            data[i + 1] = Math.min(255, g * scale * 255);
            data[i + 2] = Math.min(255, b * scale * 255);
        }
    }

    reinhardToneMapping(x, factor) {
        return x * (1.0 + x / (factor * factor)) / (1.0 + x);
    }

    enhanceDetails(data, width, height, intensity) {
        const kernel = [
            -1, -1, -1, -1, -1,
            -1,  2,  2,  2, -1,
            -1,  2,  8,  2, -1,
            -1,  2,  2,  2, -1,
            -1, -1, -1, -1, -1
        ];
        
        const temp = new Uint8ClampedArray(data);
        const kernelSize = 5;
        const half = Math.floor(kernelSize / 2);
        const factor = intensity / 20;
        
        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let weight = 0;
                    
                    for (let ky = -half; ky <= half; ky++) {
                        for (let kx = -half; kx <= half; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            const kernelIdx = (ky + half) * kernelSize + (kx + half);
                            sum += temp[idx] * kernel[kernelIdx];
                            weight += kernel[kernelIdx];
                        }
                    }
                    
                    const centerIdx = (y * width + x) * 4 + c;
                    const enhanced = data[centerIdx] + (sum / weight) * factor;
                    data[centerIdx] = Math.max(0, Math.min(255, enhanced));
                }
            }
        }
    }

    balanceExposure(data) {
        // Calculate histogram
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const brightness = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[brightness]++;
        }
        
        // Apply histogram equalization
        const total = data.length / 4;
        let sum = 0;
        const cdf = new Array(256);
        
        for (let i = 0; i < 256; i++) {
            sum += histogram[i];
            cdf[i] = sum / total;
        }
        
        // Map values
        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const mapped = cdf[Math.floor(brightness)] * 255;
            const scale = mapped / brightness;
            
            data[i] = Math.min(255, data[i] * scale);
            data[i + 1] = Math.min(255, data[i + 1] * scale);
            data[i + 2] = Math.min(255, data[i + 2] * scale);
        }
    }
}

// AI Focus Model
class FocusModel {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        await new Promise(resolve => setTimeout(resolve, 300));
        this.initialized = true;
    }

    async enhance(imageData, intensity) {
        if (!this.initialized) await this.initialize();
        
        const enhanced = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        const data = enhanced.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Detect focus areas
        const focusMap = this.analyzeFocusAreas(imageData);
        
        // Apply selective sharpening
        this.selectiveSharpening(data, width, height, focusMap, intensity);
        
        // Enhance edges
        this.enhanceEdges(data, width, height, intensity);
        
        return enhanced;
    }

    analyzeFocusAreas(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const focusMap = new Float32Array(width * height);
        const blockSize = 16;
        
        // Analyze focus in blocks
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                const focus = this.calculateBlockFocus(data, x, y, 
                    Math.min(blockSize, width - x), 
                    Math.min(blockSize, height - y), 
                    width);
                this.setBlockFocus(focusMap, x, y, blockSize, width, height, focus);
            }
        }
        
        return focusMap;
    }

    calculateBlockFocus(data, startX, startY, blockWidth, blockHeight, imageWidth) {
        let edgeStrength = 0;
        let highFreq = 0;
        let sampleCount = 0;
        
        for (let y = startY + 1; y < startY + blockHeight - 1; y += 2) {
            for (let x = startX + 1; x < startX + blockWidth - 1; x += 2) {
                const idx = (y * imageWidth + x) * 4;
                
                // Laplacian filter for edge detection
                const laplacian = this.calculateLaplacian(data, x, y, imageWidth);
                edgeStrength += Math.abs(laplacian);
                
                // High frequency content
                const gradient = this.calculateGradient(data, x, y, imageWidth);
                highFreq += gradient;
                
                sampleCount++;
            }
        }
        
        return sampleCount > 0 ? (edgeStrength * 0.7 + highFreq * 0.3) / sampleCount : 0;
    }

    calculateLaplacian(data, x, y, width) {
        const center = this.getBrightness(data, (y * width + x) * 4);
        const top = this.getBrightness(data, ((y-1) * width + x) * 4);
        const bottom = this.getBrightness(data, ((y+1) * width + x) * 4);
        const left = this.getBrightness(data, (y * width + (x-1)) * 4);
        const right = this.getBrightness(data, (y * width + (x+1)) * 4);
        
        return (top + bottom + left + right) - 4 * center;
    }

    calculateGradient(data, x, y, width) {
        const dx = this.getBrightness(data, (y * width + (x+1)) * 4) - 
                  this.getBrightness(data, (y * width + (x-1)) * 4);
        const dy = this.getBrightness(data, ((y+1) * width + x) * 4) - 
                  this.getBrightness(data, ((y-1) * width + x) * 4);
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    setBlockFocus(focusMap, x, y, blockSize, width, height, focus) {
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
                focusMap[(y + dy) * width + (x + dx)] = focus;
            }
        }
    }

    selectiveSharpening(data, width, height, focusMap, intensity) {
        const sharpeningFactor = intensity / 15; // 0.07 to 0.67
        const threshold = 0.3;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const focus = focusMap[y * width + x];
                
                if (focus > threshold) {
                    const idx = (y * width + x) * 4;
                    
                    // Unsharp masking
                    for (let c = 0; c < 3; c++) {
                        const laplacian = this.calculateLaplacian(data, x, y, width);
                        const enhanced = data[idx + c] + laplacian * sharpeningFactor * focus;
                        data[idx + c] = Math.max(0, Math.min(255, enhanced));
                    }
                }
            }
        }
    }

    enhanceEdges(data, width, height, intensity) {
        const edgeFactor = intensity / 20;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const gradient = this.calculateGradient(data, x, y, width);
                
                if (gradient > 10) { // Edge threshold
                    for (let c = 0; c < 3; c++) {
                        const enhanced = data[idx + c] * (1 + edgeFactor);
                        data[idx + c] = Math.max(0, Math.min(255, enhanced));
                    }
                }
            }
        }
    }

    getBrightness(data, index) {
        return 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    }
}

// Enhancement Model
class EnhancementModel {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        await new Promise(resolve => setTimeout(resolve, 400));
        this.initialized = true;
    }

    async process(imageData, settings) {
        if (!this.initialized) await this.initialize();
        
        const enhanced = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        const data = enhanced.data;
        
        // Apply all enhancements
        this.enhanceColors(data, settings.intensity);
        this.reduceNoise(data, imageData.width, imageData.height, settings.intensity);
        this.enhanceSharpness(data, imageData.width, imageData.height, settings.intensity);
        
        return enhanced;
    }

    enhanceColors(data, intensity) {
        const saturationFactor = 0.7 + (intensity / 10); // 0.7 to 1.7
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            
            const newSaturation = Math.min(1, saturation * saturationFactor);
            
            if (newSaturation > saturation) {
                const adjust = (newSaturation - saturation) / saturation;
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                
                data[i] = Math.min(255, gray + (r - gray) * (1 + adjust));
                data[i + 1] = Math.min(255, gray + (g - gray) * (1 + adjust));
                data[i + 2] = Math.min(255, gray + (b - gray) * (1 + adjust));
            }
        }
    }

    reduceNoise(data, width, height, intensity) {
        if (intensity === 0) return;
        
        const kernelSize = intensity <= 3 ? 3 : intensity <= 7 ? 5 : 7;
        const temp = new Uint8ClampedArray(data);
        const half = Math.floor(kernelSize / 2);
        
        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                for (let c = 0; c < 3; c++) {
                    const values = [];
                    
                    for (let dy = -half; dy <= half; dy++) {
                        for (let dx = -half; dx <= half; dx++) {
                            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                            values.push(temp[idx]);
                        }
                    }
                    
                    // Median filter
                    values.sort((a, b) => a - b);
                    const median = values[Math.floor(values.length / 2)];
                    
                    const centerIdx = (y * width + x) * 4 + c;
                    // Blend based on intensity
                    const blend = intensity / 20;
                    data[centerIdx] = data[centerIdx] * (1 - blend) + median * blend;
                }
            }
        }
    }

    enhanceSharpness(data, width, height, intensity) {
        if (intensity === 0) return;
        
        const amount = 0.2 + (intensity / 15); // 0.2 to 0.87
        const temp = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    // Simple sharpening kernel
                    let sum = 0;
                    sum += temp[((y-1)*width + x) * 4 + c] * -1;
                    sum += temp[(y*width + (x-1)) * 4 + c] * -1;
                    sum += temp[idx] * 5;
                    sum += temp[(y*width + (x+1)) * 4 + c] * -1;
                    sum += temp[((y+1)*width + x) * 4 + c] * -1;
                    
                    const sharpened = temp[idx] + sum * amount;
                    data[idx] = Math.max(0, Math.min(255, sharpened));
                }
            }
        }
    }
}

// Analysis Model
class AnalysisModel {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        await new Promise(resolve => setTimeout(resolve, 200));
        this.initialized = true;
    }

    async analyze(imageData) {
        if (!this.initialized) await this.initialize();
        
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        return {
            brightness: this.calculateBrightness(data),
            contrast: this.calculateContrast(data),
            focusScore: this.calculateFocusScore(data, width, height),
            colorScore: this.calculateColorScore(data),
            noiseLevel: this.calculateNoiseLevel(data, width, height),
            dynamicRange: this.calculateDynamicRange(data),
            detailScore: this.calculateDetailScore(data, width, height),
            imageType: this.classifyImageType(data, width, height),
            overallScore: this.calculateOverallScore(data, width, height)
        };
    }

    calculateBrightness(data) {
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
            total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avg = total / (data.length / 4);
        return Math.round((avg / 255) * 100);
    }

    calculateContrast(data) {
        const brightness = [];
        for (let i = 0; i < data.length; i += 4) {
            brightness.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        
        const mean = brightness.reduce((a, b) => a + b) / brightness.length;
        const variance = brightness.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / brightness.length;
        const stdDev = Math.sqrt(variance);
        
        return Math.round((stdDev / 64) * 100);
    }

    calculateFocusScore(data, width, height) {
        let edgeStrength = 0;
        let sampleCount = 0;
        
        for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
                const idx = (y * width + x) * 4;
                const dx = this.getBrightness(data, (y * width + (x+1)) * 4) - 
                          this.getBrightness(data, (y * width + (x-1)) * 4);
                const dy = this.getBrightness(data, ((y+1) * width + x) * 4) - 
                          this.getBrightness(data, ((y-1) * width + x) * 4);
                
                edgeStrength += Math.sqrt(dx * dx + dy * dy);
                sampleCount++;
            }
        }
        
        const avgEdge = sampleCount > 0 ? edgeStrength / sampleCount : 0;
        return Math.round(Math.min(100, (avgEdge / 10) * 100));
    }

    calculateColorScore(data) {
        let rTotal = 0, gTotal = 0, bTotal = 0;
        let saturationTotal = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            rTotal += data[i];
            gTotal += data[i + 1];
            bTotal += data[i + 2];
            
            const max = Math.max(data[i], data[i + 1], data[i + 2]);
            const min = Math.min(data[i], data[i + 1], data[i + 2]);
            saturationTotal += max === 0 ? 0 : (max - min) / max;
        }
        
        const pixelCount = data.length / 4;
        const rAvg = rTotal / pixelCount;
        const gAvg = gTotal / pixelCount;
        const bAvg = bTotal / pixelCount;
        
        // Color balance score
        const maxAvg = Math.max(rAvg, gAvg, bAvg);
        const minAvg = Math.min(rAvg, gAvg, bAvg);
        const balanceScore = 100 - ((maxAvg - minAvg) / 255 * 100);
        
        // Saturation score
        const saturationScore = (saturationTotal / pixelCount) * 100;
        
        return Math.round((balanceScore * 0.4 + saturationScore * 0.6));
    }

    calculateNoiseLevel(data, width, height) {
        let totalVariation = 0;
        let sampleCount = 0;
        
        for (let y = 1; y < height - 1; y += 3) {
            for (let x = 1; x < width - 1; x += 3) {
                const idx = (y * width + x) * 4;
                const center = this.getBrightness(data, idx);
                
                let variation = 0;
                let neighbors = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        variation += Math.abs(center - this.getBrightness(data, nIdx));
                        neighbors++;
                    }
                }
                
                totalVariation += variation / neighbors;
                sampleCount++;
            }
        }
        
        const avgVariation = sampleCount > 0 ? totalVariation / sampleCount : 0;
        return Math.round(Math.min(100, avgVariation * 2));
    }

    calculateDynamicRange(data) {
        let min = 255, max = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = this.getBrightness(data, i);
            min = Math.min(min, brightness);
            max = Math.max(max, brightness);
        }
        
        const range = max - min;
        return Math.round((range / 255) * 100);
    }

    calculateDetailScore(data, width, height) {
        // Similar to focus score but with different weighting
        return this.calculateFocusScore(data, width, height) * 0.8 + 
               this.calculateContrast(data) * 0.2;
    }

    classifyImageType(data, width, height) {
        const brightness = this.calculateBrightness(data);
        const contrast = this.calculateContrast(data);
        const focus = this.calculateFocusScore(data, width, height);
        const color = this.calculateColorScore(data);
        
        if (brightness < 40) return 'night';
        if (contrast > 75 && focus > 70) return 'landscape';
        if (color > 75 && focus > 65) return 'portrait';
        if (focus > 80) return 'macro';
        return 'general';
    }

    calculateOverallScore(data, width, height) {
        const brightness = this.calculateBrightness(data);
        const contrast = this.calculateContrast(data);
        const focus = this.calculateFocusScore(data, width, height);
        const color = this.calculateColorScore(data);
        const noise = 100 - this.calculateNoiseLevel(data, width, height);
        const dynamic = this.calculateDynamicRange(data);
        const detail = this.calculateDetailScore(data, width, height);
        
        const weights = {
            brightness: 0.10,
            contrast: 0.15,
            focus: 0.25,
            color: 0.20,
            noise: 0.15,
            dynamic: 0.10,
            detail: 0.05
        };
        
        let overall = 0;
        overall += brightness * weights.brightness;
        overall += contrast * weights.contrast;
        overall += focus * weights.focus;
        overall += color * weights.color;
        overall += noise * weights.noise;
        overall += dynamic * weights.dynamic;
        overall += detail * weights.detail;
        
        return Math.round(overall);
    }

    getBrightness(data, index) {
        return 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    }
}

// Style Transfer Model
class StyleTransferModel {
    constructor() {
        this.initialized = false;
        this.styles = {
            natural: { saturation: 1.0, contrast: 1.0, warmth: 0 },
            portrait: { saturation: 1.1, contrast: 1.2, warmth: 0.1 },
            vibrant: { saturation: 1.3, contrast: 1.4, warmth: 0 },
            night: { saturation: 0.9, contrast: 1.3, warmth: -0.1 }
        };
    }

    async initialize() {
        await new Promise(resolve => setTimeout(resolve, 600));
        this.initialized = true;
    }

    async apply(imageData, style) {
        if (!this.initialized) await this.initialize();
        
        const enhanced = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        const data = enhanced.data;
        const styleSettings = this.styles[style] || this.styles.natural;
        
        this.applyStyle(data, styleSettings);
        
        return enhanced;
    }

    applyStyle(data, style) {
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            
            // Apply saturation
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * style.saturation;
            g = gray + (g - gray) * style.saturation;
            b = gray + (b - gray) * style.saturation;
            
            // Apply warmth (color temperature)
            if (style.warmth > 0) {
                r = Math.min(255, r * (1 + style.warmth));
                b = Math.max(0, b * (1 - style.warmth * 0.5));
            } else if (style.warmth < 0) {
                r = Math.max(0, r * (1 + style.warmth * 0.5));
                b = Math.min(255, b * (1 - style.warmth));
            }
            
            // Apply contrast
            r = this.applyContrast(r, style.contrast);
            g = this.applyContrast(g, style.contrast);
            b = this.applyContrast(b, style.contrast);
            
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
    }

    applyContrast(value, contrast) {
        return (value - 127.5) * contrast + 127.5;
    }
}

// Create global AI Core instance
const aiCore = new AICore();