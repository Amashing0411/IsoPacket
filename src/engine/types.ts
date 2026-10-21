/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HardwareNodeType =
  // Infrastructure
  | 'gateway'    // ISP Fiber ONT / WAN Gateway
  | 'router'     // Core L3 Router (BGP / OSPF / Static routes)
  | 'switch'     // Layer 2/3 Managed Switch (VLANs, Trunking)
  | 'firewall'   // Stateful Next-Gen Firewall (ACLs, NAT, IDS)
  | 'ap'         // Cisco Catalyst Wi-Fi 6 Access Point
  | 'server'     // Web / Application Server (HTTP 80/443, Docker)
  | 'database'   // PostgreSQL / Redis DB Node (TCP 5432 / 6379)
  // End Devices
  | 'pc'         // Office Workstation Desktop PC (Data VLAN 10)
  | 'laptop'     // Mobile Executive Laptop (Wi-Fi 6 or Ethernet)
  | 'ipphone'    // Cisco VoIP IP Phone (Voice VLAN 20 with QoS)
  | 'printer'    // Office Multifunction Network Printer
  | 'camera'     // HD Smart Security Camera (PoE RTSP Stream)
  | 'robot'      // Autonomous Warehouse AGV Robot (IoT VLAN 30)
  | 'client';    // Generic Workstation / IoT Client (Backward compatible)

export interface NodePort {
  id: string;
  name: string;        // e.g. "eth0", "wan0", "lan1"
  type: 'copper' | 'fiber' | 'wireless';
  connectedCableId?: string;
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  vlanId?: number;
  speedMbps: number;   // 1000, 10000
  isUp: boolean;
}

export interface AclRule {
  id: string;
  action: 'ALLOW' | 'DROP';
  protocol: PacketProtocol | 'ALL';
  port?: number | 'ALL';
  targetVlan?: number | 'ALL';
  description: string;
  enabled: boolean;
  hits: number;
}

export interface PlacedNode {
  id: string;
  name: string;
  type: HardwareNodeType;
  gridX: number;       // Grid tile coordinate [0..GRID_SIZE-1]
  gridZ: number;       // Grid tile coordinate [0..GRID_SIZE-1]
  rotation: number;    // 0, 90, 180, 270 degrees in radians
  status: 'online' | 'warning' | 'offline' | 'compromised';
  ipAddress: string;
  subnetMask: string;
  gatewayIp?: string;
  vlanId: number;
  ports: NodePort[];
  cpuUsage: number;    // 0-100%
  memoryUsage: number; // 0-100%
  ingressMbps: number;
  egressMbps: number;
  droppedPackets: number;
  queueLength: number;
  aclRules: AclRule[];
  createdAt: number;
  // Tycoon & Connectivity Metrics
  isWirelessConnected?: boolean;
  associatedApId?: string;
  productivityScore?: number; // 0 to 100%
  revenuePerSec?: number;     // $/s
  hasGatewayRoute?: boolean;
  latencyMs?: number;
}

export interface CableConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  cableType: 'cat6' | 'fiber' | 'management';
  bandwidthMbps: number;
  currentThroughputMbps: number;
  packetLossRate: number;
  latencyMs: number;
  color: string;
}

export type PacketProtocol = 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | 'SQL' | 'DDOS';

export interface NetworkPacket {
  id: string;
  protocol: PacketProtocol;
  port: number;
  srcIp: string;
  dstIp: string;
  srcNodeId: string;
  dstNodeId: string;
  currentNodeId: string;
  currentCableId: string;
  cableDirection: 'forward' | 'reverse';
  progressOnCable: number; // 0.0 to 1.0 along the catenary spline
  speed: number;
  hopCount: number;
  ttl: number;
  sizeBytes: number;
  color: string;
  status: 'in_transit' | 'queued' | 'delivered' | 'dropped';
  dropReason?: 'buffer_overflow' | 'ttl_expired' | 'no_route' | 'firewall_drop';
  createdAtTick: number;
}

export interface PacketDropEvent {
  id: string;
  nodeId: string;
  gridX: number;
  gridZ: number;
  reason: 'buffer_overflow' | 'ttl_expired' | 'no_route' | 'firewall_drop';
  protocol: PacketProtocol;
  timestamp: number;
}

