/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import {
  HardwareNodeType,
  PlacedNode,
  ToolMode,
  HARDWARE_DEFS,
  CableConnection,
  AclRule,
} from '../engine/types';

export const GRID_SIZE = 16;
export const TILE_SIZE = 2.0; // World units per grid tile

interface HoverTile {
  x: number;
  z: number;
  isValid: boolean;
}

interface TopologyState {
  // Grid & Nodes
  nodes: PlacedNode[];
  cables: CableConnection[];
  selectedNodeId: string | null;
  selectedCableId: string | null;
  activeTool: ToolMode;
  hoverTile: HoverTile | null;
  wiringSourceNodeId: string | null; // Node A during "wire" tool mode

  // Viewport Settings
  showGrid: boolean;
  showShadows: boolean;
  isCinemaMode: boolean; // Hide UI HUD to view 3D scene cleanly

  // Actions
  setActiveTool: (tool: ToolMode) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedCableId: (id: string | null) => void;
  setHoverTile: (tile: HoverTile | null) => void;
  setWiringSourceNodeId: (id: string | null) => void;
  toggleGrid: () => void;
  toggleShadows: () => void;
  toggleCinemaMode: () => void;

  // Node Mutations
  addNode: (type: HardwareNodeType, gridX: number, gridZ: number) => PlacedNode | null;
  moveNode: (id: string, newGridX: number, newGridZ: number) => boolean;
  deleteNode: (id: string) => void;
  updateNodeIp: (id: string, ip: string) => void;
  updateNodeName: (id: string, name: string) => void;
  rotateNode: (id: string) => void;
  clearTopology: () => void;
  loadPresetHomelab: () => void;

  // Cable Mutations
  addCable: (
    fromNodeId: string,
    toNodeId: string,
    cableType?: 'cat6' | 'fiber' | 'management'
  ) => CableConnection | null;
  deleteCable: (cableId: string) => void;

  // ACL Rule Mutations
  addAclRule: (nodeId: string, rule: Omit<AclRule, 'id' | 'hits'>) => void;
  updateAclRule: (nodeId: string, ruleId: string, updates: Partial<AclRule>) => void;
  deleteAclRule: (nodeId: string, ruleId: string) => void;
  toggleAclRule: (nodeId: string, ruleId: string) => void;
  reorderAclRules: (nodeId: string, startIndex: number, endIndex: number) => void;

  // Query helpers
  getNodeAt: (gridX: number, gridZ: number) => PlacedNode | undefined;
  getNodeById: (id: string) => PlacedNode | undefined;
  getSelectedNode: () => PlacedNode | undefined;
  getCablesForNode: (nodeId: string) => CableConnection[];
}

let nodeIdCounter = 1;
let cableIdCounter = 1;

function getDefaultAclRules(type: HardwareNodeType): AclRule[] {
  if (type === 'firewall') {
    return [
      {
        id: 'rule_fw_ddos',
        action: 'DROP',
        protocol: 'DDOS',
        description: 'Drop Volumetric DDoS SYN-Floods',
        enabled: true,
        hits: 0,
      },
      {
        id: 'rule_fw_https',
        action: 'ALLOW',
        protocol: 'HTTPS',
        port: 443,
        description: 'Allow HTTPS Ingress Web Traffic',
        enabled: true,
        hits: 0,
      },
      {
        id: 'rule_fw_http',
        action: 'ALLOW',
        protocol: 'HTTP',
        port: 80,
        description: 'Allow HTTP Standard Web Traffic',
        enabled: true,
        hits: 0,
      },
      {
        id: 'rule_fw_sql',
        action: 'ALLOW',
        protocol: 'SQL',
        targetVlan: 20,
        description: 'Allow SQL to VLAN 20 Data Tier',
        enabled: true,
        hits: 0,
      },
      {
        id: 'rule_fw_dns',
        action: 'ALLOW',
        protocol: 'DNS',
        port: 53,
        description: 'Allow DNS Query Resolution',
        enabled: true,
        hits: 0,
      },
      {
        id: 'rule_fw_ssh',
        action: 'ALLOW',
        protocol: 'SSH',
        port: 22,
        description: 'Allow SSH Secure Administration',
        enabled: true,
        hits: 0,
      },
    ];
  } else if (type === 'router') {
    return [
      {
        id: 'rule_rtr_default',
        action: 'ALLOW',
        protocol: 'ALL',
        description: 'Default Route & Inter-VLAN Forwarding',
        enabled: true,
        hits: 0,
      },
    ];
  }
  return [];
}

