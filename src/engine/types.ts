/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HardwareNodeType =
  | 'gateway'    // ISP Fiber ONT / WAN Gateway
  | 'router'     // Core L3 Router (BGP / OSPF / Static routes)
  | 'switch'     // Layer 2 Managed Switch (VLANs, Trunking)
  | 'firewall'   // Stateful Next-Gen Firewall (ACLs, NAT, IDS)
  | 'server'     // Web / Application Server (HTTP 80/443, Docker)
  | 'database'   // PostgreSQL / Redis DB Node (TCP 5432 / 6379)
  | 'client';    // Workstation / IoT Camera / LAN Client

export interface NodePort {
  id: string;
  name: string;        // e.g. "eth0", "wan0", "lan1"
  type: 'copper' | 'fiber';
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
}

export const HARDWARE_DEFS: Record<HardwareNodeType, HardwareMetadata> = {
  gateway: {
    type: 'gateway',
    name: 'WAN Fiber Gateway',
    shortDesc: 'ISP Uplink ONT with static WAN IP and BGP peering',
    accentColor: '#38bdf8', // Sky 400
    defaultPorts: 2,
    symbol: 'WAN',
    defaultIp: '198.51.100.1',
  },
  router: {
    type: 'router',
    name: 'Core Layer 3 Router',
    shortDesc: 'Inter-VLAN routing, OSPF, and hardware NAT table',
    accentColor: '#6366f1', // Indigo 500
    defaultPorts: 4,
    symbol: 'RTR',
    defaultIp: '10.0.0.1',
  },
  switch: {
    type: 'switch',
    name: 'Managed L2 Switch',
    shortDesc: '24-Port 10GbE enterprise switch with 802.1Q VLAN trunking',
    accentColor: '#10b981', // Emerald 500
    defaultPorts: 8,
    symbol: 'SW',
    defaultIp: '10.0.0.2',
  },
  firewall: {
    type: 'firewall',
    name: 'Next-Gen Firewall',
    shortDesc: 'Deep packet inspection, stateful ACLs, and rate limiting',
    accentColor: '#ef4444', // Red 500
    defaultPorts: 4,
    symbol: 'FW',
    defaultIp: '10.0.0.254',
  },
  server: {
    type: 'server',
    name: '1U Blade Server',
    shortDesc: 'High-density web/app server cluster node (Nginx/Node.js)',
    accentColor: '#a855f7', // Purple 500
    defaultPorts: 2,
    symbol: 'SRV',
    defaultIp: '10.0.10.10',
  },
  database: {
    type: 'database',
    name: 'NVMe Database Node',
    shortDesc: 'Relational data cluster with hot-swap NVMe storage arrays',
    accentColor: '#f59e0b', // Amber 500
    defaultPorts: 2,
    symbol: 'DB',
    defaultIp: '10.0.20.5',
  },
  client: {
    type: 'client',
    name: 'Workstation / IoT',
    shortDesc: 'End-user client, developer terminal, or IoT sensor',
    accentColor: '#06b6d4', // Cyan 500
    defaultPorts: 1,
    symbol: 'CLI',
    defaultIp: '10.0.30.101',
  },
};
