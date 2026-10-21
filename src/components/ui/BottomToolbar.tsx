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
  Wifi,
  Laptop,
  Phone,
  Printer,
  Camera,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useTopologyStore } from '../../state/useTopologyStore';
import { useScenarioStore } from '../../state/useScenarioStore';
import { HARDWARE_DEFS, HardwareNodeType } from '../../engine/types';
import { AudioManager } from '../../utils/AudioManager';

interface BottomToolbarProps {
  onRotateSelected?: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'infra' | 'devices'>('infra');

  const activeTool = useTopologyStore((s) => s.activeTool);
  const setActiveTool = useTopologyStore((s) => s.setActiveTool);
  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const wiringSourceNodeId = useTopologyStore((s) => s.wiringSourceNodeId);
  const setWiringSourceNodeId = useTopologyStore((s) => s.setWiringSourceNodeId);
  const rotateNode = useTopologyStore((s) => s.rotateNode);
  const startFromScratch = useTopologyStore((s) => s.startFromScratch);
  const loadPresetHomelab = useTopologyStore((s) => s.loadPresetHomelab);
  const clearTopology = useTopologyStore((s) => s.clearTopology);

  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const isCampaign = activeScenarioId !== 'sandbox';

  const infraTypes: HardwareNodeType[] = [
    'gateway',
    'router',
    'switch',
    'ap',
    'firewall',
    'server',
    'database',
  ];

  const deviceTypes: HardwareNodeType[] = [
    'pc',
    'laptop',
    'ipphone',
    'printer',
    'camera',
    'robot',
  ];

  const getHardwareIcon = (type: HardwareNodeType) => {
    switch (type) {
      case 'gateway': return Globe;
      case 'router': return Radio;
      case 'switch': return Server;
      case 'ap': return Wifi;
      case 'firewall': return Shield;
      case 'server': return Server;
      case 'database': return Database;
      case 'pc': return Monitor;
      case 'laptop': return Laptop;
      case 'ipphone': return Phone;
      case 'printer': return Printer;
      case 'camera': return Camera;
      case 'robot': return Bot;
      case 'client': return Monitor;
      case 'flak': return Shield;
      case 'railgun': return Radio;
      case 'cache': return Database;
      case 'harvester': return Bot;
      default: return Server;
    }
  };

  const currentList = activeTab === 'infra' ? infraTypes : deviceTypes;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out select-none flex flex-col items-center pointer-events-none ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
      style={{
        bottom: '12px',
        maxWidth: 'min(1080px, 98vw)',
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
              onClick={() => {
                AudioManager.playClick(650);
                setWiringSourceNodeId(null);
              }}
              className="ml-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Collapse / Expand Toggle Tab */}
      <button
        onClick={() => {
          AudioManager.playClick(750);
          setIsCollapsed(!isCollapsed);
        }}
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
      <div className="pointer-events-auto bg-[#0b101b] border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-2">
        {/* Top Control Strip: Category Tabs & Tool Modes */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#121824] p-0.5 rounded-xl border border-slate-700/50">
            <button
              onClick={() => {
                AudioManager.playClick(850);
                setActiveTab('infra');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'infra'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Infrastructure
            </button>
            <button
              onClick={() => {
                AudioManager.playClick(850);
                setActiveTab('devices');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'devices'
                  ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>End Devices</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                $$$
              </span>
            </button>
          </div>

          {/* Interaction Tools */}
          <div className="flex items-center gap-1 bg-[#151d2c] p-0.5 rounded-xl border border-slate-700/50">
            <button
              onClick={() => {
                AudioManager.playClick(900);
                setActiveTool('select');
              }}
              title="Inspect / Select Node"
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            <button
              onClick={() => {
                AudioManager.playClick(950);
                setActiveTool('wire');
              }}
              title="Wire 3D Patch Cable: Click Node A then Node B"
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'wire'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Cable className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wire</span>
            </button>

            <button
              onClick={() => {
                AudioManager.playClick(900);
                setActiveTool('move');
              }}
              title="Move Node on Grid"
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'move'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Move</span>
            </button>

            <button
              onClick={() => {
                AudioManager.playClick(700);
                setActiveTool('delete');
              }}
              title="Delete Node from Grid"
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'delete'
                  ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Bottom Strip: Hardware Scrollable Carousel & Quick Actions */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[94vw] sm:max-w-[1000px]">
          {/* Hardware Cards */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {currentList.map((hwType) => {
              const def = HARDWARE_DEFS[hwType];
              const Icon = getHardwareIcon(hwType);
              const isSelected = activeTool === hwType;

              return (
                <button
                  key={hwType}
                  onClick={() => {
                    AudioManager.playClick(1000);
                    setActiveTool(hwType);
                  }}
                  title={`${def.name}: ${def.shortDesc} • Cost: $${def.cost} • Revenue: +$${def.revenuePerSec}/s`}
                  className={`relative px-2.5 py-1.5 rounded-xl text-xs font-mono flex flex-col items-center gap-0.5 min-w-[62px] sm:min-w-[70px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
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
                  <div className="flex items-center gap-1 text-[9px] font-semibold -mt-0.5">
                    <span className="text-slate-400">${def.cost}</span>
                    {def.revenuePerSec > 0 && (
                      <span className="text-emerald-400">+${def.revenuePerSec}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-px h-8 bg-slate-700/60 flex-shrink-0" />

          {/* Quick Operations */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedNodeId && (
              <button
                onClick={() => {
                  AudioManager.playClick(850);
                  rotateNode(selectedNodeId);
                }}
                title="Rotate Selected Node 90°"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-cyan-300 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                AudioManager.playClick(900);
                startFromScratch();
              }}
              title="Start From Scratch: ISP Gateway + Starter PC ($500 Budget)"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">From Scratch</span>
            </button>

            <button
              onClick={() => {
                AudioManager.playClick(900);
                loadPresetHomelab();
              }}
              title="Load Full 32x32 Cisco Homelab Showcase"
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enterprise Demo</span>
            </button>

            <button
              onClick={() => {
                AudioManager.playPacketDrop();
                clearTopology();
              }}
              title="Clear all nodes from grid"
              className="px-2 py-1.5 rounded-xl bg-slate-850 hover:bg-rose-950/40 border border-slate-700/70 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