export const PROTOCOL_CONFIG: Record<
  PacketProtocol,
  { defaultPort: number; color: string; label: string; sizeBytes: number; priority: number }
> = {
  HTTP: { defaultPort: 80, color: '#10b981', label: 'HTTP:80', sizeBytes: 1024, priority: 2 },
  HTTPS: { defaultPort: 443, color: '#06b6d4', label: 'HTTPS:443', sizeBytes: 1460, priority: 2 },
  DNS: { defaultPort: 53, color: '#818cf8', label: 'DNS:53', sizeBytes: 512, priority: 1 },
  SSH: { defaultPort: 22, color: '#f59e0b', label: 'SSH:22', sizeBytes: 768, priority: 1 },
  SQL: { defaultPort: 5432, color: '#c084fc', label: 'SQL:5432', sizeBytes: 2048, priority: 2 },
  DDOS: { defaultPort: 9999, color: '#ef4444', label: 'SYN-FLOOD', sizeBytes: 64, priority: 3 },
};

export type ToolMode =
  | 'select'
  | 'move'
  | 'delete'
  | 'wire'
  | HardwareNodeType;

export interface HardwareMetadata {
  type: HardwareNodeType;
  name: string;
  shortDesc: string;
  accentColor: string;
  defaultPorts: number;
  symbol: string;
  defaultIp: string;
  category: 'infrastructure' | 'end_device' | 'security';
  cost: number;
  revenuePerSec: number;
  defaultVlan: number;
  isWireless?: boolean;
  wirelessRadius?: number; // In grid tiles (e.g. 7 tiles for AP)
}

