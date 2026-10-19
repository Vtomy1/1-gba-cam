import { ColorRGB555, DitherAlgorithm } from '../types/gba';

// 4x4 Bayer Matrix normalized to -0.5 to 0.5
const BAYER_4X4 = [
  [ 0/16 - 0.5,  8/16 - 0.5,  2/16 - 0.5, 10/16 - 0.5],
  [12/16 - 0.5,  4/16 - 0.5, 14/16 - 0.5,  6/16 - 0.5],
  [ 3/16 - 0.5, 11/16 - 0.5,  1/16 - 0.5,  9/16 - 0.5],
  [15/16 - 0.5,  7/16 - 0.5, 13/16 - 0.5,  5/16 - 0.5]
];

// 8x8 Bayer Matrix normalized to -0.5 to 0.5
const BAYER_8X8 = [
  [ 0/64 - 0.5, 32/64 - 0.5,  8/64 - 0.5, 40/64 - 0.5,  2/64 - 0.5, 34/64 - 0.5, 10/64 - 0.5, 42/64 - 0.5],
  [48/64 - 0.5, 16/64 - 0.5, 56/64 - 0.5, 24/64 - 0.5, 50/64 - 0.5, 18/64 - 0.5, 58/64 - 0.5, 26/64 - 0.5],
  [12/64 - 0.5, 44/64 - 0.5,  4/64 - 0.5, 36/64 - 0.5, 14/64 - 0.5, 46/64 - 0.5,  6/64 - 0.5, 38/64 - 0.5],
  [60/64 - 0.5, 28/64 - 0.5, 52/64 - 0.5, 20/64 - 0.5, 62/64 - 0.5, 30/64 - 0.5, 54/64 - 0.5, 22/64 - 0.5],
  [ 3/64 - 0.5, 35/64 - 0.5, 11/64 - 0.5, 43/64 - 0.5,  1/64 - 0.5, 33/64 - 0.5,  9/64 - 0.5, 41/64 - 0.5],
  [51/64 - 0.5, 19/64 - 0.5, 59/64 - 0.5, 27/64 - 0.5, 49/64 - 0.5, 17/64 - 0.5, 57/64 - 0.5, 25/64 - 0.5],
  [15/64 - 0.5, 47/64 - 0.5,  7/64 - 0.5, 39/64 - 0.5, 13/64 - 0.5, 45/64 - 0.5,  5/64 - 0.5, 37/64 - 0.5],
  [63/64 - 0.5, 31/64 - 0.5, 55/64 - 0.5, 23/64 - 0.5, 61/64 - 0.5, 29/64 - 0.5, 53/64 - 0.5, 21/64 - 0.5]
];

// Simple precomputed 16x16 blue noise pattern approximation
const BLUE_NOISE_16: number[][] = [];
for (let y = 0; y < 16; y++) {
  const row: number[] = [];
  for (let x = 0; x < 16; x++) {
    // Weyl sequence / Golden ratio 2D quasi-random distribution
    const val = ((x * 0.7548776662466927 + y * 0.5698402909980532) % 1.0) - 0.5;
    row.push(val);
  }
  BLUE_NOISE_16.push(row);
}

/**
 * Finds the nearest palette color index using weighted Euclidean distance
 */
