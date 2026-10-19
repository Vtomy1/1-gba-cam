import React, { useState } from 'react';
import { Palette, Copy, Check, Edit2 } from 'lucide-react';
import { ColorRGB555 } from '../types/gba';
import { createColor } from '../utils/gbaColor';
import { playBeepSound } from '../utils/soundEffects';

interface PaletteInspectorProps {
  palette: ColorRGB555[];
  onUpdateColor: (index: number, newColor: ColorRGB555) => void;
  uniqueTilesPixels?: Uint8Array[];
}

export const PaletteInspector: React.FC<PaletteInspectorProps> = ({
  palette,
  onUpdateColor,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleCopyPaletteC = () => {
    playBeepSound(1046.5);
    const code =
      `// 16-color GBA BG Palette (15-bit BGR555)\n` +
      `const unsigned short palette[16] = {\n  ` +
      palette
        .map((c) => `0x${c.rgb555.toString(16).toUpperCase().padStart(4, '0')}`)
        .join(', ') +
      `\n};`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleColorPick = (index: number, hexVal: string) => {
    const r = parseInt(hexVal.slice(1, 3), 16) || 0;
    const g = parseInt(hexVal.slice(3, 5), 16) || 0;
    const b = parseInt(hexVal.slice(5, 7), 16) || 0;
    const newColor = createColor(r, g, b);
    onUpdateColor(index, newColor);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              GBA Palette RAM (PRAM 0x05000000)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            15-bit BGR555 color registers (32,768 possible hardware shades)
          </p>
        </div>

        <button
          onClick={handleCopyPaletteC}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied C Array!' : 'Copy C Palette'}</span>
        </button>
      </div>

      {/* Palette Swatches Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {palette.slice(0, 16).map((color, idx) => (
          <div
            key={idx}
            className="group relative bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col items-center text-center"
          >
            {/* Color Swatch & Native Color Picker */}
            <div className="relative w-full h-12 rounded-lg overflow-hidden border border-slate-700 shadow-inner mb-2 cursor-pointer">
              <div
                style={{ backgroundColor: color.hex }}
                className="w-full h-full"
              />
              <input
                type="color"
                value={color.hex}
                onChange={(e) => handleColorPick(idx, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title={`Click to edit Palette #${idx}`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                <Edit2 className="w-4 h-4 text-white drop-shadow" />
              </div>
            </div>

            {/* Slot index */}
            <div className="text-[10px] font-mono font-bold text-slate-400">
              #{idx.toString().padStart(2, '0')}
            </div>

            {/* RGB555 Hex */}
            <div className="text-xs font-mono font-semibold text-indigo-400 mt-0.5">
              {color.hexRgb555}
            </div>

            {/* RGB888 Hex */}
            <div className="text-[10px] font-mono text-slate-400">
              {color.hex.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Footnote */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-slate-400">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="font-semibold text-slate-200 block mb-1">Color Format</span>
          GBA Palette RAM stores colors as 16-bit little-endian words: 5 bits Red, 5 bits Green, 5 bits Blue.
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="font-semibold text-slate-200 block mb-1">Sub-Palettes</span>
          In 4bpp tile mode, GBA supports 16 independent background sub-palettes of 16 colors each (256 colors total).
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="font-semibold text-slate-200 block mb-1">Color 0 Transparency</span>
          In real GBA hardware, Palette #0 in each sub-palette acts as the transparent background backdrop.
        </div>
      </div>
    </div>
  );
};
