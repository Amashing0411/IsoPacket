/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGameModeStore } from '../../state/useGameModeStore';
import { SoundFX } from '../../audio/SoundFX';

export const MainMenuOverlay: React.FC = () => {
  const { currentMode, enterDefenseMode, enterAcademyMode, enterSandboxMode } = useGameModeStore();
  const [isAudioMuted, setIsAudioMuted] = useState(SoundFX.getMuted());

  if (currentMode !== 'title') return null;

  const handleToggleMute = () => {
    const next = SoundFX.toggleMute();
    setIsAudioMuted(next);
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* CRT Scanline and Vignette Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.3)_0%,rgba(2,6,23,0.85)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />

      {/* Top Header: Branding & Audio Toggle */}
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] tracking-widest uppercase font-mono font-bold text-cyan-400/90 bg-cyan-950/70 border border-cyan-500/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            LIVE PROTOCOL VIEWPORT • SYS:ONLINE
          </span>
        </div>

        <button
          onClick={handleToggleMute}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 font-mono transition-all shadow-md backdrop-blur-sm"
          title="Toggle Procedural Web Audio"
        >
          <span>{isAudioMuted ? '🔇' : '🔊'}</span>
          <span>{isAudioMuted ? 'MUTED' : 'SYNTH AUDIO'}</span>
        </button>
      </div>

      {/* Center: Glowing CyberCore Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-4xl mx-auto pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-purple-950/90 border border-cyan-500/50 mb-5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <span className="text-cyan-400 font-bold text-xs">CYBERCORE</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-semibold text-xs tracking-wider">PROTOCOL DEFENSE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">CORE</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-mono mb-8 sm:mb-12 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          The central mainframe is under siege from malicious packet floods. Deploy real Cisco networking defenses, wire high-speed Cat6 & fiber catenary cables, and command autonomous warehouse bots.
        </p>

        {/* 3 Interactive Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
          {/* 1. Defend the Core */}
          <button
            onClick={() => {
              enterDefenseMode();
              (window as any).__resetIsoCamera?.();
            }}
            onMouseEnter={() => SoundFX.playClick(600)}
            className="group relative flex flex-col text-left p-5 sm:p-6 rounded-xl border border-rose-500/50 hover:border-rose-400 bg-gradient-to-b from-slate-900/90 via-[#180e1a]/90 to-slate-950/95 shadow-[0_0_25px_rgba(244,63,94,0.15)] hover:shadow-[0_0_35px_rgba(244,63,94,0.35)] transition-all transform hover:-translate-y-1.5 backdrop-blur-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🛡️</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ACTION DEFENSE
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-300 transition-colors mb-1.5">
              DEFEND THE CORE
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
              Stop DDoS swarms & Ransomware cryptolockers. Protect the Core Mainframe with laser scrubbers, buffer switches & railgun snipers.
            </p>
            <div className="mt-auto flex items-center text-xs font-bold text-rose-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ENGAGE COMBAT</span>
              <span>→</span>
            </div>
          </button>

          {/* 2. Network Academy */}
          <button
            onClick={() => {
              enterAcademyMode();
              (window as any).__resetIsoCamera?.();
            }}
            onMouseEnter={() => SoundFX.playClick(700)}
            className="group relative flex flex-col text-left p-5 sm:p-6 rounded-xl border border-indigo-500/50 hover:border-indigo-400 bg-gradient-to-b from-slate-900/90 via-[#101428]/90 to-slate-950/95 shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:shadow-[0_0_35px_rgba(99,102,241,0.35)] transition-all transform hover:-translate-y-1.5 backdrop-blur-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🎓</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                TRAINING PUZZLES
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
              NETWORK ACADEMY
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
              Solve gamified enterprise puzzles. Master 802.1Q VLAN trunking, Access Control Lists, QoS voice priority, and Wi-Fi 6 roaming.
            </p>
            <div className="mt-auto flex items-center text-xs font-bold text-indigo-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>START PUZZLE</span>
              <span>→</span>
            </div>
          </button>

          {/* 3. Homelab Sandbox */}
          <button
            onClick={() => {
              enterSandboxMode();
              (window as any).__resetIsoCamera?.();
            }}
            onMouseEnter={() => SoundFX.playClick(800)}
            className="group relative flex flex-col text-left p-5 sm:p-6 rounded-xl border border-cyan-500/50 hover:border-cyan-400 bg-gradient-to-b from-slate-900/90 via-[#0a1b24]/90 to-slate-950/95 shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] transition-all transform hover:-translate-y-1.5 backdrop-blur-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">⚡</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AUTONOMOUS CANVAS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5">
              HOMELAB SANDBOX
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
              Pure creative tycoon sandbox. Start with starter cash, lay 32x32 server rows, deploy autonomous AGV bots, and scale revenue from scratch.
            </p>
            <div className="mt-auto flex items-center text-xs font-bold text-cyan-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>OPEN SANDBOX</span>
              <span>→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-slate-500 text-xs font-mono w-full pointer-events-auto border-t border-slate-800/80 pt-4">
        <div className="flex items-center gap-4">
          <span>Three.js HD-2D Engine</span>
          <span>•</span>
          <span>Procedural Web Audio API</span>
          <span>•</span>
          <span>Zero Server Dependencies</span>
        </div>
        <div className="text-slate-400">
          Rotate: Right-drag • Pan: Left-drag • Zoom: Wheel/Pinch
        </div>
      </div>
    </div>
  );
};
