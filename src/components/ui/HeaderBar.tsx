/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Network,
  Grid3X3,
  SunMedium,
  RotateCcw,
  HelpCircle,
  Play,
  Pause,
  StepForward,
  Flame,
  Trophy,
  DollarSign,
  Gauge,
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen,
  Users,
} from 'lucide-react';
import { useTopologyStore } from '../../state/useTopologyStore';
import { useSimulationStore } from '../../state/useSimulationStore';
import { useScenarioStore } from '../../state/useScenarioStore';
import { AudioManager } from '../../utils/AudioManager';
import { useGameModeStore } from '../../state/useGameModeStore';

interface HeaderBarProps {
  onShowHelp: () => void;
  onShowTutorial: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onShowHelp, onShowTutorial }) => {
  const showGrid = useTopologyStore((s) => s.showGrid);
  const showShadows = useTopologyStore((s) => s.showShadows);
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

  // Scenario store hooks
  const scenario = useScenarioStore((s) => s.scenario);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const openSelector = useScenarioStore((s) => s.openSelector);
  const slaPercent = useScenarioStore((s) => s.slaPercent);
  const timeAboveSlaThreshold = useScenarioStore((s) => s.timeAboveSlaThreshold);
  const spentBudget = useScenarioStore((s) => s.spentBudget);
  const toggleChaosDrawer = useScenarioStore((s) => s.toggleChaosDrawer);
  const isChaosDrawerOpen = useScenarioStore((s) => s.isChaosDrawerOpen);

  // Audio state
  const [isMuted, setIsMuted] = useState(AudioManager.getMuted());

  const handleToggleMute = () => {
    const nextMuted = AudioManager.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      AudioManager.playClick(900);
    }
  };

  const handleResetCamera = () => {
    AudioManager.playClick(750);
    if ((window as any).__resetIsoCamera) {
      (window as any).__resetIsoCamera();
    }
  };

  if (isCinemaMode) {
    return null;
  }

  const isLevel = activeScenarioId !== 'sandbox';
  const isOverBudget = isLevel && spentBudget > scenario.budget;

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 font-mono">
      {/* Brand & Active Scenario Pill */}
      <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
        <button
          onClick={() => {
            const { returnToTitle } = useGameModeStore.getState();
            returnToTitle();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-bold shadow-xl shadow-black/40 transition-all cursor-pointer"
          title="Return to Main Menu"
        >
          <span>←</span>
          <span>MENU</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a]/95 border border-cyan-500/30 text-white shadow-xl shadow-black/40">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider text-cyan-300">
                CYBERCORE
              </span>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-semibold">
                PROTOCOL DEFENSE
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Scenario Selector Button */}
        <button
          onClick={() => {
            AudioManager.playClick(800);
            openSelector();
          }}
          title="Open Scenario & Campaign Selector"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121a2c]/95 hover:bg-[#18233c] border border-amber-500/40 text-amber-300 text-xs shadow-xl shadow-black/40 transition-all cursor-pointer group"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold max-w-[130px] sm:max-w-[170px] truncate">
            {scenario.title}
          </span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/40 text-amber-400">
            {scenario.difficulty}
          </span>
        </button>

        {/* Chaos Monkey Launcher in Sandbox */}
        {activeScenarioId === 'sandbox' && (
          <button
            onClick={() => {
              AudioManager.playClick(650);
              toggleChaosDrawer();
            }}
            title="Open Chaos Monkey Fault Injection Panel"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs shadow-xl shadow-black/40 transition-all cursor-pointer ${
              isChaosDrawerOpen
                ? 'bg-rose-900/80 border-rose-400 text-white shadow-rose-950/40'
                : 'bg-[#181119]/95 hover:bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <span className="text-sm">🐒</span>
            <span className="hidden md:inline font-bold">Chaos</span>
          </button>
        )}
      </div>

      {/* Center: Tycoon Revenue & Uptime Status */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0f172a]/95 p-1 rounded-xl border border-slate-700/80 shadow-2xl shadow-black/50 flex-wrap">
        {/* Tycoon Cash & Revenue Rate */}
        <div
          title="Current Tycoon Cash & Revenue Generation Rate"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>${stats.cash !== undefined ? stats.cash : 500}</span>
          <span className="text-[10px] text-emerald-400/90 font-medium ml-0.5">
            (+${stats.revenuePerSec !== undefined ? stats.revenuePerSec : 0}/s)
          </span>
        </div>

        {/* Connected Workers Badge */}
        <div
          title="Online Connected Endpoints vs Total Endpoints"
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141d2f] border border-slate-700 text-xs text-slate-300"
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {stats.connectedEndpointsCount || 0}/{stats.totalEndpointsCount || 0} Online
          </span>
        </div>

        {/* Live SLA Uptime Gauge */}
        <div
          title="Live Network SLA Uptime Percentage (Deliveries vs. Drops)"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
            slaPercent >= 99.0
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : slaPercent >= 95.0
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>SLA {slaPercent}%</span>
        </div>

        {/* Campaign Goal Timer if playing structured level */}
        {isLevel && (
          <div
            title={`Must sustain >= 99.0% SLA for ${scenario.durationSecondsToWin} seconds`}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141d2f] border border-slate-700 text-xs text-slate-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Goal: <strong className="text-white">{Math.round(timeAboveSlaThreshold)}s</strong> / {scenario.durationSecondsToWin}s
            </span>
          </div>
        )}

        <div className="w-px h-5 bg-slate-700/60 mx-0.5 hidden sm:block" />

        {/* Play/Pause */}
        <button
          onClick={() => {
            AudioManager.playClick(isPlaying ? 600 : 900);
            togglePlay();
          }}
          title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden xl:inline">{isPlaying ? 'Play' : 'Pause'}</span>
        </button>

        {/* Speed Toggle */}
        <button
          onClick={() => {
            AudioManager.playClick(850);
            setSpeed(speed === 1 ? 2 : 1);
          }}
          title="Toggle Simulation Speed"
          className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {speed}x
        </button>

        {/* Step Forward */}
        <button
          onClick={() => {
            AudioManager.playClick(800);
            step();
          }}
          title="Single Tick Step"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        {/* DDoS Flood Button */}
        <button
          onClick={() => {
            AudioManager.playPacketDrop();
            triggerDdosSpike();
          }}
          title="Simulate High-Volume DDoS Traffic Spike from WAN"
          className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-rose-100 flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-rose-950/40"
        >
          <Flame className="w-3 h-3 text-rose-400" />
          <span className="hidden sm:inline">DDoS</span>
        </button>
      </div>

      {/* Right: Audio, Tutorial, Grid & Viewport Controls */}
      <div className="flex items-center gap-1 pointer-events-auto bg-[#0f172a]/95 p-1 rounded-xl border border-slate-700/60 shadow-xl shadow-black/40">
        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Sound & Music' : 'Mute Sound & Music'}
          className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
            isMuted
              ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden xl:inline">{isMuted ? 'Muted' : 'Audio'}</span>
        </button>

        {/* Onboarding Tutorial */}
        <button
          onClick={() => {
            AudioManager.playClick(850);
            onShowTutorial();
          }}
          title="Open Step-by-Step Cisco Tutorial"
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs text-amber-300 hover:text-white hover:bg-amber-950/40 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline">Tutorial</span>
        </button>

        {/* Grid Toggle */}
        <button
          onClick={() => {
            AudioManager.playClick(750);
            toggleGrid();
          }}
          title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
          className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
            showGrid
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="hidden xl:inline">Grid</span>
        </button>

        {/* Dynamic Shadows */}
        <button
          onClick={() => {
            AudioManager.playClick(750);
            toggleShadows();
          }}
          title={showShadows ? 'Disable Dynamic Shadows' : 'Enable Dynamic Shadows'}
          className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
            showShadows
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <SunMedium className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          title="Reset Isometric Camera to Origin"
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Controls Guide */}
        <button
          onClick={() => {
            AudioManager.playClick(800);
            onShowHelp();
          }}
          title="Controls & Instructions"
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