function findNearestColorIndex(r: number, g: number, b: number, palette: ColorRGB555[]): number {
  let bestIdx = 0;
  let minDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const pal = palette[i];
    // Perceptual human eye weights: Red ~ 0.3, Green ~ 0.59, Blue ~ 0.11
    const dr = r - pal.r;
    const dg = g - pal.g;
    const db = b - pal.b;
    const dist = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
    if (dist < minDistance) {
      minDistance = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Applies full dithering and quantization on image data.
 * Outputs:
 * - outPixels: RGBA buffer for display
 * - outIndices: Uint8Array containing 0-15 palette indices for PPU tilemap generation
 */
export function applyDithering(
  srcPixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: ColorRGB555[],
  algorithm: DitherAlgorithm,
  strength: number,
  outPixels: Uint8ClampedArray,
  outIndices: Uint8Array
): void {
  const numPixels = width * height;

  if (algorithm === 'none') {
    for (let i = 0; i < numPixels; i++) {
      const pIdx = i * 4;
      const r = srcPixels[pIdx];
      const g = srcPixels[pIdx + 1];
      const b = srcPixels[pIdx + 2];
      
      const palIdx = findNearestColorIndex(r, g, b, palette);
      outIndices[i] = palIdx;
      
      const palColor = palette[palIdx];
      outPixels[pIdx] = palColor.r;
      outPixels[pIdx + 1] = palColor.g;
      outPixels[pIdx + 2] = palColor.b;
      outPixels[pIdx + 3] = 255;
    }
    return;
  }

  if (algorithm === 'bayer-4x4' || algorithm === 'bayer-8x8' || algorithm === 'blue-noise') {
    const matrix = algorithm === 'bayer-4x4' ? BAYER_4X4 : algorithm === 'bayer-8x8' ? BAYER_8X8 : BLUE_NOISE_16;
    const mSize = matrix.length;
    const spread = 72 * strength;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const i = rowOffset + x;
        const pIdx = i * 4;
        
        const ditherVal = matrix[y % mSize][x % mSize] * spread;
        const r = Math.max(0, Math.min(255, srcPixels[pIdx] + ditherVal));
        const g = Math.max(0, Math.min(255, srcPixels[pIdx + 1] + ditherVal));
        const b = Math.max(0, Math.min(255, srcPixels[pIdx + 2] + ditherVal));

        const palIdx = findNearestColorIndex(r, g, b, palette);
        outIndices[i] = palIdx;

        const palColor = palette[palIdx];
        outPixels[pIdx] = palColor.r;
        outPixels[pIdx + 1] = palColor.g;
        outPixels[pIdx + 2] = palColor.b;
        outPixels[pIdx + 3] = 255;
      }
    }
    return;
  }

  // Error diffusion: Floyd-Steinberg or Atkinson
  // We use Float32Array working buffers to propagate errors
  const bufR = new Float32Array(numPixels);
  const bufG = new Float32Array(numPixels);
  const bufB = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const pIdx = i * 4;
    bufR[i] = srcPixels[pIdx];
    bufG[i] = srcPixels[pIdx + 1];
    bufB[i] = srcPixels[pIdx + 2];
  }

  const isAtkinson = algorithm === 'atkinson';

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const oldR = Math.max(0, Math.min(255, bufR[idx]));
      const oldG = Math.max(0, Math.min(255, bufG[idx]));
      const oldB = Math.max(0, Math.min(255, bufB[idx]));

      const palIdx = findNearestColorIndex(oldR, oldG, oldB, palette);
      outIndices[idx] = palIdx;

      const palColor = palette[palIdx];
      const pIdx = idx * 4;
      outPixels[pIdx] = palColor.r;
      outPixels[pIdx + 1] = palColor.g;
      outPixels[pIdx + 2] = palColor.b;
      outPixels[pIdx + 3] = 255;

      const errR = (oldR - palColor.r) * strength;
      const errG = (oldG - palColor.g) * strength;
      const errB = (oldB - palColor.b) * strength;

      if (isAtkinson) {
        // Atkinson diffuses 1/8 to 6 surrounding neighbours (keeps 25% error for punchy contrast)
        const dR = errR / 8;
        const dG = errG / 8;
        const dB = errB / 8;

        const distribute = (nx: number, ny: number) => {
          if (nx >= 0 && nx < width && ny < height) {
            const targetIdx = ny * width + nx;
            bufR[targetIdx] += dR;
            bufG[targetIdx] += dG;
            bufB[targetIdx] += dB;
          }
        };

        distribute(x + 1, y);
        distribute(x + 2, y);
        distribute(x - 1, y + 1);
        distribute(x, y + 1);
        distribute(x + 1, y + 1);
        distribute(x, y + 2);
      } else {
        // Floyd-Steinberg: 7/16 right, 3/16 down-left, 5/16 down, 1/16 down-right
        const distribute = (nx: number, ny: number, weight: number) => {
          if (nx >= 0 && nx < width && ny < height) {
            const targetIdx = ny * width + nx;
            bufR[targetIdx] += errR * weight;
            bufG[targetIdx] += errG * weight;
            bufB[targetIdx] += errB * weight;
          }
        };

        distribute(x + 1, y, 7 / 16);
        distribute(x - 1, y + 1, 3 / 16);
        distribute(x, y + 1, 5 / 16);
        distribute(x + 1, y + 1, 1 / 16);
      }
    }
  }
}
