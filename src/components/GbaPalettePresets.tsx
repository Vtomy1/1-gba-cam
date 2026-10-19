import React from 'react';
import { Palette, Check, Sparkles, Wand2 } from 'lucide-react';
import { ColorRGB555, PaletteId } from '../types/gba';
import { createColor } from '../utils/gbaColor';
import { playBeepSound } from '../utils/soundEffects';

export interface PalettePreset {
  id: string;
  name: string;
  category: 'Classic Game Boy' | 'Vibrant & Modern' | 'Atmospheric';
  description: string;
  colors: ColorRGB555[];
  paletteIdMatch?: PaletteId;
}

export const GBA_PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'retro-lime',
    name: 'Retro Lime',
    category: 'Vibrant & Modern',
    description: 'Electric lime phosphor & vivid citrus greens for punchy 8-bit contrast',
    colors: [
      createColor(14, 28, 8),     // Deep forest shadow
      createColor(36, 74, 16),    // Dark olive lime
      createColor(68, 128, 28),   // Mid foliage lime
      createColor(118, 186, 38),  // Electric lime
      createColor(176, 230, 60),  // Bright yellow-lime
      createColor(228, 255, 120), // Sunlit lime highlight
    ],
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    category: 'Atmospheric',
    description: 'Moody abyss navy, deep sapphire, electric cobalt, and starlight ice',
    colors: [
      createColor(6, 11, 25),     // Midnight abyss
      createColor(14, 34, 70),    // Deep navy
      createColor(30, 74, 138),   // Electric sapphire
      createColor(59, 130, 246),  // Neon cobalt
      createColor(147, 197, 253), // Ice sky blue
      createColor(240, 249, 255), // Starlight white
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    category: 'Atmospheric',
    description: 'Twilight purple, dusk crimson, radiant solar orange, and golden amber',
    colors: [
      createColor(33, 11, 44),    // Twilight purple
      createColor(92, 19, 73),    // Dusk wine
      createColor(168, 32, 60),   // Crimson rose
      createColor(224, 83, 40),   // Solar flame orange
      createColor(245, 158, 11),  // Golden amber
      createColor(254, 240, 138), // Horizon peach highlight
    ],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    category: 'Classic Game Boy',
    description: 'Crisp FSTN silver grayscale from ink black to pure paper white',
    colors: [
      createColor(15, 15, 15),    // True black
      createColor(55, 55, 55),    // Charcoal
      createColor(105, 105, 105), // Mid silver
      createColor(160, 160, 160), // Light silver
      createColor(210, 210, 210), // Paper gray
      createColor(255, 255, 255), // Pure white
    ],
    paletteIdMatch: 'gb-pocket',
  },
  {
    id: 'dmg-pea-soup',
    name: 'Classic Pea Soup',
    category: 'Classic Game Boy',
    description: 'Original 1989 Nintendo Game Boy 4-shade greenish LCD matrix',
    colors: [
      createColor(15, 56, 15),   // Darkest pea green
      createColor(48, 98, 48),   // Dark green
      createColor(139, 172, 15), // Light green
      createColor(155, 188, 15), // Lightest yellow-green
    ],
    paletteIdMatch: 'dmg-classic',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Vibrant & Modern',
    description: 'High-voltage electric cyan, hot magenta, dark violet, and acid yellow',
    colors: [
      createColor(12, 16, 32),    // Midnight navy
      createColor(48, 112, 160),  // Steel cyan
      createColor(32, 216, 208),  // Electric phosphor cyan
      createColor(217, 70, 239),  // Hot magenta
      createColor(248, 240, 96),  // Acid lemon
    ],
    paletteIdMatch: 'gbc-cyber',
  },
  {
    id: 'golden-amber',
    name: 'Golden Amber',
    category: 'Atmospheric',
    description: 'Warm monochromatic plasma phosphor with deep caramel shadows',
    colors: [
      createColor(16, 10, 4),     // Deep espresso
      createColor(96, 56, 16),    // Rustic amber
      createColor(192, 128, 32),  // Honey gold
      createColor(248, 216, 120), // Warm backlight highlight
    ],
    paletteIdMatch: 'gba-amber',
  },
  {
    id: 'gbc-berry',
    name: 'GBC Berry Red',
    category: 'Classic Game Boy',
    description: 'Nintendo Game Boy Color bootloader cherry blossom & ruby tone',
    colors: [
      createColor(24, 16, 40),    // Midnight violet
      createColor(128, 24, 56),   // Berry red
      createColor(216, 64, 88),   // Crimson pink
      createColor(248, 208, 176), // Peach highlight
    ],
    paletteIdMatch: 'gbc-berry',
  },
  {
    id: 'ice-glacier',
    name: 'Glacier Ice',
    category: 'Vibrant & Modern',
    description: 'Crisp sub-zero arctic teals, glacial cyan, and diamond frost',
    colors: [
      createColor(8, 26, 36),     // Deep abyss
      createColor(19, 62, 84),    // Arctic teal
      createColor(34, 123, 155),  // Glacial cyan
      createColor(72, 202, 228),  // Frozen crystal
      createColor(202, 240, 248), // Diamond frost
    ],
  },
  {
    id: 'lava-volcano',
    name: 'Lava Volcano',
    category: 'Atmospheric',
    description: 'Obsidian basalt rock, glowing embers, and molten magma orange',
    colors: [
      createColor(20, 5, 5),      // Basalt obsidian
      createColor(74, 14, 14),    // Smoldering ember
      createColor(158, 42, 43),   // Ruby magma
      createColor(255, 84, 0),    // Blazing orange
      createColor(255, 190, 11),  // Flare yellow
    ],
  },
  {
    id: 'gba-vivid-16',
    name: 'GBA Vivid 15-bit',
    category: 'Classic Game Boy',
    description: 'AGB-001 reflective TFT color saturation compensation 16-color ramp',
    colors: [
      createColor(16, 16, 24),
      createColor(56, 40, 56),
      createColor(96, 48, 40),
      createColor(160, 64, 48),
      createColor(224, 112, 64),
      createColor(248, 192, 96),
      createColor(248, 240, 192),
      createColor(16, 64, 48),
      createColor(40, 120, 72),
      createColor(96, 184, 96),
      createColor(24, 64, 120),
      createColor(48, 128, 192),
      createColor(112, 192, 248),
      createColor(104, 64, 136),
      createColor(176, 112, 200),
      createColor(255, 255, 255),
    ],
    paletteIdMatch: 'gba-vivid',
  },
  {
    id: 'nes-famicom-ppu',
    name: 'NES Famicom PPU',
    category: 'Classic Game Boy',
    description: 'Nintendo 2C02 PPU 16-color iconic arcade gaming palette',
    colors: [
      createColor(0, 0, 0),
      createColor(116, 116, 116),
      createColor(24, 60, 92),
      createColor(0, 128, 136),
      createColor(68, 40, 188),
      createColor(148, 0, 211),
      createColor(168, 16, 0),
      createColor(168, 64, 0),
      createColor(136, 112, 0),
      createColor(0, 120, 0),
      createColor(0, 136, 60),
      createColor(60, 188, 252),
      createColor(248, 120, 88),
      createColor(252, 160, 68),
      createColor(248, 248, 120),
      createColor(252, 252, 252),
    ],
    paletteIdMatch: 'nes-famicom',
  },
];

