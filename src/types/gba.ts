/**
 * GBA and Game Boy PPU data structures & configurations
 */

export type ScreenMode = 'GBA_MODE0' | 'GB_DMG' | 'GBA_MODE3';

export type DitherAlgorithm = 
  | 'floyd-steinberg'
  | 'atkinson'
  | 'bayer-4x4'
  | 'bayer-8x8'
  | 'blue-noise'
  | 'none';

export type PaletteId = 
  | 'gba-vivid'
  | 'dmg-classic'
  | 'gb-pocket'
  | 'gbc-berry'
  | 'gbc-cyber'
  | 'gba-amber'
  | 'nes-famicom'
  | 'dynamic-16';

export interface ColorRGB555 {
  r: number; // 0-255 (RGB888)
  g: number;
  b: number;
  hex: string;
  rgb555: number; // 15-bit GBA format: (B5 << 10) | (G5 << 5) | R5
  hexRgb555: string; // 0xXXXX formatted string
}

export interface TileInfo {
  id: number;
  hash: string;
  pixels: Uint8Array; // 64 values (8x8) representing palette index (0-15)
  count: number;
  firstX: number;
  firstY: number;
}

export interface PpuStats {
  width: number;
  height: number;
  tilesX: number;
  tilesY: number;
  totalTiles: number;
  uniqueTiles: number;
  vramTileBytes: number;
  vramMapBytes: number;
  compressionRatio: number;
  fps: number;
  frameCounter: number;
}

export interface GbaRomHeaderData {
  entryPointHex: string; // e.g. "0xEA00002E"
  gameTitle: string; // 12 chars max, e.g. "GBA CAM"
  gameCode: string; // 4 chars max, e.g. "VCAM"
  makerCode: string; // 2 chars max, e.g. "01" (Nintendo)
  fixedByte: number; // 0x96
  mainUnitCode: number; // 0x00
  deviceType: number; // 0x00
  softwareVersion: number; // 0x00
  complementChecksum: number; // Calculated complement checksum byte
  isChecksumValid: boolean;
  rawHeaderBytes: Uint8Array; // 192 bytes (0x000 - 0x0BF)
}

export interface FilterSettings {
  brightness: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  gamma: number; // 0.5 to 2.5 (1.0 default)
  sharpness: number; // 0 to 100 (0 default)
  invert: boolean;
  ditherStrength: number; // 0.0 to 1.5 (1.0 default)
  ditherAlgorithm: DitherAlgorithm;
  paletteId: PaletteId;
  screenMode: ScreenMode;
  fpsLimit: number; // 8, 15, 30, 60
  subpixelGrid: boolean;
  scanlines: boolean;
  phosphorGlow: boolean;
  bezelStyle: 'indigo' | 'sp' | 'clean';
}
