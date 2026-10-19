import React from 'react';
import { Camera, Cpu, Palette, FileCode, Video, Volume2, VolumeX, Download } from 'lucide-react';
import { isAudioEnabled, toggleAudio, playBeepSound } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'stream' | 'ppu' | 'palette' | 'rom' | 'export';
  setActiveTab: (tab: 'stream' | 'ppu' | 'palette' | 'rom' | 'export') => void;
  onQuickSnapshot: () => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickSnapshot,
  isStreaming,
}) => {
  const [audioOn, setAudioOn] = React.useState(isAudioEnabled());

  const handleAudioToggle = () => {
    const newState = toggleAudio();
    setAudioOn(newState);
    if (newState) {
      playBeepSound(1046.5);
    }
  };

  const navLinks = [
    { id: 'stream', label: 'Live Stream', icon: Video },
    { id: 'ppu', label: 'PPU VRAM', icon: Cpu },
    { id: 'palette', label: 'Palette RAM', icon: Palette },
    { id: 'rom', label: 'ROM Header', icon: FileCode },
  ] as const;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-inner">
            <Camera className="w-4 h-4" />
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('stream');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-indigo-400 transition-colors"
          >
            GBA Cam PPU Studio
          </a>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playBeepSound(659.25);
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'text-white border-indigo-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Audio Toggle & Primary CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAudioToggle}
            title={audioOn ? 'Mute 8-bit Audio' : 'Enable 8-bit Audio'}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle retro audio"
          >
            {audioOn ? <Volume2 className="w-5 h-5 text-indigo-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          <button
            onClick={onQuickSnapshot}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .GBA ROM</span>
          </button>
        </div>
      </div>
    </header>
  );
};
