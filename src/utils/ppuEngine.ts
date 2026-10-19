import { PpuStats, TileInfo } from '../types/gba';

export interface PpuProcessingResult {
  tileMap: Uint16Array; // Screenblock entries (tilesX * tilesY)
  uniqueTiles: TileInfo[]; // Character block 0 tiles
  stats: PpuStats;
  raw4bppBytes: Uint8Array; // 32 bytes per unique tile
}

/**
 * Processes an indexed pixel frame into authentic GBA PPU tiles and tilemap.
 */
export function processPpuTiles(
  indices: Uint8Array,
  width: number,
  height: number,
  fps: number,
  frameCounter: number
): PpuProcessingResult {
  const tilesX = Math.floor(width / 8);
  const tilesY = Math.floor(height / 8);
  const totalTiles = tilesX * tilesY;

  const tileMap = new Uint16Array(totalTiles);
  const tileBankMap = new Map<string, number>();
  const uniqueTiles: TileInfo[] = [];

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tileIndexInMap = ty * tilesX + tx;
      const tilePixels = new Uint8Array(64);

      // Extract 8x8 pixels
      let hash = '';
      let pixelPtr = 0;
      for (let py = 0; py < 8; py++) {
        const yCoord = ty * 8 + py;
        const rowOffset = yCoord * width;
        for (let px = 0; px < 8; px++) {
          const xCoord = tx * 8 + px;
          const val = indices[rowOffset + xCoord] & 0x0f;
          tilePixels[pixelPtr++] = val;
          hash += val.toString(16);
        }
      }

      let tileId = tileBankMap.get(hash);
      if (tileId === undefined) {
        // Limit VRAM tile bank to 1024 tiles (GBA Charblock capacity)
        if (uniqueTiles.length < 1024) {
          tileId = uniqueTiles.length;
          tileBankMap.set(hash, tileId);
          uniqueTiles.push({
            id: tileId,
            hash,
            pixels: tilePixels,
            count: 1,
            firstX: tx * 8,
            firstY: ty * 8,
          });
        } else {
          // If capacity exceeded, map to tile 0
          tileId = 0;
        }
      } else {
        uniqueTiles[tileId].count++;
      }

      // GBA Mode 0 Screen Block format:
      // Bits 0-9: Tile Index (0-1023)
      // Bit 10: Horizontal Flip (0)
      // Bit 11: Vertical Flip (0)
      // Bits 12-15: Palette Bank (0)
      tileMap[tileIndexInMap] = tileId & 0x3ff;
    }
  }

  // Generate 4bpp binary data for GBA VRAM (32 bytes per 8x8 tile)
  // In 4bpp, 1 byte contains 2 pixels: low nibble = pixel 0, high nibble = pixel 1
  const raw4bppBytes = new Uint8Array(uniqueTiles.length * 32);
  for (let t = 0; t < uniqueTiles.length; t++) {
    const tile = uniqueTiles[t];
    const offset = t * 32;
    for (let i = 0; i < 32; i++) {
      const p0 = tile.pixels[i * 2] & 0x0f;
      const p1 = tile.pixels[i * 2 + 1] & 0x0f;
      raw4bppBytes[offset + i] = (p1 << 4) | p0;
    }
  }

  const vramTileBytes = raw4bppBytes.length;
  const vramMapBytes = totalTiles * 2;
  const rawUncompressedBytes = totalTiles * 32;
  const savings = Math.max(0, 1 - uniqueTiles.length / totalTiles);
  const compressionRatio = Math.round(savings * 1000) / 10;

  const stats: PpuStats = {
    width,
    height,
    tilesX,
    tilesY,
    totalTiles,
    uniqueTiles: uniqueTiles.length,
    vramTileBytes,
    vramMapBytes,
    compressionRatio,
    fps,
    frameCounter,
  };

  return {
    tileMap,
    uniqueTiles,
    stats,
    raw4bppBytes,
  };
}
