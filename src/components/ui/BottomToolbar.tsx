/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MousePointer,
  Move,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Radio,
  Server,
  Database,
  Shield,
  Monitor,
  RotateCw,
  FolderDown,
  Cable,
} from 'lucide-react';
import { useTopologyStore } from '../../state/useTopologyStore';
import { HARDWARE_DEFS, HardwareNodeType } from '../../engine/types';

interface BottomToolbarProps {
  onRotateSelected?: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTool = useTopologyStore((s) => s.activeTool);
  const setActiveTool = useTopologyStore((s) => s.setActiveTool);
  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const wiringSourceNodeId = useTopologyStore((s) => s.wiringSourceNodeId);
  const setWiringSourceNodeId = useTopologyStore((s) => s.setWiringSourceNodeId);
  const rotateNode = useTopologyStore((s) => s.rotateNode);
  const loadPresetHomelab = useTopologyStore((s) => s.loadPresetHomelab);
  const clearTopology = useTopologyStore((s) => s.clearTopology);

  const hardwareTypes: HardwareNodeType[] = [
    'gateway',
    'router',
    'switch',
    'firewall',
    'server',
    'database',
    'client',
  ];

  const getHardwareIcon = (type: HardwareNodeType) => {
    switch (type) {
      case 'gateway': return Globe;
      case 'router': return Radio;
      case 'switch': return Server;
      case 'firewall': return Shield;
      case 'server': return Server;
      case 'database': return Database;
      case 'client': return Monitor;
    }
  };

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out select-none flex flex-col items-center pointer-events-none ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
      style={{
        bottom: '16px',
        maxWidth: 'min(980px, 96vw)',
        width: 'max-content',
      }}
    >
      {/* Active Wiring Hint Banner */}
      {activeTool === 'wire' && (
        <div className="pointer-events-auto mb-2 px-3.5 py-1.5 rounded-xl bg-[#0f172a]/95 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-xl shadow-black/60 animate-bounce">
          <Cable className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {wiringSourceNodeId
              ? 'Click target node to connect 3D catenary cable (or click source again to cancel)'
              : 'Wiring Mode: Click first node to start patch cable'}
          </span>
          {wiringSourceNodeId && (
            <button
              onClick={() => setWiringSourceNodeId(null)}
              className="ml-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Collapse / Expand Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="pointer-events-auto mb-1 px-3 py-1 rounded-t-lg bg-[#0f172a] border-t border-x border-slate-700/80 text-[11px] font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Show Hardware Dock</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hide Dock (Cinema Mode)</span>
          </>
        )}
      </button>

      {/* Main Unified Dock Container */}
      <div className="pointer-events-auto bg-[#0b101b] border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl shadow-black/80 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
        {/* Interaction Modes */}
        <div className="flex items-center gap-1 bg-[#151d2c] p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTool('select')}
            title="Inspect / Select Node (Click node on grid)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Inspect</span>
          </button>

          <button
            onClick={() => setActiveTool('wire')}
            title="Wire 3D Patch Cable: Click Node A then Node B"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'wire'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Wire</span>
          </button>

          <button
            onClick={() => setActiveTool('move')}
            title="Move Node (Click node then click empty target tile)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'move'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Move</span>
          </button>

          <button
            onClick={() => setActiveTool('delete')}
            title="Delete Node (Click node to remove)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'delete'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-700/60" />

        {/* Hardware Palette */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[500px]">
          {hardwareTypes.map((hwType) => {
            const def = HARDWARE_DEFS[hwType];
            const Icon = getHardwareIcon(hwType);
            const isSelected = activeTool === hwType;

            return (
              <button
                key={hwType}
                onClick={() => setActiveTool(hwType)}
                title={`${def.name}: ${def.shortDesc} (Click empty tile on grid to place)`}
                className={`relative px-2 py-1.5 rounded-xl text-xs font-mono flex flex-col items-center gap-0.5 min-w-[54px] sm:min-w-[62px] border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-lg'
                    : 'bg-[#121824] border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full mb-0.5"
                  style={{ backgroundColor: def.accentColor }}
                />
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">
                  {def.symbol}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-700/60" />

        {/* Quick Operations & Presets */}
        <div className="flex items-center gap-1">
          {selectedNodeId && (
            <button
              onClick={() => rotateNode(selectedNodeId)}
              title="Rotate Selected Node 90°"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-cyan-300 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={loadPresetHomelab}
            title="Reset to Default Homelab Topology Preset"
            className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Preset</span>
          </button>

          <button
            onClick={clearTopology}
            title="Clear all nodes from grid"
            className="px-2 py-1.5 rounded-xl bg-slate-850 hover:bg-rose-950/40 border border-slate-700/70 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
