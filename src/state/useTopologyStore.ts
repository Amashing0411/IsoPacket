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

export const GRID_SIZE = 32;
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
  updateNodeVlan: (id: string, vlanId: number) => void;
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
    type: (type === 'gateway' && i === 0 ? 'fiber' : def.isWireless ? 'wireless' : 'copper') as 'copper' | 'fiber' | 'wireless',
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
    vlanId: def.defaultVlan,
    ports,
    cpuUsage: Math.floor(Math.random() * 25) + 10,
    memoryUsage: Math.floor(Math.random() * 30) + 15,
    ingressMbps: Number((Math.random() * 8 + 2).toFixed(1)),
    egressMbps: Number((Math.random() * 7 + 2).toFixed(1)),
    droppedPackets: 0,
    queueLength: 0,
    aclRules: getDefaultAclRules(type),
    createdAt: Date.now(),
    productivityScore: 100,
    revenuePerSec: def.revenuePerSec,
    hasGatewayRoute: true,
    latencyMs: 1.2,
  };
}

function createPresetTopology(): { nodes: PlacedNode[]; cables: CableConnection[] } {
  nodeIdCounter = 1;
  cableIdCounter = 1;

  // Centered Cisco Enterprise Office & Automated Warehouse Layout on 32x32 Grid
  const gw = generateNode('gateway', 11, 15, 'node_gateway_wan');
  const fw = generateNode('firewall', 13, 15, 'node_firewall_ngfw');
  const rtr = generateNode('router', 15, 15, 'node_router_core');
  const sw = generateNode('switch', 17, 15, 'node_switch_catalyst');
  const ap = generateNode('ap', 17, 12, 'node_ap_wifi6');
  const srv1 = generateNode('server', 19, 14, 'node_server_web1');
  const db = generateNode('database', 19, 16, 'node_db_primary');
  const pc = generateNode('pc', 13, 12, 'node_pc_workstation');
  const phone = generateNode('ipphone', 15, 12, 'node_phone_voip');
  const robot = generateNode('robot', 21, 13, 'node_robot_agv');
  const laptop = generateNode('laptop', 19, 11, 'node_laptop_exec');

  const nodes = [gw, fw, rtr, sw, ap, srv1, db, pc, phone, robot, laptop];

  const cables: CableConnection[] = [
    {
      id: 'cable_gw_fw',
      fromNodeId: gw.id,
      fromPortId: gw.ports[0].id,
      toNodeId: fw.id,
      toPortId: fw.ports[0].id,
      cableType: 'fiber',
      bandwidthMbps: 10000,
      currentThroughputMbps: 450,
      packetLossRate: 0,
      latencyMs: 1.2,
      color: '#eab308', // Fiber Yellow
    },
    {
      id: 'cable_fw_rtr',
      fromNodeId: fw.id,
      fromPortId: fw.ports[1].id,
      toNodeId: rtr.id,
      toPortId: rtr.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 10000,
      currentThroughputMbps: 380,
      packetLossRate: 0,
      latencyMs: 0.8,
      color: '#ef4444', // Security Firewall Red
    },
    {
      id: 'cable_rtr_sw',
      fromNodeId: rtr.id,
      fromPortId: rtr.ports[1].id,
      toNodeId: sw.id,
      toPortId: sw.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 10000,
      currentThroughputMbps: 650,
      packetLossRate: 0,
      latencyMs: 0.5,
      color: '#3b82f6', // Trunk Blue
    },
    {
      id: 'cable_sw_ap',
      fromNodeId: sw.id,
      fromPortId: sw.ports[1].id,
      toNodeId: ap.id,
      toPortId: ap.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 2500,
      currentThroughputMbps: 210,
      packetLossRate: 0,
      latencyMs: 0.6,
      color: '#0ea5e9', // AP Sky Blue
    },
    {
      id: 'cable_sw_srv1',
      fromNodeId: sw.id,
      fromPortId: sw.ports[2].id,
      toNodeId: srv1.id,
      toPortId: srv1.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 180,
      packetLossRate: 0,
      latencyMs: 0.4,
      color: '#10b981', // Server Green
    },
    {
      id: 'cable_sw_db',
      fromNodeId: sw.id,
      fromPortId: sw.ports[3].id,
      toNodeId: db.id,
      toPortId: db.ports[0].id,
      cableType: 'management',
      bandwidthMbps: 10000,
      currentThroughputMbps: 240,
      packetLossRate: 0,
      latencyMs: 0.3,
      color: '#a855f7', // DB Purple
    },
    {
      id: 'cable_rtr_pc',
      fromNodeId: rtr.id,
      fromPortId: rtr.ports[2].id,
      toNodeId: pc.id,
      toPortId: pc.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 45,
      packetLossRate: 0,
      latencyMs: 0.9,
      color: '#38bdf8', // PC Cyan
    },
    {
      id: 'cable_sw_phone',
      fromNodeId: sw.id,
      fromPortId: sw.ports[4].id,
      toNodeId: phone.id,
      toPortId: phone.ports[0].id,
      cableType: 'cat6',
      bandwidthMbps: 100,
      currentThroughputMbps: 12,
      packetLossRate: 0,
      latencyMs: 0.5,
      color: '#34d399', // Voice Green
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

    updateNodeVlan: (id, vlanId) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, vlanId } : n
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
