// Web Worker untuk AI Image Enhancement
let isProcessing = false;

self.addEventListener('message', function(e) {
  if (isProcessing) return;
  
  const { type, imageData, options } = e.data;
  
  if (type === 'enhance') {
    isProcessing = true;
    enhanceImageWithAI(imageData, options).then(result => {
      self.postMessage({
        type: 'result',
        data: result
      });
      isProcessing = false;
    }).catch(error => {
      console.error('Error in worker:', error);
      self.postMessage({
        type: 'error',
        data: 'Gagal memproses gambar di worker'
      });
      isProcessing = false;
    });
  }
});

// Fungsi utama untuk meningkatkan kualitas gambar dengan AI
async function enhanceImageWithAI(imageData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = new OffscreenCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          let imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Simulate AI processing time
          const processingTime = 10000; // 10 seconds
          const startTime = Date.now();
          const updateInterval = 500;
          
          const processInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / processingTime) * 100);
            
            self.postMessage({ type: 'progress', progress: progress });
            
            if (elapsed >= processingTime) {
              clearInterval(processInterval);
              
              try {
                // Apply AI enhancement algorithms based on options
                if (options.sharpness !== false) {
                  imageDataObj = applyAdvancedSharpening(imageDataObj);
                }
                
                if (options.noiseReduction !== false) {
                  imageDataObj = applyAdvancedNoiseReduction(imageDataObj);
                }
                
                if (options.colorEnhancement !== false) {
                  imageDataObj = applyAdvancedColorEnhancement(imageDataObj);
                }
                
                if (options.detailEnhancement !== false) {
                  imageDataObj = applyDetailEnhancement(imageDataObj);
                }
                
                if (options.beautyMode) {
                  imageDataObj = applyBeautyFilter(imageDataObj);
                }
                
                // Apply HDR effect if all enhancements are enabled
                if (options.sharpness !== false && options.noiseReduction !== false && 
                    options.colorEnhancement !== false && options.detailEnhancement !== false) {
                  imageDataObj = applyHDREffect(imageDataObj);
                }
                
                // Return processed data
                ctx.putImageData(imageDataObj, 0, 0);
                
                // Convert to blob
                canvas.convertToBlob({
                  quality: 0.95,
                  type: 'image/jpeg'
                }).then(blob => {
                  const reader = new FileReader();
                  reader.onload = function() {
                    resolve(reader.result);
                  };
                  reader.onerror = function() {
                    reject(new Error('Gagal membaca blob'));
                  };
                  reader.readAsDataURL(blob);
                }).catch(reject);
                
              } catch (error) {
                reject(error);
              }
            }
          }, updateInterval);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = function() {
        reject(new Error('Gagal memuat gambar di worker'));
      };
      
      img.src = imageData;
      
    } catch (error) {
      reject(error);
    }
  });
}

// AI Enhancement Algorithm
function applyAdvancedSharpening(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const originalData = new Uint8ClampedArray(data);
  
  const kernel = [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1]
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

function applyAdvancedNoiseReduction(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const originalData = new Uint8ClampedArray(data);
  
  // Bilateral filter approximation
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const spatialDist = Math.sqrt(ky * ky + kx * kx);
            const rangeDist = Math.abs(originalData[idx] - originalData[(y * width + x) * 4 + c]);
            
            const spatialWeight = Math.exp(-(spatialDist * spatialDist) / 8);
            const rangeWeight = Math.exp(-(rangeDist * rangeDist) / 64);
            
            const weight = spatialWeight * rangeWeight;
            sum += originalData[idx] * weight;
            weightSum += weight;
          }
        }
        
        const idx = (y * width + x) * 4 + c;
        data[idx] = sum / weightSum;
      }
    }
  }
  
  return imageData;
}

function applyAdvancedColorEnhancement(imageData) {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Increase saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta > 0) {
      const saturation = 1.3;
      const factor = saturation * (1 - (delta / 255));
      
      data[i] = r + (max - r) * factor;
      data[i + 1] = g + (max - g) * factor;
      data[i + 2] = b + (max - b) * factor;
    }
    
    // Enhance vibrance (selective saturation)
    const avg = (r + g + b) / 3;
    if (Math.abs(r - avg) > 30 || Math.abs(g - avg) > 30 || Math.abs(b - avg) > 30) {
      // This pixel has significant color, enhance it more
      const vibrance = 1.1;
      data[i] = Math.max(0, Math.min(255, r * vibrance));
      data[i + 1] = Math.max(0, Math.min(255, g * vibrance));
      data[i + 2] = Math.max(0, Math.min(255, b * vibrance));
    }
    
    // Ensure values are within bounds
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }
  
  return imageData;
}

function applyDetailEnhancement(imageData) {
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
  
  // Advanced skin smoothing with edge preservation
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      // Check if pixel is likely skin tone
      const r = originalData[(y * width + x) * 4];
      const g = originalData[(y * width + x) * 4 + 1];
      const b = originalData[(y * width + x) * 4 + 2];
      
      if (isSkinTone(r, g, b)) {
        // Check if this is an edge (high local contrast)
        const localContrast = calculateLocalContrast(originalData, x, y, width);
        
        if (localContrast < 50) { // Not an edge, apply smoothing
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            let weightSum = 0;
            
            for (let ky = -2; ky <= 2; ky++) {
              for (let kx = -2; kx <= 2; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                const dist = Math.sqrt(ky * ky + kx * kx);
                const weight = Math.exp(-dist * dist / 2);
                
                sum += originalData[idx] * weight;
                weightSum += weight;
              }
            }
            
            const idx = (y * width + x) * 4 + c;
            // Blend original and smoothed (70% smoothed, 30% original)
            data[idx] = 0.7 * (sum / weightSum) + 0.3 * originalData[idx];
          }
        }
      }
    }
  }
  
  return imageData;
}

function applyHDREffect(imageData) {
  const data = imageData.data;
  
  // Simple tone mapping for HDR effect
  for (let i = 0; i < data.length; i += 4) {
    // Increase dynamic range
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Apply S-curve for contrast
    const contrast = 1.2;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    data[i] = factor * (r - 128) + 128;
    data[i + 1] = factor * (g - 128) + 128;
    data[i + 2] = factor * (b - 128) + 128;
    
    // Ensure values are within bounds
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }
  
  return imageData;
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

function isSkinTone(r, g, b) {
  // Advanced skin tone detection
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Rule-based skin detection
  return (
    r > 95 && g > 40 && b > 20 &&
    max - min > 15 &&
    Math.abs(r - g) > 15 &&
    r > g && r > b &&
    (r - g) >= (r - b) / 2 &&
    !(r > 190 && g > 190 && b > 190) // Not too close to white
  );
}