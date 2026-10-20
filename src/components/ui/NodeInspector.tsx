/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCw,
  Trash2,
  Cpu,
  HardDrive,
  Check,
  Edit2,
  Cable,
  Unplug,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Terminal,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Flame,
  Layers,
} from 'lucide-react';
import { useTopologyStore } from '../../state/useTopologyStore';
import { useSimulationStore } from '../../state/useSimulationStore';
import { HARDWARE_DEFS, PacketProtocol, AclRule } from '../../engine/types';

export const NodeInspector: React.FC = () => {
  const selectedNode = useTopologyStore((s) => s.getSelectedNode());
  const setSelectedNodeId = useTopologyStore((s) => s.setSelectedNodeId);
  const deleteNode = useTopologyStore((s) => s.deleteNode);
  const rotateNode = useTopologyStore((s) => s.rotateNode);
  const updateNodeName = useTopologyStore((s) => s.updateNodeName);
  const updateNodeIp = useTopologyStore((s) => s.updateNodeIp);
  const getCablesForNode = useTopologyStore((s) => s.getCablesForNode);
  const deleteCable = useTopologyStore((s) => s.deleteCable);
  const setActiveTool = useTopologyStore((s) => s.setActiveTool);
  const setWiringSourceNodeId = useTopologyStore((s) => s.setWiringSourceNodeId);
  const getNodeById = useTopologyStore((s) => s.getNodeById);
  const addAclRule = useTopologyStore((s) => s.addAclRule);
  const deleteAclRule = useTopologyStore((s) => s.deleteAclRule);
  const toggleAclRule = useTopologyStore((s) => s.toggleAclRule);

  const stats = useSimulationStore((s) => s.stats);

  // Inspector Tabs: 'telemetry' | 'acl' | 'cli'
  const [activeTab, setActiveTab] = useState<'telemetry' | 'acl' | 'cli'>('telemetry');

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [ipInput, setIpInput] = useState('');

  // ACL Builder Form state
  const [newAction, setNewAction] = useState<'ALLOW' | 'DROP'>('DROP');
  const [newProtocol, setNewProtocol] = useState<PacketProtocol | 'ALL'>('DDOS');
  const [newVlan, setNewVlan] = useState<number | 'ALL'>('ALL');
  const [newDesc, setNewDesc] = useState('');

  // Mini CLI Console state
  const [cliOutput, setCliOutput] = useState<string[]>([
    'IsoPacket Homelab OS v2.4 (x86_64)',
    'Type "help" for a list of network diagnostic commands.',
    '-------------------------------------------------------',
  ]);
  const [cliInput, setCliInput] = useState('');
  const cliEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNode) {
      setNameInput(selectedNode.name);
      setIpInput(selectedNode.ipAddress);
      setIsEditingName(false);
      // Auto-switch to ACL tab for firewalls if desired
      if (selectedNode.type === 'firewall' && activeTab === 'telemetry') {
        setActiveTab('acl');
      }
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliOutput]);

  if (!selectedNode) return null;

  const def = HARDWARE_DEFS[selectedNode.type];
  const connectedCables = getCablesForNode(selectedNode.id);
  const bufferOccupancy = stats.bufferOccupancyMap[selectedNode.id] || 0;
  const bufferPercent = Math.min(100, Math.round((bufferOccupancy / 24) * 100));

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateNodeName(selectedNode.id, nameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleIpBlur = () => {
    if (ipInput.trim()) {
      updateNodeIp(selectedNode.id, ipInput.trim());
    }
  };

  const handleStartWiring = () => {
    setActiveTool('wire');
    setWiringSourceNodeId(selectedNode.id);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    addAclRule(selectedNode.id, {
      action: newAction,
      protocol: newProtocol,
      targetVlan: newVlan,
      description: newDesc.trim() || `${newAction} ${newProtocol} traffic`,
      enabled: true,
    });
    setNewDesc('');
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd) return;

    const newLogs = [...cliOutput, `root@${selectedNode.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}:~# ${cmd}`];

    const parts = cmd.split(' ');
    const op = parts[0].toLowerCase();

    if (op === 'help') {
      newLogs.push(
        'Available commands:',
        '  ping <ip>         - ICMP ping connectivity test',
        '  iptables -L       - List active kernel packet filtering rules',
        '  route             - Display IP routing table & next hops',
        '  ifconfig          - Show network interface status and MACs',
        '  tcpdump           - Stream real-time captured packet frames',
        '  clear             - Clear terminal display'
      );
    } else if (op === 'ping') {
      const target = parts[1] || '10.0.0.1';
      newLogs.push(
        `PING ${target} (${target}): 56 data bytes`,
        `64 bytes from ${target}: icmp_seq=0 ttl=64 time=0.842 ms`,
        `64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.912 ms`,
        `--- ${target} ping statistics ---`,
        `2 packets transmitted, 2 packets received, 0.0% packet loss`
      );
    } else if (op === 'iptables' && parts[1] === '-l') {
      newLogs.push('Chain INPUT (policy ACCEPT)');
      if (selectedNode.aclRules && selectedNode.aclRules.length > 0) {
        selectedNode.aclRules.forEach((r, idx) => {
          newLogs.push(
            `  [${idx + 1}] ${r.action.padEnd(6)} ${r.protocol.padEnd(8)} Hits: ${r.hits} (${r.description})`
          );
        });
      } else {
        newLogs.push('  (No custom rules configured)');
      }
    } else if (op === 'route') {
      newLogs.push(
        'Kernel IP routing table',
        'Destination     Gateway         Genmask         Flags Metric Ref    Use Iface',
        '0.0.0.0         10.0.0.1        0.0.0.0         UG    100    0        0 eth0',
        '10.0.0.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0'
      );
    } else if (op === 'ifconfig' || op === 'ip') {
      selectedNode.ports.forEach((p) => {
        newLogs.push(
          `${p.name}: flags=4163<UP,BROADCAST,RUNNING> mtu 1500`,
          `        inet ${p.ipAddress || selectedNode.ipAddress}  netmask ${selectedNode.subnetMask}`,
          `        ether ${p.macAddress}  txqueuelen 1000  (${p.type})`
        );
      });
    } else if (op === 'tcpdump') {
      newLogs.push(
        'listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes',
        `06:50:12.189 IP ${selectedNode.ipAddress}.443 > 10.0.0.1.58210: Flags [P.], seq 1:1461, ack 1`,
        `06:50:12.204 IP 10.0.0.1.58210 > ${selectedNode.ipAddress}.443: Flags [.], ack 1461`
      );
    } else if (op === 'clear') {
      setCliOutput([]);
      setCliInput('');
      return;
    } else {
      newLogs.push(`bash: ${cmd}: command not found. Type "help" for options.`);
    }

    setCliOutput(newLogs);
    setCliInput('');
  };

  return (
    <aside className="fixed top-18 right-4 z-20 w-88 max-w-[calc(100vw-32px)] bg-[#0c121e]/98 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 font-mono text-xs text-slate-300 pointer-events-auto flex flex-col max-h-[calc(100vh-140px)] overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-700/60 bg-[#0f172a]/95 flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: def.accentColor }}
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              {def.name}
            </span>
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-white text-xs w-full focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h3 className="font-bold text-white text-sm truncate max-w-[210px]">
                {selectedNode.name}
              </h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 transition-opacity cursor-pointer"
                title="Rename node"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center border-b border-slate-700/60 bg-[#090e17] px-2 pt-1.5 gap-1">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-[#0c121e] text-cyan-300 border-t-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('acl')}
          className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'acl'
              ? 'bg-[#0c121e] text-rose-300 border-t-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Firewall ACLs</span>
        </button>

        <button
          onClick={() => setActiveTab('cli')}
          className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'cli'
              ? 'bg-[#0c121e] text-amber-300 border-t-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>CLI</span>
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-3.5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
        {/* ================= TAB 1: TELEMETRY ================= */}
        {activeTab === 'telemetry' && (
          <>
            {/* Live Throughput Meters */}
            <div className="grid grid-cols-2 gap-2 bg-[#121927] p-2.5 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" /> Ingress
                </span>
                <span className="font-bold text-white text-sm">
                  {selectedNode.ingressMbps || 2.4} <span className="text-[10px] text-slate-400 font-normal">Mbps</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <ArrowUpRight className="w-3 h-3 text-cyan-400" /> Egress
                </span>
                <span className="font-bold text-white text-sm">
                  {selectedNode.egressMbps || 2.1} <span className="text-[10px] text-slate-400 font-normal">Mbps</span>
                </span>
              </div>
            </div>

            {/* Buffer Queue Depth Gauge */}
            <div className="p-2.5 bg-[#121927] rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Packet Buffer Queue
                </span>
                <span className={`font-bold ${bufferPercent > 80 ? 'text-rose-400' : bufferPercent > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {bufferOccupancy} / 24 ({bufferPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    bufferPercent > 80 ? 'bg-rose-500' : bufferPercent > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.max(5, bufferPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>FIFO Buffer Threshold</span>
                <span className="text-slate-500">Overrun drops packet</span>
              </div>
            </div>

            {/* Dropped Packets Ticker */}
            <div className="flex items-center justify-between p-2.5 bg-[#121927] rounded-xl border border-slate-700/60">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Dropped / Mitigated
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
                {selectedNode.droppedPackets || 0} Packets
              </span>
            </div>

            {/* Hardware Telemetry */}
            <div className="p-2.5 bg-[#121927] rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Load
                </span>
                <span className="font-bold text-white">{selectedNode.cpuUsage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all"
                  style={{ width: `${selectedNode.cpuUsage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Memory
                </span>
                <span className="font-bold text-white">{selectedNode.memoryUsage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${selectedNode.memoryUsage}%` }}
                />
              </div>
            </div>

            {/* IP Address & VLAN */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  IPv4 Address
                </label>
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  onBlur={handleIpBlur}
                  className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 text-xs focus:border-cyan-500 focus:outline-none"
                  placeholder="192.168.1.1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">VLAN ID</label>
                  <div className="px-2.5 py-1 bg-[#0a0f18] border border-slate-700 rounded-lg text-slate-300">
                    VLAN {selectedNode.vlanId}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Subnet</label>
                  <div className="px-2.5 py-1 bg-[#0a0f18] border border-slate-700 rounded-lg text-slate-300 text-[11px] truncate">
                    {selectedNode.subnetMask}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Cables List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-emerald-400" />
                  Patch Cables ({connectedCables.length})
                </span>
                <button
                  onClick={handleStartWiring}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
                >
                  + Wire Cable
                </button>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {connectedCables.length === 0 ? (
                  <div className="p-2 rounded-lg bg-[#0a0f18] border border-slate-800 text-[11px] text-slate-500 italic text-center">
                    No patch cables connected
                  </div>
                ) : (
                  connectedCables.map((cable) => {
                    const otherNodeId =
                      cable.fromNodeId === selectedNode.id ? cable.toNodeId : cable.fromNodeId;
                    const otherNode = getNodeById(otherNodeId);

                    return (
                      <div
                        key={cable.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-[#0a0f18] border border-slate-800 text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cable.color }}
                          />
                          <span className="text-slate-200 truncate font-semibold">
                            {otherNode ? otherNode.name : 'Unknown Node'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase">
                            {cable.bandwidthMbps >= 10000 ? '10G' : '1G'}
                          </span>
                          <button
                            onClick={() => deleteCable(cable.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Disconnect cable"
                          >
                            <Unplug className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: FIREWALL ACLs ================= */}
        {activeTab === 'acl' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Kernel Packet Filter Rules ({selectedNode.aclRules?.length || 0})
              </span>
              <span className="text-[10px] text-slate-500">First-match wins</span>
            </div>

            {/* Active Rule Chain */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(!selectedNode.aclRules || selectedNode.aclRules.length === 0) ? (
                <div className="p-3 rounded-xl bg-[#0a0f18] border border-slate-800 text-center text-slate-500 italic">
                  No filtering rules configured. Traffic is permitted through by default.
                </div>
              ) : (
                selectedNode.aclRules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className={`p-2 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                      rule.enabled
                        ? rule.action === 'DROP'
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          rule.action === 'DROP'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {rule.action}
                      </span>
                      <span className="font-bold text-xs text-white">{rule.protocol}</span>
                      {rule.targetVlan && rule.targetVlan !== 'ALL' && (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          VLAN {rule.targetVlan}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[10px] text-slate-400 font-mono"
                        title="Number of packets filtered by this rule"
                      >
                        Hits: <strong className="text-white">{rule.hits}</strong>
                      </span>
                      <button
                        onClick={() => toggleAclRule(selectedNode.id, rule.id)}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border ${
                          rule.enabled
                            ? 'bg-slate-800 text-cyan-300 border-slate-700'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {rule.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => deleteAclRule(selectedNode.id, rule.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rule Builder Form */}
            <form onSubmit={handleAddRule} className="p-3 bg-[#111827] rounded-xl border border-slate-700/70 space-y-2.5">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold block">
                + Append Rule to Chain
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Action</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as 'ALLOW' | 'DROP')}
                    className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="DROP">DROP (Block)</option>
                    <option value="ALLOW">ALLOW (Permit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Protocol</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value as PacketProtocol | 'ALL')}
                    className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="DDOS">DDOS (SYN-Flood)</option>
                    <option value="HTTP">HTTP (Port 80)</option>
                    <option value="HTTPS">HTTPS (Port 443)</option>
                    <option value="SQL">SQL (Port 5432)</option>
                    <option value="DNS">DNS (Port 53)</option>
                    <option value="SSH">SSH (Port 22)</option>
                    <option value="ALL">ALL PROTOCOLS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Target VLAN</label>
                  <select
                    value={newVlan}
                    onChange={(e) => setNewVlan(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">ALL VLANS</option>
                    <option value="1">VLAN 1 (Management)</option>
                    <option value="10">VLAN 10 (Web Tier)</option>
                    <option value="20">VLAN 20 (Database)</option>
                    <option value="30">VLAN 30 (Clients)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Block malicious UDP"
                    className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Firewall Rule</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 3: CLI CONSOLE ================= */}
        {activeTab === 'cli' && (
          <div className="flex flex-col h-64 bg-[#070b12] rounded-xl border border-slate-800 p-2 text-[11px] font-mono">
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-slate-300">
              {cliOutput.map((line, i) => (
                <div key={i} className="leading-tight font-mono whitespace-pre-wrap">
                  {line.startsWith('root@') ? (
                    <span className="text-emerald-400 font-bold">{line}</span>
                  ) : line.includes('PING') || line.includes('Chain') ? (
                    <span className="text-cyan-300">{line}</span>
                  ) : line.includes('DROP') ? (
                    <span className="text-rose-400">{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}
              <div ref={cliEndRef} />
            </div>

            <form onSubmit={handleCliSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="ping 10.0.0.1, iptables -L, help"
                className="w-full bg-transparent text-white text-[11px] focus:outline-none"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-[#090e17] border-t border-slate-700/60 flex items-center gap-2">
        <button
          onClick={() => rotateNode(selectedNode.id)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotate 90°</span>
        </button>

        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="py-1.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Delete Node"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </aside>
  );
};
