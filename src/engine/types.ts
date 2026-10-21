/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HardwareNodeType =
  // The 8 Core CyberCore Nodes
  | 'gateway'       // Wi-Fi 7 Core Gateway (The Central Objective)
  | 'switch'        // PoE Core Switch (Power & Routing Hub)
  | 'flak'          // DPI Flak Cannon (Rapid Swarm Shredder)
  | 'firewall'      // Firewall Scrubber (Heavy Thermal Plasma Beam)
  | 'railgun'       // Next-Gen IPS Railgun (Long-Range Sniper)
  | 'cache'         // Bandwidth Proxy Cache (Booster Battery)
  | 'harvester'     // Autonomous AGV Harvester Bay
  | 'server'        // Data Mining Server Rack (Economy Engine)
  // Legacy / Backward Compatible Types
  | 'router'
  | 'ap'
  | 'database'
  | 'pc'
  | 'laptop'
  | 'ipphone'
  | 'printer'
  | 'camera'
  | 'robot'
  | 'client';

export type ProtocolStream = 'UDP' | 'TCP' | 'TLS' | 'ICMP';

export type TierLevel = 1 | 2 | 3;

export type Tier3Branch =
  // Gateway
  | 'omni_antenna'
  | 'hardened_bunker'
  // Switch
  | 'overclock_hub'
  | 'tesla_conduit'
  // Flak Cannon
  | 'gatling_scrubber'
  | 'decryption_array'
  // Firewall
  | 'stateful_plasma'
  | 'air_gap_barricade'
  // Railgun
  | 'hyper_railgun'
  | 'zero_day_emp'
  // Cache
  | 'volatile_buffer'
  | 'nanite_repair'
  // Harvester
  | 'combat_drone'
  | 'magnet_harvester'
  // Server
  | 'crypto_miner'
  | 'honeypot_trap';

export interface NodePort {
  id: string;
  name: string;
  type: 'copper' | 'fiber' | 'wireless';
  connectedCableId?: string;
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  vlanId?: number;
  speedMbps: number;
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
  gridX: number;
  gridZ: number;
  rotation: number;
  status: 'online' | 'warning' | 'offline' | 'compromised';
  ipAddress: string;
  subnetMask: string;
  gatewayIp?: string;
  vlanId: number;
  ports: NodePort[];
  cpuUsage: number;
  memoryUsage: number;
  ingressMbps: number;
  egressMbps: number;
  droppedPackets: number;
  queueLength: number;
  aclRules: AclRule[];
  createdAt: number;

  // CyberCore: Protocol Rogue Mindustry Attributes
  tier?: TierLevel;
  tier3Branch?: Tier3Branch;
  protocolAmmo?: ProtocolStream;
  isPowered?: boolean;
  bandwidthRequired?: number; // Mbps
  bandwidthAllocated?: number;
  health?: number;
  maxHealth?: number;
  shield?: number;

  // Economy & Connectivity
  isWirelessConnected?: boolean;
  associatedApId?: string;
  productivityScore?: number;
  revenuePerSec?: number;
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

  // Power & Protocol Conduit State
  isPowered?: boolean;
  protocol?: ProtocolStream;
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
  progressOnCable: number;
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
  category: 'core' | 'distribution' | 'defense' | 'economy';
  cost: number;
  bandwidthMbps: number;
  revenuePerSec: number;
  defaultVlan: number;
  maxHealth: number;
  isWireless?: boolean;
  wirelessRadius?: number;
  tier2UpgradeCost: number;
  tier3UpgradeCost: number;
  tier3Branches?: {
    a: { id: Tier3Branch; name: string; desc: string };
    b: { id: Tier3Branch; name: string; desc: string };
  };
}