export const HARDWARE_DEFS: Record<HardwareNodeType, HardwareMetadata> = {
  // --- Infrastructure ---
  gateway: {
    type: 'gateway',
    name: 'WAN Fiber Gateway',
    shortDesc: 'ISP Uplink ONT with static WAN IP and BGP peering',
    accentColor: '#38bdf8', // Sky 400
    defaultPorts: 2,
    symbol: 'WAN',
    defaultIp: '198.51.100.1',
    category: 'infrastructure',
    cost: 100,
    revenuePerSec: 0,
    defaultVlan: 1,
  },
  router: {
    type: 'router',
    name: 'Cisco Core L3 Router',
    shortDesc: 'Inter-VLAN routing, OSPF, and hardware NAT table',
    accentColor: '#6366f1', // Indigo 500
    defaultPorts: 4,
    symbol: 'RTR',
    defaultIp: '10.0.0.1',
    category: 'infrastructure',
    cost: 250,
    revenuePerSec: 0,
    defaultVlan: 1,
  },
  switch: {
    type: 'switch',
    name: 'Cisco Catalyst L2/L3 Switch',
    shortDesc: '24-Port 10GbE enterprise switch with 802.1Q VLAN trunking',
    accentColor: '#10b981', // Emerald 500
    defaultPorts: 8,
    symbol: 'SW',
    defaultIp: '10.0.0.2',
    category: 'infrastructure',
    cost: 150,
    revenuePerSec: 0,
    defaultVlan: 1,
  },
  firewall: {
    type: 'firewall',
    name: 'Next-Gen Firewall',
    shortDesc: 'Deep packet inspection, stateful ACLs, and rate limiting',
    accentColor: '#ef4444', // Red 500
    defaultPorts: 4,
    symbol: 'FW',
    defaultIp: '10.0.0.254',
    category: 'security',
    cost: 220,
    revenuePerSec: 0,
    defaultVlan: 1,
  },
  ap: {
    type: 'ap',
    name: 'Wi-Fi 6 Access Point',
    shortDesc: 'Cisco Catalyst 9100 AP with 7-tile wireless coverage ring',
    accentColor: '#0ea5e9', // Sky 500
    defaultPorts: 1,
    symbol: 'AP',
    defaultIp: '10.0.0.5',
    category: 'infrastructure',
    cost: 180,
    revenuePerSec: 0,
    defaultVlan: 1,
    wirelessRadius: 7,
  },
  server: {
    type: 'server',
    name: '1U Blade Server',
    shortDesc: 'High-density web/app server cluster node (Nginx/Node.js)',
    accentColor: '#a855f7', // Purple 500
    defaultPorts: 2,
    symbol: 'SRV',
    defaultIp: '10.0.50.10',
    category: 'infrastructure',
    cost: 320,
    revenuePerSec: 8.0,
    defaultVlan: 50,
  },
  database: {
    type: 'database',
    name: 'NVMe Database Node',
    shortDesc: 'Relational data cluster with hot-swap NVMe storage arrays',
    accentColor: '#f59e0b', // Amber 500
    defaultPorts: 2,
    symbol: 'DB',
    defaultIp: '10.0.50.5',
    category: 'infrastructure',
    cost: 450,
    revenuePerSec: 12.0,
    defaultVlan: 50,
  },

  // --- End Devices (Tycoon Productivity & Revenue Generators) ---
  pc: {
    type: 'pc',
    name: 'Office Workstation PC',
    shortDesc: 'Staff workstation requiring internet gateway route (VLAN 10)',
    accentColor: '#38bdf8', // Sky 400
    defaultPorts: 1,
    symbol: 'PC',
    defaultIp: '10.0.10.101',
    category: 'end_device',
    cost: 100,
    revenuePerSec: 3.0,
    defaultVlan: 10,
  },
  laptop: {
    type: 'laptop',
    name: 'Mobile Executive Laptop',
    shortDesc: 'Portable laptop connecting via Wi-Fi 6 AP or Cat6 patch cable',
    accentColor: '#22d3ee', // Cyan 400
    defaultPorts: 1,
    symbol: 'LAP',
    defaultIp: '10.0.10.102',
    category: 'end_device',
    cost: 140,
    revenuePerSec: 4.0,
    defaultVlan: 10,
    isWireless: true,
  },
  ipphone: {
    type: 'ipphone',
    name: 'Cisco VoIP IP Phone',
    shortDesc: 'Enterprise desk phone on dedicated Voice VLAN 20 with QoS',
    accentColor: '#34d399', // Emerald 400
    defaultPorts: 2,
    symbol: 'VOIP',
    defaultIp: '10.0.20.101',
    category: 'end_device',
    cost: 80,
    revenuePerSec: 2.0,
    defaultVlan: 20,
  },
  printer: {
    type: 'printer',
    name: 'Network Laser Printer',
    shortDesc: 'Shared office departmental printer on Data VLAN 10',
    accentColor: '#94a3b8', // Slate 400
    defaultPorts: 1,
    symbol: 'PRT',
    defaultIp: '10.0.10.200',
    category: 'end_device',
    cost: 90,
    revenuePerSec: 1.5,
    defaultVlan: 10,
  },
  camera: {
    type: 'camera',
    name: 'Smart Security Camera',
    shortDesc: 'PoE RTSP surveillance camera streaming to security server',
    accentColor: '#fb7185', // Rose 400
    defaultPorts: 1,
    symbol: 'CAM',
    defaultIp: '10.0.30.150',
    category: 'end_device',
    cost: 110,
    revenuePerSec: 2.5,
    defaultVlan: 30,
    isWireless: true,
  },
  robot: {
    type: 'robot',
    name: 'Autonomous Warehouse Robot',
    shortDesc: 'Fulfillment AGV requiring low-latency AP or wireless roaming',
    accentColor: '#facc15', // Yellow 400
    defaultPorts: 1,
    symbol: 'BOT',
    defaultIp: '10.0.30.201',
    category: 'end_device',
    cost: 400,
    revenuePerSec: 18.0,
    defaultVlan: 30,
    isWireless: true,
  },
  client: {
    type: 'client',
    name: 'Workstation / Terminal',
    shortDesc: 'General network client terminal (legacy mode compatible)',
    accentColor: '#06b6d4',
    defaultPorts: 1,
    symbol: 'CLI',
    defaultIp: '10.0.10.50',
    category: 'end_device',
    cost: 90,
    revenuePerSec: 2.5,
    defaultVlan: 10,
  },
};
