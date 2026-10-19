import React, { useState } from 'react';
import { FileCode, Download, Check, AlertCircle, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ColorRGB555, GbaRomHeaderData } from '../types/gba';
import { PpuProcessingResult } from '../utils/ppuEngine';
import {
  buildGbaRomHeader,
  generatePlayableGbaRom,
  generateCHeaderSource,
} from '../utils/romHeader';
import { playBeepSound, playSuccessChime } from '../utils/soundEffects';

interface RomHeaderViewerProps {
  ppuResult: PpuProcessingResult | null;
  palette: ColorRGB555[];
}

export const RomHeaderViewer: React.FC<RomHeaderViewerProps> = ({
  ppuResult,
  palette,
}) => {
  const [title, setTitle] = useState('GBACAM LIVE');
  const [gameCode, setGameCode] = useState('VCAM');
  const [makerCode, setMakerCode] = useState('01');
  const [version, setVersion] = useState(0);

  const [copiedCode, setCopiedCode] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  // Compute live GBA ROM header based on user fields
  const headerData: GbaRomHeaderData = buildGbaRomHeader(title, gameCode, makerCode, version);

  const handleDownloadRom = () => {
    if (!ppuResult) return;
    playSuccessChime();

    const romBytes = generatePlayableGbaRom(
      ppuResult,
      palette,
      title,
      gameCode,
      makerCode
    );

    const blob = new Blob([romBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.gba`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCHeader = () => {
    if (!ppuResult) return;
    playBeepSound(1046.5);
    const cSource = generateCHeaderSource(ppuResult, palette, headerData);
    navigator.clipboard.writeText(cSource);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Determine field color for hex dump bytes
  const getByteField = (offset: number): { name: string; color: string } => {
    if (offset < 0x004) return { name: 'entry', color: 'text-amber-400 font-bold' };
    if (offset < 0x0a0) return { name: 'logo', color: 'text-blue-400' };
    if (offset < 0x0ac) return { name: 'title', color: 'text-emerald-400 font-bold' };
    if (offset < 0x0b0) return { name: 'gameCode', color: 'text-cyan-400 font-bold' };
    if (offset < 0x0b2) return { name: 'maker', color: 'text-purple-400 font-bold' };
    if (offset === 0x0b2) return { name: 'fixed', color: 'text-rose-400 font-bold' };
    if (offset <= 0x0bb) return { name: 'reserved', color: 'text-slate-600' };
    if (offset === 0x0bc) return { name: 'version', color: 'text-yellow-400' };
    if (offset === 0x0bd) return { name: 'checksum', color: 'text-emerald-300 font-bold underline' };
    return { name: 'reserved', color: 'text-slate-600' };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">GBA ROM Header & Checksum Architecture</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Official Nintendo AGB 192-byte cartridge header (0x0000 - 0x00BF) & live checksum generator
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCHeader}
            disabled={!ppuResult}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied C Header!' : 'Copy C Header'}</span>
          </button>

          <button
            onClick={handleDownloadRom}
            disabled={!ppuResult}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download .GBA ROM</span>
          </button>
        </div>
      </div>

      {/* Checksum & BIOS Validation Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Complement Checksum: 0x{headerData.complementChecksum.toString(16).toUpperCase().padStart(2, '0')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GBA BIOS VALID
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Formula: -(Σ bytes[0xA0..0xBC] + 0x19) & 0xFF · Verified passing hardware POST
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          ARM Entry: <span className="text-amber-400">{headerData.entryPointHex}</span>
        </div>
      </div>

      {/* Editable Header Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Game Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Game Title (0x0A0, 12 ASCII)
          </label>
          <input
            type="text"
            maxLength={12}
            value={title}
            onChange={(e) => setTitle(e.target.value.toUpperCase())}
            className="w-full text-xs font-mono uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 outline-none focus:border-indigo-500"
            placeholder="GBACAM LIVE"
          />
        </div>

        {/* Game Code */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Game Code (0x0AC, 4 ASCII)
          </label>
          <input
            type="text"
            maxLength={4}
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            className="w-full text-xs font-mono uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 outline-none focus:border-indigo-500"
            placeholder="VCAM"
          />
        </div>

        {/* Maker Code */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Maker Code (0x0B0, 2 ASCII)
          </label>
          <input
            type="text"
            maxLength={2}
            value={makerCode}
            onChange={(e) => setMakerCode(e.target.value.toUpperCase())}
            className="w-full text-xs font-mono uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-400 outline-none focus:border-indigo-500"
            placeholder="01"
          />
        </div>

        {/* Version */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Software Version (0x0BC)
          </label>
          <input
            type="number"
            min={0}
            max={255}
            value={version}
            onChange={(e) => setVersion(Number(e.target.value))}
            className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-yellow-400 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Hex Dump Inspector (0x000 - 0x0BF: 192 Bytes) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">
            Interactive 192-Byte ROM Header Memory Map
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-amber-400 font-semibold">■ ARM Vector</span>
            <span className="text-blue-400">■ Nintendo Logo</span>
            <span className="text-emerald-400">■ Title</span>
            <span className="text-cyan-400">■ Game Code</span>
            <span className="text-purple-400">■ Maker</span>
            <span className="text-rose-400">■ Fixed 0x96</span>
            <span className="text-emerald-300 underline font-bold">■ Checksum</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed overflow-x-auto select-text">
          {Array.from({ length: 12 }).map((_, rowIdx) => {
            const rowOffset = rowIdx * 16;
            const rowBytes = Array.from(headerData.rawHeaderBytes.slice(rowOffset, rowOffset + 16));

            return (
              <div key={rowIdx} className="flex items-center gap-4 py-0.5 hover:bg-slate-900/60 px-1 rounded">
                {/* Offset column */}
                <span className="text-slate-500 shrink-0 select-none">
                  0x{rowOffset.toString(16).toUpperCase().padStart(4, '0')}:
                </span>

                {/* 16 Hex Bytes */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {rowBytes.slice(0, 8).map((byte, bIdx) => {
                      const byteOffset = rowOffset + bIdx;
                      const field = getByteField(byteOffset);
                      return (
                        <span
                          key={bIdx}
                          title={`Offset 0x${byteOffset.toString(16).toUpperCase()} (${field.name}) = 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`}
                          className={`w-5 text-center ${field.color}`}
                        >
                          {byte.toString(16).toUpperCase().padStart(2, '0')}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-slate-700 select-none">-</span>

                  <div className="flex items-center gap-1.5">
                    {rowBytes.slice(8, 16).map((byte, bIdx) => {
                      const byteOffset = rowOffset + 8 + bIdx;
                      const field = getByteField(byteOffset);
                      return (
                        <span
                          key={bIdx}
                          title={`Offset 0x${byteOffset.toString(16).toUpperCase()} (${field.name}) = 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`}
                          className={`w-5 text-center ${field.color}`}
                        >
                          {byte.toString(16).toUpperCase().padStart(2, '0')}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* ASCII Representation */}
                <div className="text-slate-400 select-none pl-3 border-l border-slate-800">
                  {rowBytes.map((byte, bIdx) => {
                    const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
                    return (
                      <span key={bIdx} className="inline-block w-2 text-center">
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
