import React from 'react';
import { Grid, Sparkles, Monitor, Layers } from 'lucide-react';
import { DitherAlgorithm, FilterSettings, PaletteId } from '../types/gba';
import { BUILT_IN_PALETTES } from '../utils/gbaColor';
import { playBeepSound } from '../utils/soundEffects';

interface DitheringControlsProps {
  filterSettings: FilterSettings;
  setFilterSettings: React.Dispatch<React.SetStateAction<FilterSettings>>;
}

export const DitheringControls: React.FC<DitheringControlsProps> = ({
  filterSettings,
  setFilterSettings,
}) => {
  const ditherOptions: Array<{ id: DitherAlgorithm; label: string; desc: string }> = [
    { id: 'atkinson', label: 'Atkinson', desc: 'Game Boy Camera authentic algorithm' },
    { id: 'floyd-steinberg', label: 'Floyd-Steinberg', desc: 'Full error diffusion matrix' },
    { id: 'bayer-4x4', label: 'Bayer 4×4', desc: 'Classic ordered retro crosshatch' },
    { id: 'bayer-8x8', label: 'Bayer 8×8', desc: 'Ultra-smooth halftone matrix' },
    { id: 'blue-noise', label: 'Blue Noise', desc: 'Stochastic organic stipple' },
    { id: 'none', label: 'Direct Quantize', desc: 'Flat posterized colors' },
  ];

  const paletteOptions: Array<{ id: PaletteId; label: string; count: number; desc: string }> = [
    { id: 'dmg-classic', label: 'DMG-01 Classic', count: 4, desc: 'Original 1989 Pea Soup Green' },
    { id: 'gb-pocket', label: 'GB Pocket', count: 4, desc: 'FSTN Silver Monochrome' },
    { id: 'gba-vivid', label: 'GBA Vivid 15-bit', count: 16, desc: 'AGB-001 Reflective LCD Boost' },
    { id: 'gbc-berry', label: 'GBC Berry Red', count: 4, desc: 'Nintendo GBC Boot Palette' },
    { id: 'gbc-cyber', label: 'GBC Cyberpunk', count: 4, desc: 'Electric Cyan & Magenta' },
    { id: 'gba-amber', label: 'GBA Micro Amber', count: 4, desc: 'Warm Golden Backlight' },
    { id: 'nes-famicom', label: 'NES Famicom', count: 16, desc: '2C02 PPU Color Subsystem' },
    { id: 'dynamic-16', label: 'Dynamic 16-Color', count: 16, desc: 'Live Frame Color Quantization' },
  ];

  const handleAlgorithmChange = (alg: DitherAlgorithm) => {
    playBeepSound(650);
    setFilterSettings((prev) => ({ ...prev, ditherAlgorithm: alg }));
  };

  const handlePaletteChange = (pal: PaletteId) => {
    playBeepSound(750);
    setFilterSettings((prev) => ({ ...prev, paletteId: pal }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-white tracking-wide">Dithering & Palette Matrix</h2>
      </div>

      {/* Dithering Algorithm Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Dithering Kernel</label>
        <div className="grid grid-cols-2 gap-2">
          {ditherOptions.map((opt) => {
            const isSelected = filterSettings.ditherAlgorithm === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleAlgorithmChange(opt.id)}
                className={`p-2 rounded-lg text-left border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dither Strength Slider */}
      {filterSettings.ditherAlgorithm !== 'none' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Dither Diffusion Intensity</span>
            <span className="font-mono text-indigo-400 tabular-nums">
              {Math.round(filterSettings.ditherStrength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={filterSettings.ditherStrength}
            onChange={(e) =>
              setFilterSettings((prev) => ({
                ...prev,
                ditherStrength: Number(e.target.value),
              }))
            }
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Retro Palette Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Target Color Palette (RGB555)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {paletteOptions.map((opt) => {
            const isSelected = filterSettings.paletteId === opt.id;
            const previewColors = BUILT_IN_PALETTES[opt.id] || [];

            return (
              <button
                key={opt.id}
                onClick={() => handlePaletteChange(opt.id)}
                className={`p-2.5 rounded-lg text-left border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{opt.count} colors</span>
                </div>
                {/* Visual color swatch bar */}
                <div className="flex h-3 rounded overflow-hidden border border-slate-700">
                  {previewColors.slice(0, 16).map((c, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-full"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen CRT/LCD Filters */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          <span>LCD Screen Optics & Shaders</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Subpixel Matrix */}
          <button
            onClick={() => {
              playBeepSound(600);
              setFilterSettings((prev) => ({ ...prev, subpixelGrid: !prev.subpixelGrid }));
            }}
            className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
              filterSettings.subpixelGrid
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Subpixel Grid
          </button>

          {/* Scanlines */}
          <button
            onClick={() => {
              playBeepSound(600);
              setFilterSettings((prev) => ({ ...prev, scanlines: !prev.scanlines }));
            }}
            className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
              filterSettings.scanlines
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Scanlines
          </button>

          {/* Phosphor Glow */}
          <button
            onClick={() => {
              playBeepSound(600);
              setFilterSettings((prev) => ({ ...prev, phosphorGlow: !prev.phosphorGlow }));
            }}
            className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
              filterSettings.phosphorGlow
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            CRT Vignette
          </button>
        </div>
      </div>
    </div>
  );
};
