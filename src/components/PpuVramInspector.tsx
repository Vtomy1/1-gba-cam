import React, { useState } from 'react';
import { Cpu, HardDrive, Layers, Maximize2, Search, Zap } from 'lucide-react';
import { ColorRGB555, PpuStats, TileInfo } from '../types/gba';
import { PpuProcessingResult } from '../utils/ppuEngine';
import { playBeepSound } from '../utils/soundEffects';

interface PpuVramInspectorProps {
  ppuResult: PpuProcessingResult | null;
  palette: ColorRGB555[];
  hoveredTileId: number | null;
  setHoveredTileId: (id: number | null) => void;
}

export const PpuVramInspector: React.FC<PpuVramInspectorProps> = ({
  ppuResult,
  palette,
  hoveredTileId,
  setHoveredTileId,
}) => {
  const [selectedTile, setSelectedTile] = useState<TileInfo | null>(null);

  if (!ppuResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        PPU engine idle. Start live stream or test signal to inspect VRAM.
      </div>
    );
  }

  const { uniqueTiles, stats, tileMap } = ppuResult;
  const activeTile = selectedTile || (hoveredTileId !== null && uniqueTiles[hoveredTileId] ? uniqueTiles[hoveredTileId] : uniqueTiles[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">GBA PPU Character Block (VRAM Tiles)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time 8×8 pixel tile decomposition & VRAM hardware deduplication
          </p>
        </div>

        {/* Compression Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">DEDUPLICATION RATIO</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {stats.compressionRatio}% SAVED
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Hardware Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 block">TOTAL SCREEN TILES</span>
          <span className="text-lg font-bold font-mono text-white tabular-nums">
            {stats.totalTiles}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.tilesX} × {stats.tilesY} Grid
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 block">UNIQUE VRAM TILES</span>
          <span className="text-lg font-bold font-mono text-indigo-400 tabular-nums">
            {stats.uniqueTiles}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Charblock 0 Capacity: 1024
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 block">VRAM 4BPP TILES</span>
          <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
            {(stats.vramTileBytes / 1024).toFixed(1)} KB
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            32 bytes / 8x8 tile
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 block">SCREENBLOCK MAP</span>
          <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
            {(stats.vramMapBytes / 1024).toFixed(1)} KB
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            16-bit entries @ 0x06004000
          </span>
        </div>
      </div>

      {/* Main Tile Inspection Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character Block 0 Sheet (All Unique 8x8 Tiles) */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Character Block 0 (Tile Bank VRAM)</span>
            </span>
            <span className="text-slate-400 font-mono">
              Hover/Click tile to zoom
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {uniqueTiles.map((tile) => {
                const isHovered = hoveredTileId === tile.id;
                const isSelected = selectedTile?.id === tile.id;

                return (
                  <button
                    key={tile.id}
                    onMouseEnter={() => setHoveredTileId(tile.id)}
                    onMouseLeave={() => setHoveredTileId(null)}
                    onClick={() => {
                      playBeepSound(800);
                      setSelectedTile(tile);
                    }}
                    className={`relative w-7 h-7 rounded border transition-all ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-110 z-10'
                        : isHovered
                        ? 'border-indigo-500 scale-105 z-10'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    title={`Tile #${tile.id} · Used ${tile.count}x`}
                  >
                    {/* Render mini 8x8 tile */}
                    <div className="grid grid-cols-8 grid-rows-8 w-full h-full pixelated rounded overflow-hidden">
                      {Array.from(tile.pixels).map((palIdx, pIdx) => {
                        const color = palette[palIdx] || palette[0];
                        return (
                          <div
                            key={pIdx}
                            style={{ backgroundColor: color.hex }}
                            className="w-full h-full"
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Tile 8x8 Zoom Inspector */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tile #{activeTile?.id ?? 0} Microscope</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                Used {activeTile?.count ?? 0} times
              </span>
            </div>

            {/* 8x8 Zoom Grid */}
            {activeTile && (
              <div className="mt-4 flex flex-col items-center">
                <div className="w-48 h-48 grid grid-cols-8 grid-rows-8 border-2 border-indigo-500/50 rounded-lg overflow-hidden shadow-xl bg-black">
                  {Array.from(activeTile.pixels).map((palIdx, pIdx) => {
                    const color = palette[palIdx] || palette[0];
                    return (
                      <div
                        key={pIdx}
                        style={{ backgroundColor: color.hex }}
                        className="w-full h-full flex items-center justify-center text-[7px] font-mono text-white/50 border-[0.5px] border-black/20"
                        title={`Pixel (${pIdx % 8}, ${Math.floor(pIdx / 8)}) = Pal #${palIdx} (${color.hexRgb555})`}
                      >
                        {palIdx}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 w-full space-y-1 text-left text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>VRAM Offset:</span>
                    <span className="text-slate-200">
                      0x{(0x06000000 + (activeTile.id * 32)).toString(16).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tile Hash:</span>
                    <span className="text-slate-300 truncate max-w-[120px]">
                      {activeTile.hash.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Screen Coords:</span>
                    <span className="text-slate-200">
                      X: {activeTile.firstX}px, Y: {activeTile.firstY}px
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            Each 8×8 tile is encoded as 32 bytes in 4bpp mode (2 pixels per byte), directly mapped into GBA VRAM Character Block 0.
          </div>
        </div>
      </div>
    </div>
  );
};