function generateNode(type: HardwareNodeType, gridX: number, gridZ: number, customId?: string): PlacedNode {
  const def = HARDWARE_DEFS[type];
  const id = customId || `node_${type}_${Date.now()}_${nodeIdCounter++}`;
  const ipPrefix = def.defaultIp.split('.').slice(0, 3).join('.');
  const ipSuffix = Math.floor(Math.random() * 200) + 10;
  const ip = `${ipPrefix}.${ipSuffix}`;

  const ports = Array.from({ length: def.defaultPorts }, (_, i) => ({
    id: `port_${id}_${i}`,
    name: i === 0 && (type === 'gateway' || type === 'router') ? 'wan0' : `eth${i}`,
    type: (type === 'gateway' && i === 0 ? 'fiber' : 'copper') as 'copper' | 'fiber',
    macAddress: `00:1A:2B:${Math.floor(Math.random() * 89 + 10).toString(16).toUpperCase()}:${Math.floor(Math.random() * 89 + 10).toString(16).toUpperCase()}:${Math.floor(Math.random() * 89 + 10).toString(16).toUpperCase()}`,
    ipAddress: i === 0 ? ip : undefined,
    subnetMask: '255.255.255.0',
    speedMbps: type === 'gateway' || type === 'switch' ? 10000 : 1000,
    isUp: true,
  }));

  return {
    id,
    name: `${def.name} #${nodeIdCounter}`,
    type,
    gridX,
    gridZ,
    rotation: 0,
    status: 'online',
    ipAddress: ip,
    subnetMask: '255.255.255.0',
    gatewayIp: '10.0.0.1',
    vlanId: type === 'database' ? 20 : type === 'server' ? 10 : 1,
    ports,
    cpuUsage: Math.floor(Math.random() * 35) + 12,
    memoryUsage: Math.floor(Math.random() * 45) + 20,
    ingressMbps: Number((Math.random() * 8 + 2).toFixed(1)),
    egressMbps: Number((Math.random() * 7 + 2).toFixed(1)),
    droppedPackets: 0,
    queueLength: 0,
    aclRules: getDefaultAclRules(type),
    createdAt: Date.now(),
  };
}

function createPresetTopology(): { nodes: PlacedNode[]; cables: CableConnection[] } {
  nodeIdCounter = 1;
  cableIdCounter = 1;

  const gw = generateNode('gateway', 3, 4, 'node_gateway_wan');
  const fw = generateNode('firewall', 5, 4, 'node_firewall_ngfw');
  const rtr = generateNode('router', 7, 4, 'node_router_core');
  const sw = generateNode('switch', 9, 6, 'node_switch_l2');
  const srv1 = generateNode('server', 11, 4, 'node_server_web1');
  const srv2 = generateNode('server', 11, 6, 'node_server_web2');
  const db = generateNode('database', 11, 8, 'node_db_primary');
  const cli = generateNode('client', 5, 8, 'node_client_lan');

  const nodes = [gw, fw, rtr, sw, srv1, srv2, db, cli];

  const cables: CableConnection[] = [
    {
      id: 'cable_1_gw_fw',
      fromNodeId: gw.id,
      fromPortId: gw.ports[0].id,
      toNodeId: fw.id,
      toPortId: fw.ports[0].id,
      cableType: 'fiber',
      bandwidthMbps: 10000,
      currentThroughputMbps: 240,
      packetLossRate: 0,
      latencyMs: 1.2,
      color: '#eab308', // Fiber Yellow
    },
    {
      id: 'cable_2_fw_rtr',
      fromNodeId: fw.id,
      fromPortId: fw.ports[1].id,
      toNodeId: rtr.id,
      toPortId: rtr.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 180,
      packetLossRate: 0,
      latencyMs: 0.8,
      color: '#3b82f6', // Cat6 Blue
    },
    {
      id: 'cable_3_rtr_sw',
      fromNodeId: rtr.id,
      fromPortId: rtr.ports[1].id,
      toNodeId: sw.id,
      toPortId: sw.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 10000,
      currentThroughputMbps: 350,
      packetLossRate: 0,
      latencyMs: 0.5,
      color: '#3b82f6',
    },
    {
      id: 'cable_4_sw_srv1',
      fromNodeId: sw.id,
      fromPortId: sw.ports[1].id,
      toNodeId: srv1.id,
      toPortId: srv1.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 120,
      packetLossRate: 0,
      latencyMs: 0.4,
      color: '#10b981', // Emerald DMZ
    },
    {
      id: 'cable_5_sw_srv2',
      fromNodeId: sw.id,
      fromPortId: sw.ports[2].id,
      toNodeId: srv2.id,
      toPortId: srv2.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 95,
      packetLossRate: 0,
      latencyMs: 0.4,
      color: '#10b981',
    },
    {
      id: 'cable_6_sw_db',
      fromNodeId: sw.id,
      fromPortId: sw.ports[3].id,
      toNodeId: db.id,
      toPortId: db.ports[0].id,
      cableType: 'management',
      bandwidthMbps: 10000,
      currentThroughputMbps: 160,
      packetLossRate: 0,
      latencyMs: 0.3,
      color: '#a855f7', // DB Purple
    },
    {
      id: 'cable_7_rtr_cli',
      fromNodeId: rtr.id,
      fromPortId: rtr.ports[2].id,
      toNodeId: cli.id,
      toPortId: cli.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 45,
      packetLossRate: 0,
      latencyMs: 1.0,
      color: '#06b6d4', // Client Cyan
    },
  ];

  return { nodes, cables };
}

