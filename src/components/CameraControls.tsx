import React from 'react';
import { Sliders, Sun, Contrast, Gauge, RotateCcw } from 'lucide-react';
import { FilterSettings, ScreenMode } from '../types/gba';
import { playBeepSound } from '../utils/soundEffects';

interface CameraControlsProps {
  filterSettings: FilterSettings;
  setFilterSettings: React.Dispatch<React.SetStateAction<FilterSettings>>;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  onResetDefaults: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  filterSettings,
  setFilterSettings,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onResetDefaults,
}) => {
  const handleModeChange = (mode: ScreenMode) => {
    playBeepSound(700);
    setFilterSettings((prev) => ({ ...prev, screenMode: mode }));
  };

  const handleFpsChange = (fps: number) => {
    playBeepSound(650);
    setFilterSettings((prev) => ({ ...prev, fpsLimit: fps }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">PPU Video Stream Engine</h2>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          title="Reset image values"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Camera Device Selector if multiple available */}
      {devices.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Camera Source</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="w-full text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resolution & Screen Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Hardware Resolution & PPU Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModeChange('GBA_MODE0')}
            className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
              filterSettings.screenMode === 'GBA_MODE0'
                ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-white">GBA Mode 0</div>
            <div className="text-[10px] text-slate-400">240 × 160 px (30×20 tiles)</div>
          </button>
          <button
            onClick={() => handleModeChange('GB_DMG')}
            className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
              filterSettings.screenMode === 'GB_DMG'
                ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-white">GB DMG-01</div>
            <div className="text-[10px] text-slate-400">160 × 144 px (20×18 tiles)</div>
          </button>
        </div>
      </div>

      {/* Frame Rate Throttler */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-medium text-slate-300">Stream Clock / FPS Rate</label>
          <span className="font-mono text-indigo-400">{filterSettings.fpsLimit} FPS</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {[60, 30, 15, 8].map((fps) => (
            <button
              key={fps}
              onClick={() => handleFpsChange(fps)}
              className={`py-1 text-xs font-mono font-medium rounded transition-colors ${
                filterSettings.fpsLimit === fps
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {fps === 8 ? '8 (GB)' : `${fps} FPS`}
            </button>
          ))}
        </div>
      </div>

      {/* Brightness, Contrast & Gamma Sliders */}
      <div className="space-y-4 pt-1">
        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-slate-400" /> Brightness
            </span>
            <span className="font-mono text-slate-400 tabular-nums">{filterSettings.brightness}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filterSettings.brightness}
            onChange={(e) =>
              setFilterSettings((prev) => ({ ...prev, brightness: Number(e.target.value) }))
            }
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-slate-400" /> Contrast
            </span>
            <span className="font-mono text-slate-400 tabular-nums">{filterSettings.contrast}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filterSettings.contrast}
            onChange={(e) =>
              setFilterSettings((prev) => ({ ...prev, contrast: Number(e.target.value) }))
            }
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Gamma / Exposure */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" /> Gamma Curve
            </span>
            <span className="font-mono text-slate-400 tabular-nums">{filterSettings.gamma.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={filterSettings.gamma}
            onChange={(e) =>
              setFilterSettings((prev) => ({ ...prev, gamma: Number(e.target.value) }))
            }
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Invert Color Switch */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-300">Invert Colors (Solarize)</span>
          <button
            onClick={() => {
              playBeepSound(600);
              setFilterSettings((prev) => ({ ...prev, invert: !prev.invert }));
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              filterSettings.invert ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                filterSettings.invert ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
