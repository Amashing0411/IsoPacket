/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AudioManager } from '../../utils/AudioManager';

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  'BOOTSTRAP: Initializing 32x32 Isometric Data Center Floor Grid...',
  'KERNEL: Loading Cisco Catalyst 9000 & Nexus Enterprise Protocols...',
  'NETWORK: Generating 802.1Q VLAN Trunks (Data 10, Voice 20, IoT 30)...',
  'RADIO: Calibrating Wi-Fi 6 AP 7-Tile Cellular Coverage Rings...',
  'ROBOTICS: Provisioning Autonomous AGV Fulfillment Robot Fleets...',
  'AUDIO: Initializing Zero-Dependency Web Audio Synth Pipeline...',
  'SYSTEM: Tycoon Productivity & Deterministic Packet Engine Ready.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [logIndex, setLogIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsReady(true);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 18) + 12;
        return Math.min(100, next);
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (logIndex < BOOT_LOGS.length - 1) {
      const logTimer = setTimeout(() => {
        setLogIndex((i) => Math.min(BOOT_LOGS.length - 1, i + 1));
      }, 220);
      return () => clearTimeout(logTimer);
    }
  }, [logIndex]);

  const handleStart = () => {
    AudioManager.playClick(1100);
    AudioManager.startBgm();
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070a10] text-slate-100 font-mono transition-opacity duration-500 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-xl mx-4 p-8 bg-[#0c111c] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col items-center">
        {/* Glowing Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-xl font-black text-white tracking-tighter">IP</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              ISOPACKET
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              Cisco Network Tycoon & Educational Visualizer
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-cyan-400 font-semibold tracking-wide">
              {progress < 100 ? 'INITIALIZING ARCHITECTURE' : 'SYSTEM OPERATIONAL'}
            </span>
            <span className="text-sky-300 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-3 bg-slate-900 border border-slate-700 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full transition-all duration-200 shadow-sm shadow-cyan-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Boot Terminal Log Readout */}
        <div className="w-full bg-[#06080e] border border-slate-800 rounded-lg p-3.5 mb-6 text-left min-h-[96px] flex flex-col justify-end text-xs font-mono">
          <div className="text-slate-500 text-[10px] mb-1">=== CISCO FIRMWARE BOOT STREAM ===</div>
          {BOOT_LOGS.slice(Math.max(0, logIndex - 2), logIndex + 1).map((log, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-300 truncate">
              <span className="text-cyan-500 font-bold">&gt;</span>
              <span className={idx === Math.min(2, logIndex) ? 'text-cyan-300 font-medium' : 'text-slate-500'}>
                {log}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {isReady ? (
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Enter Cisco Homelab</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        ) : (
          <div className="w-full py-3.5 px-6 rounded-xl text-center text-xs text-slate-500 font-medium bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Synchronizing Cisco Topology & Sound Synthesizer...
          </div>
        )}
      </div>

      {/* Footer System Specs */}
      <div className="mt-6 text-[11px] text-slate-500 flex items-center gap-4">
        <span>32x32 Isometric Grid</span>
        <span>•</span>
        <span>Wi-Fi 6 Cellular Rings</span>
        <span>•</span>
        <span>VLAN Segmentation</span>
        <span>•</span>
        <span>Deterministic Ticks</span>
      </div>
    </div>
  );
};
