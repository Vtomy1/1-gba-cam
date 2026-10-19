import React from 'react';
import { Download, Film, Trash2, X, Play, Clock, Sparkles } from 'lucide-react';
import { ColorRGB555 } from '../types/gba';
import { PpuProcessingResult } from '../utils/ppuEngine';
import { generatePlayableGbaRom } from '../utils/romHeader';
import { playBeepSound, playSuccessChime } from '../utils/soundEffects';

export interface SnapshotItem {
  id: string;
  timestamp: string;
  dataUrl: string;
  palette: ColorRGB555[];
  ppuResult: PpuProcessingResult;
}

interface RecordingAndStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordedVideoUrl: string | null;
  snapshots: SnapshotItem[];
  onDeleteSnapshot: (id: string) => void;
  onSelectSnapshot: (item: SnapshotItem) => void;
}

export const RecordingAndStreamModal: React.FC<RecordingAndStreamModalProps> = ({
  isOpen,
  onClose,
  recordedVideoUrl,
  snapshots,
  onDeleteSnapshot,
  onSelectSnapshot,
}) => {
  if (!isOpen) return null;

  const handleDownloadSnapshotPng = (item: SnapshotItem, upscale: boolean = false) => {
    playBeepSound(900);
    const img = new Image();
    img.src = item.dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = upscale ? 4 : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `gba_cam_${item.timestamp}${upscale ? '_4x' : ''}.png`;
        a.click();
      }
    };
  };

  const handleDownloadSnapshotRom = (item: SnapshotItem) => {
    playSuccessChime();
    const rom = generatePlayableGbaRom(
      item.ppuResult,
      item.palette,
      'GBACAM SNAP',
      'SNAP',
      '01'
    );
    const blob = new Blob([rom.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gbacam_${item.timestamp}.gba`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              Recorded Media & Snapshots Archive
            </h2>
          </div>
          <button
            onClick={() => {
              playBeepSound(400);
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recorded Video Clip Section */}
        {recordedVideoUrl && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-emerald-400" />
                <span>Latest 8-Bit Stream Recording</span>
              </span>
              <a
                href={recordedVideoUrl}
                download="gba_stream_clip.webm"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video (.WebM)</span>
              </a>
            </div>

            <div className="w-full max-w-md mx-auto aspect-[3/2] bg-black rounded-lg overflow-hidden border border-slate-800">
              <video
                src={recordedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full pixelated"
              />
            </div>
          </div>
        )}

        {/* Snapshots Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Captured Frame Snapshots ({snapshots.length})
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No snapshots captured yet. Press the "B" button on the console or "Snapshot" to capture!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {snapshots.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 group"
                >
                  <div className="relative aspect-[3/2] bg-black rounded-lg overflow-hidden border border-slate-800">
                    <img
                      src={item.dataUrl}
                      alt="GBA Snapshot"
                      className="w-full h-full object-cover pixelated"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 font-mono text-[9px] text-slate-300">
                      {item.ppuResult.stats.width}×{item.ppuResult.stats.height}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{item.timestamp}</span>
                    <span className="text-indigo-400">
                      {item.ppuResult.stats.uniqueTiles} tiles
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => handleDownloadSnapshotRom(item)}
                      className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500 text-indigo-200 hover:text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.GBA ROM</span>
                    </button>
                    <button
                      onClick={() => handleDownloadSnapshotPng(item, true)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>4x PNG</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteSnapshot(item.id)}
                    className="w-full py-1 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
