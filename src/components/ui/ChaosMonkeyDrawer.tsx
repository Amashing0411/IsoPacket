/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Flame,
  Unplug,
  AlertOctagon,
  Skull,
  X,
  Zap,
  Radio,
  ServerCrash,
} from 'lucide-react';
import { useScenarioStore } from '../../state/useScenarioStore';

export const ChaosMonkeyDrawer: React.FC = () => {
  const isChaosDrawerOpen = useScenarioStore((s) => s.isChaosDrawerOpen);
  const toggleChaosDrawer = useScenarioStore((s) => s.toggleChaosDrawer);
  const chaosCutRandomCable = useScenarioStore((s) => s.chaosCutRandomCable);
  const chaosInjectDdosWave = useScenarioStore((s) => s.chaosInjectDdosWave);
  const chaosCrashRandomNode = useScenarioStore((s) => s.chaosCrashRandomNode);
  const chaosMessage = useScenarioStore((s) => s.chaosMessage);

  return (
    <>
      {/* Toast Alert Banner for Chaos Events */}
      {chaosMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-[#1e0d12] border-2 border-rose-500 rounded-2xl px-4 py-2.5 shadow-2xl shadow-rose-950/80 text-rose-200 text-xs font-mono font-bold flex items-center gap-2.5 animate-bounce pointer-events-none">
          <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>{chaosMessage}</span>
        </div>
      )}

      {/* Floating Chaos Monkey Drawer */}
      {isChaosDrawerOpen && (
        <div className="fixed bottom-24 right-4 z-30 w-80 max-w-[calc(100vw-32px)] bg-[#0f141f]/95 border border-rose-500/50 rounded-2xl p-4 shadow-2xl shadow-rose-950/60 font-mono text-xs select-none pointer-events-auto animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-rose-500/30 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🐒</span>
              <div>
                <h3 className="font-bold text-white text-xs">Chaos Monkey Suite</h3>
                <span className="text-[10px] text-rose-400">Fault Injection Engine</span>
              </div>
            </div>

            <button
              onClick={toggleChaosDrawer}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 mb-3 leading-normal">
            Simulate real-world infrastructure failures to test network topology resilience and automated failover.
          </p>

          <div className="space-y-2">
            <button
              onClick={chaosCutRandomCable}
              className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/60 text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Unplug className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="block text-white text-xs">Sever Random Cable</strong>
                <span className="text-[10px] text-slate-400">Simulate backhoe fiber cut</span>
              </div>
            </button>

            <button
              onClick={chaosInjectDdosWave}
              className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/60 text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="block text-white text-xs">Inject 100G DDoS Spike</strong>
                <span className="text-[10px] text-slate-400">High-intensity 8s SYN flood</span>
              </div>
            </button>

            <button
              onClick={chaosCrashRandomNode}
              className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/60 text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <ServerCrash className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="block text-white text-xs">Crash Random Server</strong>
                <span className="text-[10px] text-slate-400">Kernel panic outage for 8s</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
