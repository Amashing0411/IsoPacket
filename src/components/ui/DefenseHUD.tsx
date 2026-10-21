/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { globalDefenseEngine, DefenseStats } from '../../engine/DefenseEngine';
import { useGameModeStore } from '../../state/useGameModeStore';
import { useTopologyStore } from '../../state/useTopologyStore';
import { useNotificationStore } from '../../state/useNotificationStore';
import { globalSimulationEngine } from '../../engine/SimulationEngine';
import { SoundFX } from '../../audio/SoundFX';

export const DefenseHUD: React.FC = () => {
  const { currentMode, returnToTitle } = useGameModeStore();
  const { addNode, activeTool, setActiveTool } = useTopologyStore();
  const { addToast } = useNotificationStore();

  const [stats, setStats] = useState<DefenseStats>(globalDefenseEngine.getStats());
  const [cash, setCash] = useState(globalSimulationEngine.getCash());

  useEffect(() => {
    // Hook up DefenseEngine callbacks
    globalDefenseEngine.onRewardCash = (amount, reason) => {
      globalSimulationEngine.addCash(amount);
      setCash(globalSimulationEngine.getCash());
      addToast(`+$${amount} • ${reason}`, 'success');
    };

    globalDefenseEngine.onCoreDamaged = (hp, maxHp) => {
      addToast(`⚠️ Core Mainframe Damaged! Integrity: ${Math.round((hp / maxHp) * 100)}%`, 'danger');
    };

    globalDefenseEngine.onMicroToast = (msg, type) => {
      addToast(msg, type);
    };

    const interval = setInterval(() => {
      setStats(globalDefenseEngine.getStats());
      setCash(globalSimulationEngine.getCash());
    }, 150);

    return () => clearInterval(interval);
  }, [addToast]);

  if (currentMode !== 'defense') return null;

  const corePercent = Math.max(0, Math.min(100, Math.round((stats.coreHp / stats.maxCoreHp) * 100)));
  let hpColor = 'from-emerald-500 to-cyan-500';
  if (corePercent < 60) hpColor = 'from-amber-500 to-yellow-500';
  if (corePercent < 30) hpColor = 'from-rose-600 to-red-500 animate-pulse';

  const handleStartWave = () => {
    globalDefenseEngine.startNextWave();
    SoundFX.playClick(900);
  };

  const handleEmp = () => {
    globalDefenseEngine.triggerEmpBlast();
  };

  const handleDeployBot = () => {
    const cost = 250;
    if (cash < cost) {
      addToast(`Need $${cost} to deploy an Autonomous AGV Bot!`, 'warning');
      return;
    }
    if (globalSimulationEngine.spendCash(cost)) {
      setCash(globalSimulationEngine.getCash());
      // Deploy bot near Core
      globalDefenseEngine.addBot(16 + Math.floor(Math.random() * 4 - 2), 16 + Math.floor(Math.random() * 4 - 2));
      SoundFX.playSnap();
      addToast(`🤖 Autonomous AGV Bot deployed! Harvesting blue Data Orbs ($).`, 'success');
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-mono">
      {/* Top Banner: Core HP, Wave Tracker & Cash */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Mode exit & Core HP */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={returnToTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all shadow-md backdrop-blur-sm cursor-pointer"
          >
            <span>←</span>
            <span>MENU</span>
          </button>

          <button
            onClick={() => {
              (window as any).__resetIsoCamera?.();
              SoundFX.playClick(900);
            }}
            title="Recenter & lock isometric perspective (or double-click canvas)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-cyan-400 transition-all shadow-md backdrop-blur-sm cursor-pointer"
          >
            <span>🎯</span>
            <span className="hidden sm:inline">CENTER</span>
          </button>

          {/* Core Health Bar */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-cyan-500/40 bg-slate-950/90 shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md">
            <span className="text-base">🛡️</span>
            <div className="flex flex-col gap-1 min-w-[130px] sm:min-w-[180px]">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-cyan-300">CORE MAINFRAME</span>
                <span className={corePercent < 30 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}>
                  {stats.coreHp}/{stats.maxCoreHp} HP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-300`}
                  style={{ width: `${corePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Wave Status & Countdown */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-rose-500/40 bg-slate-950/90 shadow-[0_0_15px_rgba(244,63,94,0.2)] backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                THREAT LEVEL
              </span>
              <span className="text-sm font-extrabold text-white">
                WAVE {stats.wave}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            {stats.waveState === 'in_progress' ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-rose-400 font-bold uppercase animate-pulse">
                  ⚔️ IN COMBAT
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  {stats.waveEnemiesRemaining} Threats Left
                </span>
              </div>
            ) : stats.waveState === 'countdown' ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-400 font-bold uppercase animate-bounce">
                  ⚠️ INCOMING IN
                </span>
                <span className="text-xs text-amber-300 font-extrabold">
                  {stats.waveCountdown}s
                </span>
              </div>
            ) : (
              <button
                onClick={handleStartWave}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                CALL WAVE {stats.wave} ▶
              </button>
            )}
          </div>
        </div>

        {/* Right: Cash & Active EMP */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Economy Cash */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-slate-950/90 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md">
            <span className="text-emerald-400 text-sm font-bold">$</span>
            <span className="text-emerald-300 font-extrabold text-sm sm:text-base">
              {cash.toLocaleString()}
            </span>
          </div>

          {/* EMP Overcharge Button */}
          <button
            onClick={handleEmp}
            disabled={!stats.isEmpReady || stats.waveState !== 'in_progress'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-all shadow-md backdrop-blur-md cursor-pointer ${
              stats.isEmpReady && stats.waveState === 'in_progress'
                ? 'border-amber-400/80 bg-gradient-to-r from-amber-600 to-yellow-600 text-white animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105'
                : 'border-slate-800 bg-slate-950/70 text-slate-500 cursor-not-allowed'
            }`}
            title="Overcharges the Core to instantly vaporize all perimeter packets with a 100 DMG shockwave"
          >
            <span>⚡</span>
            <span>{stats.isEmpReady ? 'CORE EMP' : `EMP ${stats.empCooldown}s`}</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Tactical Action Dock */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-full">
          {/* Firewall Turret */}
          <button
            onClick={() => setActiveTool(activeTool === 'firewall' ? 'select' : 'firewall')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'firewall'
                ? 'border-rose-400 bg-rose-950/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="text-sm">🔥</span>
            <div className="flex flex-col text-left">
              <span>FIREWALL TURRET</span>
              <span className="text-[10px] text-slate-400">$220 • Twin-Beam Laser</span>
            </div>
          </button>

          {/* Switch Buffer */}
          <button
            onClick={() => setActiveTool(activeTool === 'switch' ? 'select' : 'switch')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'switch'
                ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="text-sm">🔀</span>
            <div className="flex flex-col text-left">
              <span>SWITCH HUB</span>
              <span className="text-[10px] text-slate-400">$150 • +40% Atk Spd Buff</span>
            </div>
          </button>

          {/* IPS Sniper */}
          <button
            onClick={() => setActiveTool(activeTool === 'ap' ? 'select' : 'ap')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'ap'
                ? 'border-sky-400 bg-sky-950/80 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.4)]'
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="text-sm">📡</span>
            <div className="flex flex-col text-left">
              <span>IPS SNIPER</span>
              <span className="text-[10px] text-slate-400">$180 • Long-Range Railgun</span>
            </div>
          </button>

          {/* Wire Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'wire' ? 'select' : 'wire')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'wire'
                ? 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="text-sm">🔌</span>
            <div className="flex flex-col text-left">
              <span>CAT6 CABLE</span>
              <span className="text-[10px] text-slate-400">Connect to Buff</span>
            </div>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* Deploy AGV Robot */}
          <button
            onClick={handleDeployBot}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-yellow-500/60 bg-yellow-950/70 hover:bg-yellow-900/80 text-yellow-300 text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.2)]"
          >
            <span className="text-sm">🤖</span>
            <div className="flex flex-col text-left">
              <span>DEPLOY AGV BOT</span>
              <span className="text-[10px] text-yellow-400/80">$250 • Vacuums Blue Orbs ($)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
