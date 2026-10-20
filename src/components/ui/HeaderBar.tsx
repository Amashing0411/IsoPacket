/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Network,
  Grid3X3,
  SunMedium,
  RotateCcw,
  HelpCircle,
  Play,
  Pause,
  FastForward,
  StepForward,
  Flame,
  Activity,
  ArrowDownCircle,
  XCircle,
  Cable,
} from 'lucide-react';
import { useTopologyStore } from '../../state/useTopologyStore';
import { useSimulationStore } from '../../state/useSimulationStore';

export const HeaderBar: React.FC<{ onShowHelp: () => void }> = ({ onShowHelp }) => {
  const nodes = useTopologyStore((s) => s.nodes);
  const cables = useTopologyStore((s) => s.cables);
  const hoverTile = useTopologyStore((s) => s.hoverTile);
  const showGrid = useTopologyStore((s) => s.showGrid);
  const showShadows = useTopologyStore((s) => s.showShadows);
  const activeTool = useTopologyStore((s) => s.activeTool);
  const isCinemaMode = useTopologyStore((s) => s.isCinemaMode);

  const toggleGrid = useTopologyStore((s) => s.toggleGrid);
  const toggleShadows = useTopologyStore((s) => s.toggleShadows);

  // Simulation store hooks
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const speed = useSimulationStore((s) => s.speed);
  const stats = useSimulationStore((s) => s.stats);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const step = useSimulationStore((s) => s.step);
  const triggerDdosSpike = useSimulationStore((s) => s.triggerDdosSpike);

  const handleResetCamera = () => {
    if ((window as any).__resetIsoCamera) {
      (window as any).__resetIsoCamera();
    }
  };

  if (isCinemaMode) {
    return null;
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Stats Pill */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0f172a]/95 border border-cyan-500/30 text-white shadow-xl shadow-black/40">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-cyan-300 font-mono">
                ISOPACKET
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-semibold font-mono">
                HD-2D v0.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Packet Routing & Homelab Visualizer
            </p>
          </div>
        </div>

        {/* Live Topology Counters */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0f172a]/80 border border-slate-700/60 text-xs text-slate-300 font-mono shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Nodes:</span>
            <strong className="text-white">{nodes.length}</strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <Cable className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Cables:</span>
            <strong className="text-blue-300">{cables.length}</strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">In-Flight:</span>
            <strong className="text-cyan-400">{stats.packetsInFlight}</strong>
          </div>
        </div>
      </div>

      {/* Center: Simulation Playback & DDoS Trigger Dock */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0f172a]/95 p-1 rounded-xl border border-slate-700/80 shadow-2xl shadow-black/50 font-mono">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden sm:inline">{isPlaying ? 'Running' : 'Paused'}</span>
        </button>

        {/* Speed Toggle */}
        <button
          onClick={() => setSpeed(speed === 1 ? 2 : 1)}
          title="Toggle Simulation Speed"
          className="px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {speed}x
        </button>

        {/* Step Forward */}
        <button
          onClick={step}
          title="Single Tick Step"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-6 bg-slate-700/60 mx-1" />

        {/* DDoS Traffic Flood Trigger */}
        <button
          onClick={triggerDdosSpike}
          title="Simulate High-Volume DDoS Traffic Spike from WAN"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-950/40"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="hidden sm:inline">DDoS Flood</span>
        </button>

        {/* Telemetry Spark Stats */}
        <div className="hidden xl:flex items-center gap-3 px-2 py-1 bg-[#131b29] rounded-lg border border-slate-800 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400" />
            <strong className="text-white">{stats.currentThroughputMbps}</strong> Mbps
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ArrowDownCircle className="w-3 h-3" />
            {stats.totalDelivered}
          </span>
          {stats.totalDropped > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3 h-3" />
              {stats.totalDropped}
            </span>
          )}
        </div>
      </div>

      {/* Right: Viewport Controls */}
      <div className="flex items-center gap-1.5 pointer-events-auto bg-[#0f172a]/95 p-1 rounded-xl border border-slate-700/60 shadow-xl shadow-black/40">
        <button
          onClick={toggleGrid}
          title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
          className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
            showGrid
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="hidden md:inline">Grid</span>
        </button>

        <button
          onClick={toggleShadows}
          title={showShadows ? 'Disable Dynamic Shadows' : 'Enable Dynamic Shadows'}
          className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
            showShadows
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <SunMedium className="w-4 h-4" />
          <span className="hidden md:inline">Shadows</span>
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Isometric Camera to Origin"
          className="p-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>

        <button
          onClick={onShowHelp}
          title="Controls & Instructions"
          className="p-2 rounded-lg text-xs font-mono text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">Guide</span>
        </button>
      </div>
    </header>
  );
};