export const HARDWARE_DEFS: Record<HardwareNodeType, HardwareMetadata> = {
  // 1. Wi-Fi 7 Core Gateway (The Central Objective)
  gateway: {
    type: 'gateway',
    name: 'Wi-Fi 7 Core Gateway',
    shortDesc: 'Master network brain and master power generator. Must survive.',
    accentColor: '#06b6d4',
    defaultPorts: 4,
    symbol: 'CORE',
    defaultIp: '10.0.0.1',
    category: 'core',
    cost: 500,
    bandwidthMbps: 5000,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 100,
    tier2UpgradeCost: 200,
    tier3UpgradeCost: 450,
    tier3Branches: {
      a: { id: 'omni_antenna', name: 'Omni-Antenna', desc: 'Powers nearby nodes wirelessly within 6 tiles' },
      b: { id: 'hardened_bunker', name: 'Hardened Bunker', desc: '2.5x Max HP with reactive radial EMP blast' },
    },
  },

  // 2. PoE Core Switch (Power & Routing Hub)
  switch: {
    type: 'switch',
    name: 'PoE Core Switch',
    shortDesc: 'Distributes Bandwidth & PoE power and sets Protocol ammo streams.',
    accentColor: '#10b981',
    defaultPorts: 8,
    symbol: 'SW',
    defaultIp: '10.0.0.2',
    category: 'distribution',
    cost: 150,
    bandwidthMbps: 4000,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 80,
    tier2UpgradeCost: 120,
    tier3UpgradeCost: 280,
    tier3Branches: {
      a: { id: 'overclock_hub', name: 'Overclock Hub', desc: '+50% fire rate and 2x throughput to cabled turrets' },
      b: { id: 'tesla_conduit', name: 'Tesla Conduit', desc: 'Fires chain-lightning along cables at crossing threats' },
    },
  },

  // 3. DPI Flak Cannon (Rapid Swarm Shredder)
  flak: {
    type: 'flak',
    name: 'DPI Flak Cannon',
    shortDesc: 'Dual-barrel motorized turret shredding low-HP swarms at high cadence.',
    accentColor: '#f97316',
    defaultPorts: 2,
    symbol: 'FLAK',
    defaultIp: '10.0.1.10',
    category: 'defense',
    cost: 180,
    bandwidthMbps: 400,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 70,
    tier2UpgradeCost: 140,
    tier3UpgradeCost: 320,
    tier3Branches: {
      a: { id: 'gatling_scrubber', name: 'Gatling Scrubber', desc: 'Insane hyper-cadence anti-swarm spray' },
      b: { id: 'decryption_array', name: 'Decryption Array', desc: 'Strips shields and cloaking from armored threats' },
    },
  },

  // 4. Firewall Scrubber (Heavy Thermal Plasma Beam)
  firewall: {
    type: 'firewall',
    name: 'Firewall Scrubber',
    shortDesc: 'Heavy armored emitter firing sustained thermal plasma lasers.',
    accentColor: '#ef4444',
    defaultPorts: 2,
    symbol: 'FW',
    defaultIp: '10.0.1.20',
    category: 'defense',
    cost: 220,
    bandwidthMbps: 600,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 90,
    tier2UpgradeCost: 160,
    tier3UpgradeCost: 360,
    tier3Branches: {
      a: { id: 'stateful_plasma', name: 'Stateful Plasma', desc: 'Heavy thermal beam with burning damage-over-time' },
      b: { id: 'air_gap_barricade', name: 'Air-Gap Barricade', desc: 'Physical energy wall deflecting incoming packet waves' },
    },
  },

  // 5. Next-Gen IPS Railgun (Long-Range Sniper)
  railgun: {
    type: 'railgun',
    name: 'Next-Gen IPS Railgun',
    shortDesc: 'Slender magnetic rail firing high-velocity piercing projectile pulses.',
    accentColor: '#8b5cf6',
    defaultPorts: 2,
    symbol: 'RAIL',
    defaultIp: '10.0.1.30',
    category: 'defense',
    cost: 280,
    bandwidthMbps: 800,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 60,
    tier2UpgradeCost: 180,
    tier3UpgradeCost: 420,
    tier3Branches: {
      a: { id: 'hyper_railgun', name: 'Hyper-Railgun', desc: 'Infinite-range piercing beam across full grid lines' },
      b: { id: 'zero_day_emp', name: 'Zero-Day EMP', desc: 'Cryogenic EMP blast freezes groups and bosses for 3.5s' },
    },
  },

  // 6. Bandwidth Proxy Cache (Booster Battery)
  cache: {
    type: 'cache',
    name: 'Bandwidth Proxy Cache',
    shortDesc: 'Stores data packets, amplifies local network buffers, and stabilizes power.',
    accentColor: '#0ea5e9',
    defaultPorts: 4,
    symbol: 'CACHE',
    defaultIp: '10.0.2.1',
    category: 'distribution',
    cost: 160,
    bandwidthMbps: 2000,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 110,
    tier2UpgradeCost: 110,
    tier3UpgradeCost: 260,
    tier3Branches: {
      a: { id: 'volatile_buffer', name: 'Volatile Buffer', desc: 'Detonates in a high-damage shrapnel burst when destroyed' },
      b: { id: 'nanite_repair', name: 'Nanite Repair Node', desc: 'Restores HP and shields to adjacent damaged turrets' },
    },
  },

  // 7. Autonomous AGV Harvester Bay
  harvester: {
    type: 'harvester',
    name: 'AGV Harvester Bay',
    shortDesc: 'Deploys autonomous tracked rovers to vacuum dropped Data Crystals ($).',
    accentColor: '#eab308',
    defaultPorts: 2,
    symbol: 'AGV',
    defaultIp: '10.0.3.1',
    category: 'economy',
    cost: 240,
    bandwidthMbps: 300,
    revenuePerSec: 2,
    defaultVlan: 1,
    maxHealth: 75,
    tier2UpgradeCost: 150,
    tier3UpgradeCost: 350,
    tier3Branches: {
      a: { id: 'combat_drone', name: 'Combat Drone', desc: 'Armed patrol rover that engages leaks directly' },
      b: { id: 'magnet_harvester', name: 'Magnet Harvester', desc: 'Long-range tractor beam for instant crystal pickup' },
    },
  },

  // 8. Data Mining Server Rack (Economy Engine)
  server: {
    type: 'server',
    name: 'Data Mining Server',
    shortDesc: 'Generates passive cash per wave based on uptime and link stability.',
    accentColor: '#a855f7',
    defaultPorts: 2,
    symbol: 'MINE',
    defaultIp: '10.0.50.10',
    category: 'economy',
    cost: 300,
    bandwidthMbps: 500,
    revenuePerSec: 8,
    defaultVlan: 50,
    maxHealth: 85,
    tier2UpgradeCost: 180,
    tier3UpgradeCost: 380,
    tier3Branches: {
      a: { id: 'crypto_miner', name: 'Crypto Miner', desc: 'Exponential cash scaling per wave defended' },
      b: { id: 'honeypot_trap', name: 'Honeypot Trap', desc: 'Emits decoy beacon taunting and diverting enemy pathfinding' },
    },
  },

  // Backward Compatible Aliases
  router: {
    type: 'router',
    name: 'Core L3 Router',
    shortDesc: 'Inter-VLAN routing and hardware NAT table',
    accentColor: '#6366f1',
    defaultPorts: 4,
    symbol: 'RTR',
    defaultIp: '10.0.0.1',
    category: 'distribution',
    cost: 250,
    bandwidthMbps: 3000,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 80,
    tier2UpgradeCost: 150,
    tier3UpgradeCost: 300,
  },
  ap: {
    type: 'ap',
    name: 'Wi-Fi 6 Access Point',
    shortDesc: 'Wireless coverage for mobile endpoints',
    accentColor: '#0ea5e9',
    defaultPorts: 1,
    symbol: 'AP',
    defaultIp: '10.0.0.5',
    category: 'distribution',
    cost: 180,
    bandwidthMbps: 1200,
    revenuePerSec: 0,
    defaultVlan: 1,
    maxHealth: 60,
    wirelessRadius: 7,
    tier2UpgradeCost: 120,
    tier3UpgradeCost: 250,
  },
  database: {
    type: 'database',
    name: 'NVMe Database Node',
    shortDesc: 'Relational data cluster storage array',
    accentColor: '#f59e0b',
    defaultPorts: 2,
    symbol: 'DB',
    defaultIp: '10.0.50.5',
    category: 'economy',
    cost: 450,
    bandwidthMbps: 800,
    revenuePerSec: 12.0,
    defaultVlan: 50,
    maxHealth: 100,
    tier2UpgradeCost: 200,
    tier3UpgradeCost: 400,
  },
  pc: {
    type: 'pc',
    name: 'Office Workstation PC',
    shortDesc: 'Staff workstation terminal',
    accentColor: '#38bdf8',
    defaultPorts: 1,
    symbol: 'PC',
    defaultIp: '10.0.10.101',
    category: 'economy',
    cost: 100,
    bandwidthMbps: 100,
    revenuePerSec: 3.0,
    defaultVlan: 10,
    maxHealth: 50,
    tier2UpgradeCost: 80,
    tier3UpgradeCost: 180,
  },
  laptop: {
    type: 'laptop',
    name: 'Executive Laptop',
    shortDesc: 'Mobile laptop with Wi-Fi 6',
    accentColor: '#22d3ee',
    defaultPorts: 1,
    symbol: 'LAP',
    defaultIp: '10.0.10.102',
    category: 'economy',
    cost: 140,
    bandwidthMbps: 100,
    revenuePerSec: 4.0,
    defaultVlan: 10,
    maxHealth: 45,
    isWireless: true,
    tier2UpgradeCost: 90,
    tier3UpgradeCost: 200,
  },
  ipphone: {
    type: 'ipphone',
    name: 'Cisco VoIP Phone',
    shortDesc: 'VoIP IP desk phone',
    accentColor: '#34d399',
    defaultPorts: 2,
    symbol: 'VOIP',
    defaultIp: '10.0.20.101',
    category: 'economy',
    cost: 80,
    bandwidthMbps: 50,
    revenuePerSec: 2.0,
    defaultVlan: 20,
    maxHealth: 40,
    tier2UpgradeCost: 60,
    tier3UpgradeCost: 140,
  },
  printer: {
    type: 'printer',
    name: 'Network Laser Printer',
    shortDesc: 'Office printer',
    accentColor: '#94a3b8',
    defaultPorts: 1,
    symbol: 'PRT',
    defaultIp: '10.0.10.200',
    category: 'economy',
    cost: 90,
    bandwidthMbps: 50,
    revenuePerSec: 1.5,
    defaultVlan: 10,
    maxHealth: 40,
    tier2UpgradeCost: 60,
    tier3UpgradeCost: 140,
  },
  camera: {
    type: 'camera',
    name: 'Smart Security Camera',
    shortDesc: 'RTSP video stream',
    accentColor: '#fb7185',
    defaultPorts: 1,
    symbol: 'CAM',
    defaultIp: '10.0.30.150',
    category: 'economy',
    cost: 110,
    bandwidthMbps: 150,
    revenuePerSec: 2.5,
    defaultVlan: 30,
    maxHealth: 50,
    isWireless: true,
    tier2UpgradeCost: 80,
    tier3UpgradeCost: 180,
  },
  robot: {
    type: 'robot',
    name: 'Autonomous AGV Robot',
    shortDesc: 'Fulfillment AGV rover',
    accentColor: '#facc15',
    defaultPorts: 1,
    symbol: 'BOT',
    defaultIp: '10.0.30.201',
    category: 'economy',
    cost: 400,
    bandwidthMbps: 200,
    revenuePerSec: 18.0,
    defaultVlan: 30,
    maxHealth: 70,
    isWireless: true,
    tier2UpgradeCost: 200,
    tier3UpgradeCost: 400,
  },
  client: {
    type: 'client',
    name: 'Workstation Terminal',
    shortDesc: 'General terminal client',
    accentColor: '#06b6d4',
    defaultPorts: 1,
    symbol: 'CLI',
    defaultIp: '10.0.10.50',
    category: 'economy',
    cost: 90,
    bandwidthMbps: 100,
    revenuePerSec: 2.5,
    defaultVlan: 10,
    maxHealth: 45,
    tier2UpgradeCost: 70,
    tier3UpgradeCost: 150,
  },
};

export interface RogueliteCard {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  icon: string;
  category: 'bandwidth' | 'combat' | 'defense' | 'economy';
}