interface GbaPalettePresetsProps {
  currentPalette: ColorRGB555[];
  onSelectPreset: (preset: PalettePreset) => void;
}

export const GbaPalettePresets: React.FC<GbaPalettePresetsProps> = ({
  currentPalette,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Presets' },
    { id: 'Vibrant & Modern', label: 'Vibrant & Modern' },
    { id: 'Atmospheric', label: 'Atmospheric' },
    { id: 'Classic Game Boy', label: 'Classic Game Boy' },
  ];

  const filteredPresets = selectedCategory === 'all'
    ? GBA_PALETTE_PRESETS
    : GBA_PALETTE_PRESETS.filter((p) => p.category === selectedCategory);

  // Check if a preset matches the current live palette
  const isPresetActive = (preset: PalettePreset): boolean => {
    if (preset.colors.length !== currentPalette.length) return false;
    for (let i = 0; i < preset.colors.length; i++) {
      if (preset.colors[i].hex !== currentPalette[i].hex) {
        return false;
      }
    }
    return true;
  };

  const handleCardClick = (preset: PalettePreset) => {
    playBeepSound(880);
    onSelectPreset(preset);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              GBA Palette Presets
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any preset card to immediately swap the live webcam video stream palette
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playBeepSound(600);
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredPresets.map((preset) => {
          const isActive = isPresetActive(preset);

          return (
            <button
              key={preset.id}
              onClick={() => handleCardClick(preset)}
              className={`group relative text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                {/* Title & Active Cue */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {preset.name}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Check className="w-3 h-3" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      {preset.colors.length} shades
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Color Swatch Strip */}
              <div className="w-full space-y-1.5">
                <div className="flex h-5 w-full rounded-md overflow-hidden border border-slate-700/80 shadow-inner">
                  {preset.colors.map((c, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: c.hex }}
                      className="flex-1 h-full transition-transform group-hover:scale-y-110"
                      title={`${c.hex.toUpperCase()} (${c.hexRgb555})`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span>{preset.colors[0].hexRgb555}</span>
                  <span className="text-slate-400">→</span>
                  <span>{preset.colors[preset.colors.length - 1].hexRgb555}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
