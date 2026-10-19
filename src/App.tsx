/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Cpu,
  Palette,
  FileCode,
  Video,
  Download,
  Disc,
  StopCircle,
  Sparkles,
  Layers,
  Zap,
  Info,
  SwitchCamera,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Header } from './components/Header';
import { GbaConsoleBezel } from './components/GbaConsoleBezel';
import { CameraControls } from './components/CameraControls';
import { DitheringControls } from './components/DitheringControls';
import { PpuVramInspector } from './components/PpuVramInspector';
import { PaletteInspector } from './components/PaletteInspector';
import { RomHeaderViewer } from './components/RomHeaderViewer';
import { RecordingAndStreamModal, SnapshotItem } from './components/RecordingAndStreamModal';

import { FilterSettings, ColorRGB555, PpuStats } from './types/gba';
import { BUILT_IN_PALETTES, extractDynamic16Palette, createColor } from './utils/gbaColor';
import { applyDithering } from './utils/dithering';
import { processPpuTiles, PpuProcessingResult } from './utils/ppuEngine';
import { generatePlayableGbaRom } from './utils/romHeader';
import { renderTestPattern } from './utils/testPattern';
import { playBeepSound, playShutterSound, playSuccessChime, playRecordTone } from './utils/soundEffects';

const DEFAULT_SETTINGS: FilterSettings = {
  brightness: 0,
  contrast: 15,
  gamma: 1.0,
  sharpness: 0,
  invert: false,
  ditherStrength: 1.0,
  ditherAlgorithm: 'atkinson', // Game Boy Camera classic algorithm
  paletteId: 'dmg-classic',   // Classic 4-color DMG green
  screenMode: 'GBA_MODE0',    // 240x160 GBA Mode 0
  fpsLimit: 30,
  subpixelGrid: true,
  scanlines: false,
  phosphorGlow: false,
  bezelStyle: 'indigo',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'stream' | 'ppu' | 'palette' | 'rom' | 'export'>('stream');
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_SETTINGS);

  // Camera & Video State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Default to back camera!
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isTestPattern, setIsTestPattern] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // PPU Frame & Stats
  const [ppuResult, setPpuResult] = useState<PpuProcessingResult | null>(null);
  const [activePalette, setActivePalette] = useState<ColorRGB555[]>(BUILT_IN_PALETTES['dmg-classic']);
  const [stats, setStats] = useState<PpuStats | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<number | null>(null);
  const [hoveredTileCoord, setHoveredTileCoord] = useState<{ x: number; y: number } | null>(null);

  // Recording & Snapshots
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(0);
  const currentFpsRef = useRef<number>(30);

  // Initialize Offscreen Processing Canvas
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Update palette when user changes preset in settings
  useEffect(() => {
    setActivePalette(BUILT_IN_PALETTES[filterSettings.paletteId] || BUILT_IN_PALETTES['dmg-classic']);
  }, [filterSettings.paletteId]);

  // Request & enumerate media devices
  const startCamera = useCallback(async (facing: 'user' | 'environment', deviceId?: string) => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: facing },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setIsTestPattern(false);

      // Enumerate devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevs);
      if (deviceId) {
        setSelectedDeviceId(deviceId);
      } else if (videoDevs.length > 0) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err: unknown) {
      console.warn('Camera access unavailable, activating synthetic test pattern fallback:', err);
      setCameraError('Camera access unavailable. Switched to animated retro test pattern.');
      setIsTestPattern(true);
      setIsCameraActive(false);
    }
  }, []);

  // Initial camera startup
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startCamera, facingMode]);

  // Toggle Camera Facing Mode (Front vs Back Camera)
  const handleSwitchCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Toggle Camera Pause / Play
  const handleToggleCamera = () => {
    if (isTestPattern) {
      setIsTestPattern(false);
      startCamera(facingMode);
    } else {
      setIsCameraActive((prev) => !prev);
    }
  };

  // Toggle Synthetic Test Pattern
  const handleToggleTestPattern = () => {
    if (isTestPattern) {
      setIsTestPattern(false);
      startCamera(facingMode);
    } else {
      setIsTestPattern(true);
      setIsCameraActive(false);
    }
  };

  // Recording Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Start / Stop Video Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording
      playRecordTone(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      if (!mainCanvasRef.current) return;
      playRecordTone(true);
      recordedChunksRef.current = [];

      try {
        const stream = mainCanvasRef.current.captureStream(filterSettings.fpsLimit);
        const options = { mimeType: 'video/webm;codecs=vp8' };
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          setIsMediaModalOpen(true);
        };

        recorder.start(200);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start MediaRecorder:', e);
      }
    }
  };

  // Take Snapshot
  const handleTakeSnapshot = useCallback(() => {
    if (!mainCanvasRef.current || !ppuResult) return;
    const dataUrl = mainCanvasRef.current.toDataURL('image/png');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newSnapshot: SnapshotItem = {
      id: Date.now().toString(),
      timestamp: timeStr,
      dataUrl,
      palette: [...activePalette],
      ppuResult,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);
  }, [ppuResult, activePalette]);

  // Main PPU Render Loop
  useEffect(() => {
    let active = true;

    const renderLoop = (timestamp: number) => {
      if (!active) return;

      const targetFps = filterSettings.fpsLimit;
      const frameInterval = 1000 / targetFps;
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);

        // Calculate actual FPS
        frameCountRef.current++;
        if (timestamp - fpsTimerRef.current >= 1000) {
          currentFpsRef.current = frameCountRef.current;
          frameCountRef.current = 0;
          fpsTimerRef.current = timestamp;
        }

        const isGba = filterSettings.screenMode !== 'GB_DMG';
        const targetWidth = isGba ? 240 : 160;
        const targetHeight = isGba ? 160 : 144;

        const offscreen = offscreenCanvasRef.current;
        const mainCanvas = mainCanvasRef.current;

        if (offscreen && mainCanvas) {
          if (offscreen.width !== targetWidth || offscreen.height !== targetHeight) {
            offscreen.width = targetWidth;
            offscreen.height = targetHeight;
          }
          if (mainCanvas.width !== targetWidth || mainCanvas.height !== targetHeight) {
            mainCanvas.width = targetWidth;
            mainCanvas.height = targetHeight;
          }

          const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
          const mainCtx = mainCanvas.getContext('2d');

          if (offCtx && mainCtx) {
            // Draw Source Frame
            if (isTestPattern || !isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
              renderTestPattern(offCtx, targetWidth, targetHeight, timestamp);
            } else {
              // Draw video feed scaled to exact PPU resolution
              offCtx.save();
              // If user camera, mirror horizontally for natural feel
              if (facingMode === 'user') {
                offCtx.translate(targetWidth, 0);
                offCtx.scale(-1, 1);
              }
              offCtx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
              offCtx.restore();
            }

            // Extract pixel buffer
            const imgData = offCtx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imgData.data;
            const numPixels = targetWidth * targetHeight;

            // Apply Brightness, Contrast, Gamma & Invert adjustments
            const { brightness, contrast, gamma, invert } = filterSettings;
            const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const gammaInv = 1.0 / Math.max(0.1, gamma);

            for (let i = 0; i < numPixels; i++) {
              const p = i * 4;
              let r = pixels[p];
              let g = pixels[p + 1];
              let b = pixels[p + 2];

              // Brightness
              if (brightness !== 0) {
                r += brightness;
                g += brightness;
                b += brightness;
              }

              // Contrast
              if (contrast !== 0) {
                r = contrastFactor * (r - 128) + 128;
                g = contrastFactor * (g - 128) + 128;
                b = contrastFactor * (b - 128) + 128;
              }

              // Gamma
              if (gamma !== 1.0) {
                r = 255 * Math.pow(Math.max(0, r) / 255, gammaInv);
                g = 255 * Math.pow(Math.max(0, g) / 255, gammaInv);
                b = 255 * Math.pow(Math.max(0, b) / 255, gammaInv);
              }

              // Invert
              if (invert) {
                r = 255 - r;
                g = 255 - g;
                b = 255 - b;
              }

              pixels[p] = Math.max(0, Math.min(255, r));
              pixels[p + 1] = Math.max(0, Math.min(255, g));
              pixels[p + 2] = Math.max(0, Math.min(255, b));
            }

            // Determine Target Palette
            let targetPalette = activePalette;
            if (filterSettings.paletteId === 'dynamic-16') {
              targetPalette = extractDynamic16Palette(pixels, targetWidth, targetHeight);
            }

            // Dithering & Color Quantization
            const outPixels = new Uint8ClampedArray(pixels.length);
            const outIndices = new Uint8Array(numPixels);

            applyDithering(
              pixels,
              targetWidth,
              targetHeight,
              targetPalette,
              filterSettings.ditherAlgorithm,
              filterSettings.ditherStrength,
              outPixels,
              outIndices
            );

            // Put quantized pixels to main canvas
            const outImgData = new ImageData(outPixels, targetWidth, targetHeight);
            mainCtx.putImageData(outImgData, 0, 0);

            // Process PPU 8x8 Tiles & VRAM Map
            const ppu = processPpuTiles(
              outIndices,
              targetWidth,
              targetHeight,
              currentFpsRef.current,
              frameCountRef.current
            );
            setPpuResult(ppu);
            setStats(ppu.stats);

            // Hovered Tile Coordinate translation
            if (hoveredTileCoord) {
              const tileX = Math.floor(hoveredTileCoord.x / 8);
              const tileY = Math.floor(hoveredTileCoord.y / 8);
              const mapIndex = tileY * ppu.stats.tilesX + tileX;
              if (mapIndex >= 0 && mapIndex < ppu.tileMap.length) {
                const tileId = ppu.tileMap[mapIndex] & 0x3ff;
                setHoveredTileId(tileId);
              }
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    filterSettings,
    activePalette,
    isCameraActive,
    isTestPattern,
    facingMode,
    hoveredTileCoord,
  ]);

  const handleUpdatePaletteColor = (index: number, newColor: ColorRGB555) => {
    setActivePalette((prev) => {
      const copy = [...prev];
      copy[index] = newColor;
      return copy;
    });
  };

  const handleResetDefaults = () => {
    playBeepSound(440);
    setFilterSettings(DEFAULT_SETTINGS);
    setActivePalette(BUILT_IN_PALETTES['dmg-classic']);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600">
      {/* Hidden background video element for camera stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickSnapshot={() => {
          handleTakeSnapshot();
          setActiveTab('rom');
        }}
        isStreaming={isCameraActive}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Camera Permission or Offline Notice */}
        {cameraError && (
          <div className="bg-amber-950/40 border border-amber-600/40 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => startCamera(facingMode)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Tab 1: Live Stream & Primary Studio */}
        {activeTab === 'stream' && (
          <div className="space-y-6">
            {/* Viewport & Bezel Center */}
            <div className="flex flex-col items-center justify-center py-2">
              <GbaConsoleBezel
                canvasRef={mainCanvasRef}
                filterSettings={filterSettings}
                setFilterSettings={setFilterSettings}
                stats={stats}
                isCameraActive={isCameraActive}
                facingMode={facingMode}
                onSwitchCamera={handleSwitchCamera}
                onToggleCamera={handleToggleCamera}
                isTestPattern={isTestPattern}
                onToggleTestPattern={handleToggleTestPattern}
                onTakeSnapshot={handleTakeSnapshot}
                hoveredTileId={hoveredTileId}
                setHoveredTileCoord={setHoveredTileCoord}
                isRecording={isRecording}
              />

              {/* Video Recording & Snapshot Action Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleToggleRecord}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="w-4 h-4 text-white" />
                      <span>Stop Rec ({recordingSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Disc className="w-4 h-4 text-red-500" />
                      <span>Record 8-Bit Video</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span>Media Gallery ({snapshots.length})</span>
                </button>
              </div>
            </div>

            {/* Side-by-Side Dual Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CameraControls
                filterSettings={filterSettings}
                setFilterSettings={setFilterSettings}
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={(id) => startCamera(facingMode, id)}
                onResetDefaults={handleResetDefaults}
              />

              <DitheringControls
                filterSettings={filterSettings}
                setFilterSettings={setFilterSettings}
              />
            </div>

            {/* Quick PPU Hardware Stats Bar */}
            {stats && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Live PPU VRAM Telemetry</span>
                    <p className="text-slate-400 text-[11px]">
                      {stats.uniqueTiles} of {stats.totalTiles} tiles unique · {stats.compressionRatio}% memory reduction
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
                  <span>VRAM: {((stats.vramTileBytes + stats.vramMapBytes) / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => {
                      playBeepSound(600);
                      setActiveTab('ppu');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Inspect VRAM Tiles →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: PPU Character Block (VRAM Tiles) Inspector */}
        {activeTab === 'ppu' && (
          <div className="space-y-6">
            <PpuVramInspector
              ppuResult={ppuResult}
              palette={activePalette}
              hoveredTileId={hoveredTileId}
              setHoveredTileId={setHoveredTileId}
            />
          </div>
        )}

        {/* Tab 3: Palette RAM (PRAM) Inspector */}
        {activeTab === 'palette' && (
          <div className="space-y-6">
            <PaletteInspector
              palette={activePalette}
              onUpdateColor={handleUpdatePaletteColor}
            />
          </div>
        )}

        {/* Tab 4: ROM Header & Checksum Architecture */}
        {activeTab === 'rom' && (
          <div className="space-y-6">
            <RomHeaderViewer
              ppuResult={ppuResult}
              palette={activePalette}
            />
          </div>
        )}
      </main>

      {/* Snapshots & Recording Modal */}
      <RecordingAndStreamModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        recordedVideoUrl={recordedVideoUrl}
        snapshots={snapshots}
        onDeleteSnapshot={(id) => setSnapshots((prev) => prev.filter((s) => s.id !== id))}
        onSelectSnapshot={(item) => {
          setPpuResult(item.ppuResult);
          setActivePalette(item.palette);
          setIsMediaModalOpen(false);
          setActiveTab('rom');
        }}
      />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Game Boy Advance PPU Pipeline</span>
            <span>·</span>
            <span>240×160 Mode 0 Tilemap</span>
            <span>·</span>
            <span>15-Bit RGB555</span>
          </div>
          <div>
            Built with Web Audio API & MediaStream
          </div>
        </div>
      </footer>
    </div>
  );
}
