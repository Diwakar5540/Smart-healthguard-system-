/**
 * Fingerprint Image Preprocessing Pipeline
 *
 * Steps applied before model inference:
 *   1. Read image from File object
 *   2. Resize to 224×224 (standard CNN input)
 *   3. Convert to grayscale (fingerprint is monochrome)
 *   4. Apply contrast enhancement (CLAHE simulation via histogram stretching)
 *   5. Convert back to RGB (3-channel for CNN input)
 *   6. Normalize pixel values to [0, 1]
 *   7. Convert to tensor-ready format
 *
 * This runs in the browser using Canvas API — no server roundtrip needed.
 * For a production CNN pipeline with OpenCV/PIL, use the Python equivalents.
 */

/**
 * Preprocess a fingerprint image File for model inference.
 * Returns { canvas, imageData, tensor, base64 }
 *
 * @param {File} file - The uploaded image file
 * @param {number} [size=224] - Target size for CNN input
 * @returns {Promise<{ canvas: HTMLCanvasElement, imageData: ImageData, base64: string, stats: object }>}
 */
export async function preprocessFingerprint(file, size = 224) {
  // 1. Load image into an HTMLImageElement
  const img = await loadImage(file);

  // 2. Create off-screen canvas and resize to 224×224
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Draw image centered and scaled (maintain aspect ratio with center-crop)
  const scale = Math.max(size / img.width, size / img.height);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  // 3. Get raw pixel data
  let imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data; // Uint8ClampedArray [R, G, B, A, R, G, B, A, ...]

  // 4. Convert to grayscale (luminance formula)
  const grayscale = new Uint8Array(size * size);
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
    grayscale[i / 4] = gray;
  }

  // 5. Apply advanced Ridge Enhancement (Sharpening + Dynamic Range Stretching)
  const enhanced = applyRidgeEnhancement(grayscale, size);

  // 6. Write enhanced grayscale back as RGB (3-channel)
  for (let i = 0; i < enhanced.length; i++) {
    const px = i * 4;
    pixels[px] = enhanced[i];     // R
    pixels[px + 1] = enhanced[i]; // G
    pixels[px + 2] = enhanced[i]; // B
    pixels[px + 3] = 255;         // A
  }
  ctx.putImageData(imageData, 0, 0);

  // 7. Compute quality stats
  const stats = computeQualityStats(enhanced);

  // 8. Get base64 for API calls
  const base64 = canvas.toDataURL(file.type || "image/jpeg").split(",")[1];

  return {
    canvas,
    imageData,
    base64,
    stats,
    originalSize: { width: img.width, height: img.height },
    processedSize: { width: size, height: size },
  };
}

/**
 * Load a File as an HTMLImageElement.
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Advanced Ridge Enhancement.
 * Combines Laplacian sharpening with piecewise linear transformation to clarify blurry prints.
 *
 * @param {Uint8Array} gray - Grayscale pixel values
 * @param {number} size - Canvas size
 * @returns {Uint8Array} - Enhanced pixel values
 */
function applyRidgeEnhancement(gray, size) {
  const enhanced = new Uint8Array(gray.length);
  
  // 1. Piecewise Linear Stretch (Boost Midtones where ridges live)
  const sorted = [...gray].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.05)]; 
  const hi = sorted[Math.floor(sorted.length * 0.95)];
  const range = (hi - lo) || 1;

  for (let i = 0; i < gray.length; i++) {
    let val = ((gray[i] - lo) / range) * 255;
    enhanced[i] = Math.max(0, Math.min(255, Math.round(val)));
  }

  // 2. Convolution Sharpen (Small 3x3 Sharpen Kernel)
  const sharp = new Uint8Array(enhanced.length);
  const kernel = [
    0, -1,  0,
   -1,  5, -1,
    0, -1,  0
  ];

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += enhanced[(y + ky) * size + (x + kx)] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      sharp[y * size + x] = Math.max(0, Math.min(255, sum));
    }
  }

  return sharp;
}

/**
 * Compute image quality metrics for fingerprint validation.
 *
 * @param {Uint8Array} pixels - Grayscale pixel values
 * @returns {{ mean: number, stdDev: number, contrast: number, quality: string }}
 */
function computeQualityStats(pixels) {
  const n = pixels.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += pixels[i];
  const mean = sum / n;

  let variance = 0;
  for (let i = 0; i < n; i++) variance += (pixels[i] - mean) ** 2;
  const stdDev = Math.sqrt(variance / n);

  // Contrast ratio
  let min = 255, max = 0;
  for (let i = 0; i < n; i++) {
    if (pixels[i] < min) min = pixels[i];
    if (pixels[i] > max) max = pixels[i];
  }
  const contrast = (max - min) / 255;

  // Quality assessment
  let quality = "clear";
  if (stdDev < 20 || contrast < 0.3) quality = "poor";
  else if (stdDev < 40 || contrast < 0.5) quality = "moderate";

  return { mean: Math.round(mean), stdDev: Math.round(stdDev * 10) / 10, contrast: Math.round(contrast * 100) / 100, quality };
}

/**
 * Normalize pixel values to [0, 1] range for tensor conversion.
 * Used when passing to a TensorFlow.js / ONNX model.
 *
 * @param {ImageData} imageData - 224×224 preprocessed image data
 * @returns {Float32Array} - Normalized RGB tensor [224, 224, 3] flattened
 */
export function toNormalizedTensor(imageData) {
  const pixels = imageData.data;
  const tensor = new Float32Array(224 * 224 * 3);
  let idx = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    tensor[idx++] = pixels[i] / 255.0;     // R
    tensor[idx++] = pixels[i + 1] / 255.0; // G
    tensor[idx++] = pixels[i + 2] / 255.0; // B
  }

  return tensor;
}
