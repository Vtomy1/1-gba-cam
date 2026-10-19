import { ColorRGB555, PaletteId } from '../types/gba';

/**
 * Converts standard 8-bit RGB to 15-bit GBA BGR555 format.
 * GBA uses little-endian 16-bit word: bit 0-4 Red, 5-9 Green, 10-14 Blue (bit 15 unused).
 */
export function rgb888ToRgb555(r: number, g: number, b: number): number {
  const r5 = Math.round((Math.max(0, Math.min(255, r)) * 31) / 255);
  const g5 = Math.round((Math.max(0, Math.min(255, g)) * 31) / 255);
  const b5 = Math.round((Math.max(0, Math.min(255, b)) * 31) / 255);
  return (b5 << 10) | (g5 << 5) | r5;
}

/**
 * Converts 15-bit GBA RGB555 format back to standard 8-bit RGB.
 */
export function rgb555ToRgb888(rgb555: number): { r: number; g: number; b: number } {
  const r5 = rgb555 & 0x1f;
  const g5 = (rgb555 >> 5) & 0x1f;
  const b5 = (rgb555 >> 10) & 0x1f;
  return {
    r: Math.round((r5 * 255) / 31),
    g: Math.round((g5 * 255) / 31),
    b: Math.round((b5 * 255) / 31),
  };
}

export function toHexStr(val: number, length: number): string {
  return '0x' + val.toString(16).toUpperCase().padStart(length, '0');
}

export function toHexColor(r: number, g: number, b: number): string {
  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return '#' + hex;
}

export function createColor(r: number, g: number, b: number): ColorRGB555 {
  const rgb555 = rgb888ToRgb555(r, g, b);
  // Reconstruct exact color with 15-bit fidelity
  const { r: rQuant, g: gQuant, b: bQuant } = rgb555ToRgb888(rgb555);
  return {
    r: rQuant,
    g: gQuant,
    b: bQuant,
    hex: toHexColor(rQuant, gQuant, bQuant),
    rgb555,
    hexRgb555: toHexStr(rgb555, 4),
  };
}

// Built-in authentic retro palettes
export const BUILT_IN_PALETTES: Record<PaletteId, ColorRGB555[]> = {
  'dmg-classic': [
    createColor(15, 56, 15),     // Darkest green (black)
    createColor(48, 98, 48),     // Dark green
    createColor(139, 172, 15),   // Light green
    createColor(155, 188, 15),   // Lightest green (white)
  ],
  'gb-pocket': [
    createColor(24, 24, 24),     // Black
    createColor(80, 80, 80),     // Dark Grey
    createColor(160, 160, 160),  // Light Grey
    createColor(228, 228, 228),  // White / Silver
  ],
  'gbc-berry': [
    createColor(24, 16, 40),     // Midnight violet
    createColor(128, 24, 56),    // Berry red
    createColor(216, 64, 88),    // Crimson pink
    createColor(248, 208, 176),  // Warm peach highlight
  ],
  'gbc-cyber': [
    createColor(12, 16, 32),     // Deep navy
    createColor(48, 112, 160),   // Electric steel
    createColor(32, 216, 208),   // Cyan phosphor
    createColor(248, 240, 96),   // Neon lemon
  ],
  'gba-amber': [
    createColor(16, 10, 4),      // Deep espresso
    createColor(96, 56, 16),     // Rustic amber
    createColor(192, 128, 32),   // Golden honey
    createColor(248, 216, 120),  // Warm amber backlight
  ],
  'gba-vivid': [
    createColor(16, 16, 24),     // 0: Deep Shadow
    createColor(56, 40, 56),     // 1: Dark Plum
    createColor(96, 48, 40),     // 2: Brick Rust
    createColor(160, 64, 48),    // 3: Warm Orange-Red
    createColor(224, 112, 64),   // 4: Coral Gold
    createColor(248, 192, 96),   // 5: Warm Sand
    createColor(248, 240, 192),  // 6: Cream Highlight
    createColor(16, 64, 48),     // 7: Pine Shadow
    createColor(40, 120, 72),    // 8: Jungle Green
    createColor(96, 184, 96),    // 9: Bright Mint
    createColor(24, 64, 120),    // 10: Navy Deep
    createColor(48, 128, 192),   // 11: Sky Azure
    createColor(112, 192, 248),  // 12: Cyan Glow
    createColor(104, 64, 136),   // 13: Lavender Purple
    createColor(176, 112, 200),  // 14: Orchid Pink
    createColor(255, 255, 255),  // 15: Pure Flash White
  ],
  'nes-famicom': [
    createColor(0, 0, 0),        // Black
    createColor(116, 116, 116),  // Gray
    createColor(24, 60, 92),     // Navy
    createColor(0, 128, 136),    // Teal
    createColor(68, 40, 188),    // Indigo
    createColor(148, 0, 211),    // Purple
    createColor(168, 16, 0),     // Crimson
    createColor(168, 64, 0),     // Orange-Red
    createColor(136, 112, 0),    // Olive Gold
    createColor(0, 120, 0),      // Forest Green
    createColor(0, 136, 60),     // Emerald
    createColor(60, 188, 252),   // Sky Blue
    createColor(248, 120, 88),   // Salmon
    createColor(252, 160, 68),   // Sunset Peach
    createColor(248, 248, 120),  // Pale Yellow
    createColor(252, 252, 252),  // White
  ],
  'dynamic-16': [
    // Will be dynamically populated via K-means / median cut, fallback to vivid
    createColor(10, 10, 10),
    createColor(35, 35, 35),
    createColor(60, 60, 60),
    createColor(85, 85, 85),
    createColor(110, 110, 110),
    createColor(135, 135, 135),
    createColor(160, 160, 160),
    createColor(185, 185, 185),
    createColor(210, 210, 210),
    createColor(235, 235, 235),
    createColor(255, 255, 255),
    createColor(180, 50, 50),
    createColor(50, 180, 50),
    createColor(50, 50, 180),
    createColor(180, 180, 50),
    createColor(50, 180, 180),
  ],
};

/**
 * Fast dynamic 16-color palette extraction from video frame pixels
 */
export function extractDynamic16Palette(pixels: Uint8ClampedArray, width: number, height: number): ColorRGB555[] {
  // Sample step for real-time 60fps performance
  const step = 8;
  const samples: Array<[number, number, number]> = [];
  
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      samples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
    }
  }

  if (samples.length === 0) return BUILT_IN_PALETTES['gba-vivid'];

  // 16 initial cluster centers across luminance
  samples.sort((a, b) => (0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2]) - (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]));
  const palette: ColorRGB555[] = [];

  for (let i = 0; i < 16; i++) {
    const sampleIdx = Math.floor((i / 15) * (samples.length - 1));
    const [r, g, b] = samples[sampleIdx];
    palette.push(createColor(r, g, b));
  }

  return palette;
}
