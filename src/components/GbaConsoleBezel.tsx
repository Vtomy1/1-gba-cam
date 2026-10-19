import React, { useRef, useState } from 'react';
import { Camera, SwitchCamera, Play, Pause, Radio, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { FilterSettings, PpuStats } from '../types/gba';
import { playBeepSound, playShutterSound } from '../utils/soundEffects';

interface GbaConsoleBezelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  filterSettings: FilterSettings;
  setFilterSettings: React.Dispatch<React.SetStateAction<FilterSettings>>;
  stats: PpuStats | null;
  isCameraActive: boolean;
  facingMode: 'user' | 'environment';
  onSwitchCamera: () => void;
  onToggleCamera: () => void;
  isTestPattern: boolean;
  onToggleTestPattern: () => void;
  onTakeSnapshot: () => void;
  hoveredTileId: number | null;
  setHoveredTileCoord: (coord: { x: number; y: number } | null) => void;
  isRecording: boolean;
}

export const GbaConsoleBezel: React.FC<GbaConsoleBezelProps> = ({
  canvasRef,
  filterSettings,
  setFilterSettings,
  stats,
  isCameraActive,
  facingMode,
  onSwitchCamera,
  onToggleCamera,
  isTestPattern,
  onToggleTestPattern,
  onTakeSnapshot,
  hoveredTileId,
  setHoveredTileCoord,
  isRecording,
}) => {
  const [flash, setFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSnapshotClick = () => {
    playShutterSound();
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    onTakeSnapshot();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !stats) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const pixelX = Math.floor((x / rect.width) * stats.width);
      const pixelY = Math.floor((y / rect.height) * stats.height);
      setHoveredTileCoord({ x: pixelX, y: pixelY });
    } else {
      setHoveredTileCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTileCoord(null);
  };

  // Resolution aspect ratio
  const isGba = filterSettings.screenMode !== 'GB_DMG';
  const screenWidth = isGba ? 240 : 160;
  const screenHeight = isGba ? 160 : 144;
  const aspectClass = isGba ? 'aspect-[3/2]' : 'aspect-[10/9]';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Handheld Bezel Container */}
      {filterSettings.bezelStyle === 'indigo' && (
        <div className="relative w-full max-w-2xl bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-950 p-6 sm:p-8 rounded-[48px] shadow-2xl border-4 border-indigo-600/40 select-none">
          {/* Top Shoulder Buttons representation */}
          <div className="absolute -top-3 left-10 w-24 h-4 bg-indigo-500 rounded-t-lg border-t border-indigo-300 shadow-sm" />
          <div className="absolute -top-3 right-10 w-24 h-4 bg-indigo-500 rounded-t-lg border-t border-indigo-300 shadow-sm" />

          {/* Console Brand Header */}
          <div className="flex items-center justify-between px-6 mb-3 text-indigo-300">
            <span className="text-xs font-semibold tracking-wider font-mono">GAME BOY ADVANCE</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-tight font-mono text-indigo-200">POWER</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            </div>
          </div>

          {/* Screen Inner Frame (Glass) */}
          <div className="relative bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-700 shadow-inner flex flex-col items-center">
            {/* Screen Glass Viewport */}
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`relative w-full max-w-[480px] ${aspectClass} bg-black rounded-lg overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center cursor-crosshair`}
            >
              {/* Main PPU Canvas */}
              <canvas
                ref={canvasRef}
                width={screenWidth}
                height={screenHeight}
                className="w-full h-full pixelated block"
              />

              {/* Shutter Flash Animation */}
              {flash && (
                <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-100 opacity-90" />
              )}

              {/* LCD Dot Matrix Overlay */}
              {filterSettings.subpixelGrid && (
                <div className="absolute inset-0 gba-lcd-grid pointer-events-none opacity-40 mix-blend-multiply" />
              )}

              {/* Scanlines Overlay */}
              {filterSettings.scanlines && (
                <div className="absolute inset-0 gba-scanlines pointer-events-none opacity-30" />
              )}

              {/* CRT Vignette */}
              {filterSettings.phosphorGlow && (
                <div className="absolute inset-0 crt-vignette pointer-events-none opacity-60" />
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/90 text-[10px] font-mono font-bold text-white tracking-wider animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  REC
                </div>
              )}

              {/* Tile coordinate HUD tooltip */}
              {hoveredTileId !== null && (
                <div className="absolute bottom-2 left-2 bg-slate-900/90 text-indigo-300 font-mono text-[10px] px-2 py-1 rounded border border-indigo-500/30 backdrop-blur pointer-events-none">
                  Tile #{hoveredTileId.toString().padStart(3, '0')} (Charblock 0)
                </div>
              )}

              {/* Offline / Test Signal Banner */}
              {isTestPattern && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-mono text-indigo-300">
                  TEST SIGNAL
                </div>
              )}
            </div>

            {/* Sub-label under screen */}
            <div className="mt-3 flex items-center justify-between w-full max-w-[480px] text-[11px] font-mono text-slate-400">
              <span className="text-indigo-400 font-semibold">TFT REFLECTIVE LCD · 15-BIT RGB555</span>
              <span>
                {stats?.width}x{stats?.height} · {stats?.fps || 0} FPS
              </span>
            </div>
          </div>

          {/* Bottom Console Controls (D-Pad, A/B buttons, speaker) */}
          <div className="mt-6 flex items-center justify-between px-4 sm:px-8">
            {/* D-Pad representation */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-x-7 inset-y-0 bg-slate-800 rounded-sm shadow-md border border-slate-700" />
              <div className="absolute inset-y-7 inset-x-0 bg-slate-800 rounded-sm shadow-md border border-slate-700" />
              <div className="absolute inset-[26px] bg-slate-900 rounded-full" />
            </div>

            {/* Speaker Grille Holes */}
            <div className="flex flex-col gap-1.5 opacity-60">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
              </div>
            </div>

            {/* A/B Action Buttons */}
            <div className="flex items-center gap-3 rotate-[-15deg]">
              <button
                onClick={handleSnapshotClick}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-red-700/60 transition-transform active:scale-95"
                title="B Button: Snapshot Frame"
              >
                B
              </button>
              <button
                onClick={onTakeSnapshot}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-red-700/60 transition-transform active:scale-95 translate-y-[-6px]"
                title="A Button: Capture & Inspect ROM"
              >
                A
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Studio Monitor Style */}
      {filterSettings.bezelStyle !== 'indigo' && (
        <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full max-w-[540px] ${aspectClass} bg-black rounded-lg overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center cursor-crosshair`}
          >
            <canvas
              ref={canvasRef}
              width={screenWidth}
              height={screenHeight}
              className="w-full h-full pixelated block"
            />

            {flash && (
              <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-100 opacity-90" />
            )}

            {filterSettings.subpixelGrid && (
              <div className="absolute inset-0 gba-lcd-grid pointer-events-none opacity-40 mix-blend-multiply" />
            )}

            {filterSettings.scanlines && (
              <div className="absolute inset-0 gba-scanlines pointer-events-none opacity-30" />
            )}

            {filterSettings.phosphorGlow && (
              <div className="absolute inset-0 crt-vignette pointer-events-none opacity-60" />
            )}

            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/90 text-[10px] font-mono font-bold text-white tracking-wider animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white" />
                REC
              </div>
            )}

            {hoveredTileId !== null && (
              <div className="absolute bottom-2 left-2 bg-slate-900/90 text-indigo-300 font-mono text-[10px] px-2 py-1 rounded border border-indigo-500/30 backdrop-blur pointer-events-none">
                Tile #{hoveredTileId.toString().padStart(3, '0')} (Charblock 0)
              </div>
            )}

            {isTestPattern && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-mono text-indigo-300">
                TEST SIGNAL
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between w-full max-w-[540px] text-xs font-mono text-slate-400">
            <span className="text-indigo-400 font-semibold">GBA PPU FRAMEBUFFER</span>
            <span>
              {stats?.width}x{stats?.height} · {stats?.fps || 0} FPS
            </span>
          </div>
        </div>
      )}

      {/* Floating Viewport Toolbar Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => {
            playBeepSound(500);
            onToggleCamera();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isCameraActive
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-indigo-600/30 border-indigo-500 text-indigo-200 hover:bg-indigo-600/50'
          }`}
        >
          {isCameraActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isCameraActive ? 'Freeze Stream' : 'Resume Stream'}</span>
        </button>

        {/* Back Camera Switcher (Key User Requirement!) */}
        <button
          onClick={() => {
            playBeepSound(700);
            onSwitchCamera();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
          title="Switch between Environment / Back Camera and Front Camera"
        >
          <SwitchCamera className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cam: {facingMode === 'environment' ? 'Back (Live)' : 'Front'}</span>
        </button>

        {/* Test Signal Toggle */}
        <button
          onClick={() => {
            playBeepSound(600);
            onToggleTestPattern();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isTestPattern
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-indigo-300" />
          <span>{isTestPattern ? 'Test Signal Active' : 'Test Signal'}</span>
        </button>

        {/* Bezel Switcher */}
        <button
          onClick={() => {
            playBeepSound(600);
            setFilterSettings((prev) => ({
              ...prev,
              bezelStyle: prev.bezelStyle === 'indigo' ? 'clean' : 'indigo',
            }));
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Bezel: {filterSettings.bezelStyle === 'indigo' ? 'Indigo GBA' : 'Clean Studio'}</span>
        </button>

        {/* Quick Snapshot */}
        <button
          onClick={handleSnapshotClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Snapshot</span>
        </button>
      </div>
    </div>
  );
};
