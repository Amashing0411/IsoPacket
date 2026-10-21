/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScenarioDefinition, ScenarioId } from './scenarioTypes';
import { PlacedNode, CableConnection, HardwareNodeType } from './types';

let idCounter = 1;

function makeNode(type: HardwareNodeType, gx: number, gz: number, name?: string, vlan = 1): PlacedNode {
  const id = `scenario_node_${type}_${idCounter++}`;
  return {
    id,
    name: name || `${type.toUpperCase()} #${idCounter}`,
    type,
    gridX: gx,
    gridZ: gz,
    rotation: 0,
    status: 'online',
    ipAddress: type === 'gateway' ? '198.51.100.1' : type === 'database' ? '10.0.20.5' : `10.0.${vlan}.${idCounter * 10}`,
    subnetMask: '255.255.255.0',
    gatewayIp: '10.0.0.1',
    vlanId: vlan,
    ports: Array.from({ length: 4 }, (_, i) => ({
      id: `port_${id}_${i}`,
      name: `eth${i}`,
      type: type === 'gateway' && i === 0 ? 'fiber' : 'copper',
      macAddress: `52:54:00:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      speedMbps: 1000,
      isUp: true,
    })),
    cpuUsage: 15,
    memoryUsage: 25,
    ingressMbps: 0,
    egressMbps: 0,
    droppedPackets: 0,
    queueLength: 0,
    aclRules:
      type === 'firewall'
        ? [
            {
              id: `rule_${id}_ddos`,
              action: 'DROP',
              protocol: 'DDOS',
              description: 'Drop Volumetric DDoS SYN-Floods',
              enabled: true,
              hits: 0,
            },
            {
              id: `rule_${id}_http`,
              action: 'ALLOW',
              protocol: 'HTTP',
              port: 80,
              description: 'Permit Standard Web Traffic',
              enabled: true,
              hits: 0,
            },
          ]
        : [],
    createdAt: Date.now(),
  };
}

function makeCable(
  nodeA: PlacedNode,
  nodeB: PlacedNode,
  cableType: 'cat6' | 'fiber' | 'management' = 'cat6'
): CableConnection {
  return {
    id: `cable_${nodeA.id}_${nodeB.id}_${Math.random().toString(36).slice(2, 6)}`,
    fromNodeId: nodeA.id,
    fromPortId: nodeA.ports[0].id,
    toNodeId: nodeB.id,
    toPortId: nodeB.ports[0].id,
    cableType,
    bandwidthMbps: cableType === 'fiber' ? 10000 : 1000,
    currentThroughputMbps: 0,
    packetLossRate: 0,
    latencyMs: 0.8,
    color: cableType === 'fiber' ? '#eab308' : cableType === 'management' ? '#a855f7' : '#3b82f6',
  };
}

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  sandbox: {
    id: 'sandbox',
    title: 'Free Homelab Sandbox',
    subtitle: 'Full Creative Freedom & Chaos Engineering',
    difficulty: 'Sandbox',
    description:
      'Unrestricted sandbox mode with unlimited budget. Place any hardware, experiment with routing, wire patch cables, and test resilience with Chaos Monkey.',
    briefing: [
      '• Unlimited hardware budget ($999,999).',
      '• Full access to all 7 hardware nodes & 3D catenary patch cabling.',
      '• Chaos Monkey enabled: inject DDoS waves, sever random cables, or trigger node crashes.',
      '• Build the homelab of your dreams in HD-2D isometric pixel-art!',
    ],
    objectives: [
      'Build an expansive multi-tier homelab network',
      'Experiment with VLAN tags, Firewalls, and Routers',
      'Survive Chaos Monkey failure injections',
    ],
    budget: 999999,
    durationSecondsToWin: 0,
    starterNodes: () => {
      idCounter = 1;
      const gw = makeNode('gateway', 3, 4, 'WAN Fiber Gateway');
      const fw = makeNode('firewall', 5, 4, 'Next-Gen Firewall');
      const rtr = makeNode('router', 7, 4, 'Core L3 Router');
      const sw = makeNode('switch', 9, 6, 'Managed L2 Switch');
      const srv1 = makeNode('server', 11, 4, 'Web Server #1', 10);
      const srv2 = makeNode('server', 11, 6, 'Web Server #2', 10);
      const db = makeNode('database', 11, 8, 'Primary NVMe Database', 20);
      const cli = makeNode('client', 5, 8, 'Workstation Terminal', 30);
      return [gw, fw, rtr, sw, srv1, srv2, db, cli];
    },
    starterCables: (nodes) => {
      const gw = nodes.find((n) => n.type === 'gateway')!;
      const fw = nodes.find((n) => n.type === 'firewall')!;
      const rtr = nodes.find((n) => n.type === 'router')!;
      const sw = nodes.find((n) => n.type === 'switch')!;
      const srv1 = nodes[4];
      const srv2 = nodes[5];
      const db = nodes[6];
      const cli = nodes[7];
      return [
        makeCable(gw, fw, 'fiber'),
        makeCable(fw, rtr, 'cat6'),
        makeCable(rtr, sw, 'cat6'),
        makeCable(sw, srv1, 'cat6'),
        makeCable(sw, srv2, 'cat6'),
        makeCable(sw, db, 'management'),
        makeCable(rtr, cli, 'cat6'),
      ];
    },
    trafficProfile: {
      spawnInterval: 0.45,
      allowDdos: false,
    },
  },

  level1: {
    id: 'level1',
    title: '1. First Homelab Setup',
    subtitle: 'Foundational Port-to-Port Cabling',
    difficulty: 'Beginner',
    description:
      'The datacenter technicians just racked your hardware, but not a single cable has been patched! Wire the ISP Gateway to the Router, Router to Switch, and Switch to Web Server.',
    briefing: [
      '• Your server rack hardware is racked but unwired.',
      '• Use the "Wire" tool to connect: Gateway [3, 4] -> Router [7, 4].',
      '• Connect: Router [7, 4] -> Switch [9, 6].',
      '• Connect: Switch [9, 6] -> Web Server [12, 6].',
      '• Goal: Deliver packets cleanly and maintain SLA >= 99.0% for 30 seconds.',
    ],
    objectives: [
      'Patch 3D cables from Gateway -> Router -> Switch -> Web Server',
      'Ensure zero packet drops upon initial traffic ingress',
      'Maintain SLA >= 99.0% for 30 consecutive seconds',
    ],
    budget: 1600,
    durationSecondsToWin: 30,
    starterNodes: () => {
      idCounter = 1;
      const gw = makeNode('gateway', 3, 4, 'WAN Fiber Gateway');
      const rtr = makeNode('router', 7, 4, 'Core L3 Router');
      const sw = makeNode('switch', 9, 6, 'Managed L2 Switch');
      const srv = makeNode('server', 12, 6, 'Production Web Blade', 10);
      return [gw, rtr, sw, srv];
    },
    starterCables: () => [], // Completely unwired challenge!
    trafficProfile: {
      spawnInterval: 0.5,
      allowDdos: false,
    },
  },

  level2: {
    id: 'level2',
    title: '2. DDoS Scrubbing Center',
    subtitle: 'Firewall ACL Defense & Mitigation',
    difficulty: 'Intermediate',
    description:
      'A botnet has launched a high-volume SYN flood directly against your web server! Because the switch is directly exposed to WAN, your server buffer is overflowing.',
    briefing: [
      '• Threat Alert: Massive incoming DDoS packet waves from the WAN.',
      '• Delete the unshielded direct cable between Gateway and Switch.',
      '• Deploy a Next-Gen Firewall at tile [5, 4] (cost: $500).',
      '• Wire: Gateway -> Firewall -> Switch.',
      '• Configure the Firewall ACL rule: ACTION: DROP | PROTOCOL: DDOS.',
      '• Watch the 3D energy shield vaporize the attack traffic in real-time!',
    ],
    objectives: [
      'Deploy Next-Gen Firewall and reroute ingress traffic',
      'Configure Firewall ACL rule to DROP DDOS traffic',
      'Preserve legitimate HTTP traffic with SLA >= 99.0% for 30 seconds',
    ],
    budget: 2000,
    durationSecondsToWin: 30,
    starterNodes: () => {
      idCounter = 1;
      const gw = makeNode('gateway', 3, 4, 'WAN Fiber Gateway');
      const sw = makeNode('switch', 8, 4, 'Core Switch');
      const srv = makeNode('server', 12, 4, 'Web Blade Cluster', 10);
      return [gw, sw, srv];
    },
    starterCables: (nodes) => {
      const gw = nodes[0];
      const sw = nodes[1];
      const srv = nodes[2];
      // Vulnerable direct wiring
      return [makeCable(gw, sw, 'cat6'), makeCable(sw, srv, 'cat6')];
    },
    trafficProfile: {
      spawnInterval: 0.35,
      allowDdos: true, // Attack waves active!
    },
  },

  level3: {
    id: 'level3',
    title: '3. Load Balancing the Slashdot Effect',
    subtitle: 'High-Concurrency Server Scaling',
    difficulty: 'Advanced',
    description:
      'A viral product launch has triggered a massive traffic spike! Incoming legitimate HTTP requests are overflowing your single web server queue.',
    briefing: [
      '• Concurrency Surge: 3x normal HTTP traffic incoming from internet users.',
      '• Single web server queue depth is overflowing at 24/24 packets.',
      '• Purchase a second 1U Web Server from the palette ($400) and place at [11, 7].',
      '• Wire a patch cable from the L2 Switch to the new Web Server.',
      '• The network will automatically distribute requests across both servers!',
    ],
    objectives: [
      'Deploy second Web Server replica before buffer collapse',
      'Wire redundant link to L2 Switch',
      'Deliver 50+ HTTP requests with SLA >= 99.0% for 30 seconds',
    ],
    budget: 2500,
    durationSecondsToWin: 30,
    starterNodes: () => {
      idCounter = 1;
      const gw = makeNode('gateway', 3, 4, 'WAN Fiber Gateway');
      const fw = makeNode('firewall', 5, 4, 'Next-Gen Firewall');
      const sw = makeNode('switch', 8, 5, 'L2 Distribution Switch');
      const srv1 = makeNode('server', 11, 4, 'Web Server #1', 10);
      return [gw, fw, sw, srv1];
    },
    starterCables: (nodes) => {
      const gw = nodes[0];
      const fw = nodes[1];
      const sw = nodes[2];
      const srv1 = nodes[3];
      return [makeCable(gw, fw, 'fiber'), makeCable(fw, sw, 'cat6'), makeCable(sw, srv1, 'cat6')];
    },
    trafficProfile: {
      spawnInterval: 0.2, // Fast continuous traffic
      allowDdos: false,
      heavyTraffic: true,
    },
  },

  level4: {
    id: 'level4',
    title: '4. VLAN Database Isolation',
    subtitle: 'Zero-Trust Architecture & Segmentation',
    difficulty: 'Expert',
    description:
      'Security compliance failure: Database storing customer credentials is on the same open subnet as public workstations. Segment the database onto VLAN 20 and configure strict ACLs.',
    briefing: [
      '• Untrusted client workstation [5, 8] must NOT access Database [11, 8].',
      '• Only Web Servers on VLAN 10 may query the Database on VLAN 20.',
      '• Configure Firewall ACL to ALLOW SQL only to VLAN 20.',
      '• Ensure Web Servers can query database while blocking direct client queries.',
      '• Maintain SLA >= 99.0% for 30 seconds without unauthorized packet delivery.',
    ],
    objectives: [
      'Verify Database is isolated on VLAN 20',
      'Ensure Firewall ACL enforces Inter-VLAN rules',
      'Maintain SLA >= 99.0% for 30 consecutive seconds',
    ],
    budget: 2800,
    durationSecondsToWin: 30,
    starterNodes: () => {
      idCounter = 1;
      const gw = makeNode('gateway', 3, 4, 'WAN Fiber Gateway');
      const fw = makeNode('firewall', 6, 4, 'Segmentation Firewall');
      const sw = makeNode('switch', 8, 6, 'Trunk Switch');
      const srv = makeNode('server', 11, 4, 'Web Server', 10);
      const db = makeNode('database', 11, 8, 'PCI-DSS Database', 20);
      const cli = makeNode('client', 4, 8, 'Untrusted Workstation', 30);
      return [gw, fw, sw, srv, db, cli];
    },
    starterCables: (nodes) => {
      const gw = nodes[0];
      const fw = nodes[1];
      const sw = nodes[2];
      const srv = nodes[3];
      const db = nodes[4];
      const cli = nodes[5];
      return [
        makeCable(gw, fw, 'fiber'),
        makeCable(fw, sw, 'cat6'),
        makeCable(sw, srv, 'cat6'),
        makeCable(sw, db, 'management'),
        makeCable(sw, cli, 'cat6'),
      ];
    },
    trafficProfile: {
      spawnInterval: 0.35,
      allowDdos: false,
    },
  },
};