export const useTopologyStore = create<TopologyState>((set, get) => {
  const initial = createPresetTopology();

  return {
    nodes: initial.nodes,
    cables: initial.cables,
    selectedNodeId: initial.nodes[0].id,
    selectedCableId: null,
    activeTool: 'select',
    hoverTile: null,
    wiringSourceNodeId: null,
    showGrid: true,
    showShadows: true,
    isCinemaMode: false,

    setActiveTool: (tool) => {
      // Clear wiring source when switching tools
      set({ activeTool: tool, wiringSourceNodeId: null });
    },
    setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedCableId: null }),
    setSelectedCableId: (id) => set({ selectedCableId: id, selectedNodeId: null }),
    setHoverTile: (tile) => set({ hoverTile: tile }),
    setWiringSourceNodeId: (id) => set({ wiringSourceNodeId: id }),
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    toggleShadows: () => set((s) => ({ showShadows: !s.showShadows })),
    toggleCinemaMode: () => set((s) => ({ isCinemaMode: !s.isCinemaMode })),

    addNode: (type, gridX, gridZ) => {
      if (gridX < 0 || gridX >= GRID_SIZE || gridZ < 0 || gridZ >= GRID_SIZE) return null;
      const existing = get().nodes.find((n) => n.gridX === gridX && n.gridZ === gridZ);
      if (existing) return null;

      const newNode = generateNode(type, gridX, gridZ);
      set((state) => ({
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
      }));
      return newNode;
    },

    moveNode: (id, newGridX, newGridZ) => {
      if (newGridX < 0 || newGridX >= GRID_SIZE || newGridZ < 0 || newGridZ >= GRID_SIZE) return false;
      const occupied = get().nodes.some((n) => n.id !== id && n.gridX === newGridX && n.gridZ === newGridZ);
      if (occupied) return false;

      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, gridX: newGridX, gridZ: newGridZ } : n
        ),
      }));
      return true;
    },

    deleteNode: (id) => {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        cables: state.cables.filter((c) => c.fromNodeId !== id && c.toNodeId !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        wiringSourceNodeId: state.wiringSourceNodeId === id ? null : state.wiringSourceNodeId,
      }));
    },

    updateNodeIp: (id, ip) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, ipAddress: ip } : n
        ),
      }));
    },

    updateNodeName: (id, name) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, name } : n
        ),
      }));
    },

    rotateNode: (id) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, rotation: (n.rotation + Math.PI / 2) % (Math.PI * 2) } : n
        ),
      }));
    },

    clearTopology: () => {
      set({
        nodes: [],
        cables: [],
        selectedNodeId: null,
        selectedCableId: null,
        wiringSourceNodeId: null,
      });
    },

    loadPresetHomelab: () => {
      const preset = createPresetTopology();
      set({
        nodes: preset.nodes,
        cables: preset.cables,
        selectedNodeId: preset.nodes[0].id,
        selectedCableId: null,
        wiringSourceNodeId: null,
        activeTool: 'select',
      });
    },

    addCable: (fromNodeId, toNodeId, cableType = 'cat6') => {
      if (fromNodeId === toNodeId) return null;
      const { nodes, cables } = get();
      const nodeA = nodes.find((n) => n.id === fromNodeId);
      const nodeB = nodes.find((n) => n.id === toNodeId);
      if (!nodeA || !nodeB) return null;

      // Check if already connected
      const existing = cables.find(
        (c) =>
          (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
          (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
      );
      if (existing) return existing;

      // Find available or default port
      const portA = nodeA.ports[0]?.id || `port_${fromNodeId}_0`;
      const portB = nodeB.ports[0]?.id || `port_${toNodeId}_0`;

      let color = '#3b82f6'; // Cat6 Blue
      if (cableType === 'fiber' || nodeA.type === 'gateway' || nodeB.type === 'gateway') {
        cableType = 'fiber';
        color = '#eab308'; // Fiber Yellow
      } else if (nodeA.type === 'firewall' || nodeB.type === 'firewall') {
        color = '#ef4444'; // Security Red
      } else if (nodeA.type === 'database' || nodeB.type === 'database') {
        color = '#a855f7'; // DB Purple
      } else if (nodeA.type === 'client' || nodeB.type === 'client') {
        color = '#06b6d4'; // Client Cyan
      }

      const newCable: CableConnection = {
        id: `cable_${Date.now()}_${cableIdCounter++}`,
        fromNodeId,
        fromPortId: portA,
        toNodeId,
        toPortId: portB,
        cableType,
        bandwidthMbps: cableType === 'fiber' ? 10000 : 1000,
        currentThroughputMbps: 0,
        packetLossRate: 0,
        latencyMs: Number((Math.random() * 0.8 + 0.4).toFixed(1)),
        color,
      };

      set((state) => ({
        cables: [...state.cables, newCable],
        selectedCableId: newCable.id,
      }));

      return newCable;
    },

    deleteCable: (cableId) => {
      set((state) => ({
        cables: state.cables.filter((c) => c.id !== cableId),
        selectedCableId: state.selectedCableId === cableId ? null : state.selectedCableId,
      }));
    },

    addAclRule: (nodeId, rule) => {
      const newRule: AclRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        hits: 0,
      };
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, aclRules: [...(n.aclRules || []), newRule] } : n
        ),
      }));
    },

    updateAclRule: (nodeId, ruleId, updates) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                aclRules: n.aclRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
              }
            : n
        ),
      }));
    },

    deleteAclRule: (nodeId, ruleId) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                aclRules: n.aclRules.filter((r) => r.id !== ruleId),
              }
            : n
        ),
      }));
    },

    toggleAclRule: (nodeId, ruleId) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                aclRules: n.aclRules.map((r) =>
                  r.id === ruleId ? { ...r, enabled: !r.enabled } : r
                ),
              }
            : n
        ),
      }));
    },

    reorderAclRules: (nodeId, startIndex, endIndex) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return state;
        const newRules = [...node.aclRules];
        const [removed] = newRules.splice(startIndex, 1);
        newRules.splice(endIndex, 0, removed);
        return {
          nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, aclRules: newRules } : n)),
        };
      });
    },

    getNodeAt: (gridX, gridZ) => {
      return get().nodes.find((n) => n.gridX === gridX && n.gridZ === gridZ);
    },

    getNodeById: (id) => {
      return get().nodes.find((n) => n.id === id);
    },

    getSelectedNode: () => {
      const { nodes, selectedNodeId } = get();
      return nodes.find((n) => n.id === selectedNodeId);
    },

    getCablesForNode: (nodeId) => {
      return get().cables.filter(
        (c) => c.fromNodeId === nodeId || c.toNodeId === nodeId
      );
    },
  };
});
