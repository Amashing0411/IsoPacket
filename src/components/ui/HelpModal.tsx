/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, MousePointer, Move, Trash2, RotateCw, ZoomIn, Eye, Sparkles, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 text-slate-200 font-mono text-xs shadow-2xl shadow-cyan-950/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="font-bold text-white text-sm tracking-wide">
              IsoPacket Guide & Controls
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Navigation Controls */}
          <div className="bg-[#162032] p-3 rounded-xl border border-slate-700/60">
            <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Camera Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                <strong className="text-white">Right Drag or Shift+Left Drag:</strong> Pan isometric viewport
              </div>
              <div>
                <strong className="text-white">Middle Click Drag:</strong> Pan camera
              </div>
              <div>
                <strong className="text-white">Scroll Wheel:</strong> Zoom in & out
              </div>
              <div>
                <strong className="text-white">Reset Button:</strong> Re-center to grid origin
              </div>
            </div>
          </div>

          {/* Node Operations */}
          <div className="bg-[#162032] p-3 rounded-xl border border-slate-700/60">
            <h3 className="font-bold text-amber-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5" /> Node Manipulation
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-white">Wire:</strong> Choose the <span className="text-emerald-400">Wire</span> tool, click Node A, then click Node B to span a 3D catenary patch cable.
              </li>
              <li>
                <strong className="text-white">Place:</strong> Click any hardware icon in the bottom dock (WAN, RTR, SW, FW, SRV, DB, CLI) and click an empty grid tile.
              </li>
              <li>
                <strong className="text-white">Inspect:</strong> Choose the <span className="text-cyan-400">Inspect</span> tool and click a node to view or edit IP, Name, and Ports.
              </li>
              <li>
                <strong className="text-white">Move:</strong> Choose the <span className="text-amber-400">Move</span> tool, click a node, then click any unoccupied tile.
              </li>
              <li>
                <strong className="text-white">Delete:</strong> Choose the <span className="text-rose-400">Delete</span> tool and click a node to remove it.
              </li>
              <li>
                <strong className="text-white">Simulation Controls:</strong> Use the top bar to Play/Pause, toggle 1x/2x speed, single-step ticks, or trigger a DDoS traffic flood!
              </li>
            </ul>
          </div>

          {/* Roadmap Status */}
          <div className="bg-cyan-950/30 p-3 rounded-xl border border-cyan-500/30">
            <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Project Roadmap (Phase 3 Active)
            </h3>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phase 1: HD-2D Isometric Viewport, Procedural Pixel Textures, Grid Raycaster</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phase 2: 3D Catenary Cables, Deterministic Tick Engine, Instanced GPU Packets</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phase 3: Deep Inspection HUD, CLI Configurator & Firewall ACLs</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block ml-0.5" />
                <span>Phase 4: Campaign Scenarios & Chaos Engineering</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block ml-0.5" />
                <span>Phase 5: Open-Source Polish, Custom Sprite Studio & Topology Exporter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Got it, Let's Build!
          </button>
        </div>
      </div>
    </div>
  );
};
