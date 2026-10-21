/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PlacedNode,
  CableConnection,
  NetworkPacket,
  PacketDropEvent,
  PacketProtocol,
  PROTOCOL_CONFIG,
  HARDWARE_DEFS,
} from './types';

export interface TrafficProfile {
  spawnInterval?: number;
  allowDdos?: boolean;
  heavyTraffic?: boolean;
}

export interface SimulationStats {
  tickCount: number;
  packetsInFlight: number;
  totalDelivered: number;
  totalDropped: number;
  droppedByReason: Record<string, number>;
  deliveredByProtocol: Record<PacketProtocol, number>;
  currentThroughputMbps: number;
  bufferOccupancyMap: Record<string, number>; // nodeId -> queued packet count
  cash: number;
  totalRevenue: number;
  revenuePerSec: number;
  productivityScore: number;
  connectedEndpointsCount: number;
  totalEndpointsCount: number;
}

export class SimulationEngine {
  private nodes: Map<string, PlacedNode> = new Map();
  private cables: Map<string, CableConnection> = new Map();
  private adjacency: Map<string, Array<{ neighborId: string; cableId: string }>> = new Map();

  // Active packets currently traveling over cables or queued in nodes
  private activePackets: Map<string, NetworkPacket> = new Map();

  // Node packet queues (nodeId -> array of packet IDs)
  private nodeQueues: Map<string, string[]> = new Map();
  private readonly MAX_QUEUE_DEPTH = 24;

  // Recent drop events for particle burst triggers (cleared after consumed)
  private recentDropEvents: PacketDropEvent[] = [];

  // Metrics
  private tickCount = 0;
  private totalDelivered = 0;
  private totalDropped = 0;
  private droppedByReason: Record<string, number> = {
    buffer_overflow: 0,
    ttl_expired: 0,
    no_route: 0,
    firewall_drop: 0,
  };
  private deliveredByProtocol: Record<PacketProtocol, number> = {
    HTTP: 0,
    HTTPS: 0,
    DNS: 0,
    SSH: 0,
    SQL: 0,
    DDOS: 0,
  };

  private packetIdCounter = 1;
  private trafficGenTimer = 0;
  private isDdosSpikeActive = false;
  private ddosTimer = 0;
  private trafficProfile: TrafficProfile = {
    spawnInterval: 0.45,
    allowDdos: false,
    heavyTraffic: false,
  };

  // Tycoon Economy & Productivity State
  private cash = 500;
  private totalRevenue = 0;
  private revenuePerSec = 0;
  private productivityScore = 100;
  private connectedEndpointsCount = 0;
  private totalEndpointsCount = 0;
  private productivityCheckTimer = 0;

  constructor() {}

  /**
   * Tycoon Cash Operations
   */
  public getCash(): number {
    return Math.floor(this.cash);
  }

  public spendCash(amount: number): boolean {
    if (this.cash >= amount) {
      this.cash -= amount;
      return true;
    }
    return false;
  }

  public addCash(amount: number) {
    this.cash += amount;
  }

  public setCash(amount: number) {
    this.cash = amount;
  }

  /**
   * Set active traffic profile from scenario definition
   */
  public setTrafficProfile(profile: TrafficProfile) {
    this.trafficProfile = { ...profile };
    this.trafficGenTimer = 0;
  }

  /**
   * Reset all simulation statistics and inflight queues for new scenario/replay
   */
  public resetStats(initialCash = 500) {
    this.cash = initialCash;
    this.totalRevenue = 0;
    this.totalDelivered = 0;
    this.totalDropped = 0;
    this.droppedByReason = {
      buffer_overflow: 0,
      ttl_expired: 0,
      no_route: 0,
      firewall_drop: 0,
    };
    this.deliveredByProtocol = {
      HTTP: 0,
      HTTPS: 0,
      DNS: 0,
      SSH: 0,
      SQL: 0,
      DDOS: 0,
    };
    this.activePackets.clear();
    this.recentDropEvents = [];
    this.nodeQueues.clear();
    for (const [id] of this.nodes) {
      this.nodeQueues.set(id, []);
    }
  }

  /**
   * Sync engine with latest topology state from store
   */
  public updateTopology(nodes: PlacedNode[], cables: CableConnection[]) {
    this.nodes.clear();
    nodes.forEach((n) => {
      this.nodes.set(n.id, n);
      if (!this.nodeQueues.has(n.id)) {
        this.nodeQueues.set(n.id, []);
      }
    });

    this.cables.clear();
    this.adjacency.clear();

    nodes.forEach((n) => this.adjacency.set(n.id, []));

    cables.forEach((c) => {
      this.cables.set(c.id, c);
      if (this.nodes.has(c.fromNodeId) && this.nodes.has(c.toNodeId)) {
        this.adjacency.get(c.fromNodeId)?.push({ neighborId: c.toNodeId, cableId: c.id });
        this.adjacency.get(c.toNodeId)?.push({ neighborId: c.fromNodeId, cableId: c.id });
      }
    });

    // Clean up packets on removed cables or nodes
    for (const [id, pkt] of this.activePackets.entries()) {
      if (!this.cables.has(pkt.currentCableId) || !this.nodes.has(pkt.currentNodeId)) {
        this.activePackets.delete(id);
      }
    }
  }

  /**
   * Trigger a temporary high-volume DDoS traffic flood
   */
  public triggerDdosSpike(durationSeconds = 6.0) {
    this.isDdosSpikeActive = true;
    this.ddosTimer = durationSeconds;
  }

  /**
   * Compute shortest path between two nodes using Breadth-First Search
   */
  public findRoute(startNodeId: string, targetNodeId: string): string[] | null {
    if (startNodeId === targetNodeId) return [startNodeId];
    if (!this.nodes.has(startNodeId) || !this.nodes.has(targetNodeId)) return null;

    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetNodeId) {
        // Reconstruct path
        const path: string[] = [targetNodeId];
        let curr = targetNodeId;
        while (parent.has(curr)) {
          curr = parent.get(curr)!;
          path.unshift(curr);
        }
        return path;
      }

      const neighbors = this.adjacency.get(current) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.neighborId)) {
          visited.add(edge.neighborId);
          parent.set(edge.neighborId, current);
          queue.push(edge.neighborId);
        }
      }
    }

    return null;
  }

  /**
   * Spawn a new network packet
   */
  public spawnPacket(
    protocol: PacketProtocol,
    srcNodeId: string,
    dstNodeId: string,
    port?: number
  ): NetworkPacket | null {
    const srcNode = this.nodes.get(srcNodeId);
    const dstNode = this.nodes.get(dstNodeId);
    if (!srcNode || !dstNode) return null;

    const route = this.findRoute(srcNodeId, dstNodeId);
    if (!route || route.length < 2) return null;

    const nextHopNodeId = route[1];
    const edge = this.adjacency
      .get(srcNodeId)
      ?.find((e) => e.neighborId === nextHopNodeId);
    if (!edge) return null;

    const cable = this.cables.get(edge.cableId);
    if (!cable) return null;

    const cfg = PROTOCOL_CONFIG[protocol];
    const id = `pkt_${this.tickCount}_${this.packetIdCounter++}`;

    // Determine direction on cable
    const cableDirection: 'forward' | 'reverse' =
      cable.fromNodeId === srcNodeId ? 'forward' : 'reverse';

    // Packet speed based on link bandwidth and protocol
    const baseSpeed = protocol === 'DDOS' ? 1.6 : 0.95;

    const packet: NetworkPacket = {
      id,
      protocol,
      port: port || cfg.defaultPort,
      srcIp: srcNode.ipAddress,
      dstIp: dstNode.ipAddress,
      srcNodeId,
      dstNodeId,
      currentNodeId: srcNodeId,
      currentCableId: cable.id,
      cableDirection,
      progressOnCable: 0.0,
      speed: baseSpeed,
      hopCount: 0,
      ttl: 32,
      sizeBytes: cfg.sizeBytes,
      color: cfg.color,
      status: 'in_transit',
      createdAtTick: this.tickCount,
    };

    this.activePackets.set(id, packet);
    return packet;
  }

  /**
   * Evaluate ordered ACL rules on a firewall/router node
   */
  public evaluateAcl(node: PlacedNode, packet: NetworkPacket): 'ALLOW' | 'DROP' | 'PASS' {
    if (!node.aclRules || node.aclRules.length === 0) return 'PASS';

    for (const rule of node.aclRules) {
      if (!rule.enabled) continue;

      // 1. Protocol Match
      const protoMatch = rule.protocol === 'ALL' || rule.protocol === packet.protocol;
      if (!protoMatch) continue;

      // 2. Port Match
      const portMatch = !rule.port || rule.port === 'ALL' || rule.port === packet.port;
      if (!portMatch) continue;

      // 3. Target VLAN Match
      const targetNode = this.nodes.get(packet.dstNodeId);
      const vlanMatch =
        !rule.targetVlan ||
        rule.targetVlan === 'ALL' ||
        (targetNode && targetNode.vlanId === rule.targetVlan);
      if (!vlanMatch) continue;

      // Hit found!
      rule.hits++;
      return rule.action;
    }

    return 'PASS';
  }

  /**
   * Drop a packet and record particle event
   */
  private dropPacket(
    packet: NetworkPacket,
    atNodeId: string,
    reason: 'buffer_overflow' | 'ttl_expired' | 'no_route' | 'firewall_drop'
  ) {
    packet.status = 'dropped';
    packet.dropReason = reason;
    this.totalDropped++;
    this.droppedByReason[reason] = (this.droppedByReason[reason] || 0) + 1;

    const node = this.nodes.get(atNodeId);
    if (node) {
      this.recentDropEvents.push({
        id: `drop_${Date.now()}_${Math.random()}`,
        nodeId: atNodeId,
        gridX: node.gridX,
        gridZ: node.gridZ,
        reason,
        protocol: packet.protocol,
        timestamp: Date.now(),
      });
    }

    this.activePackets.delete(packet.id);
  }

  /**
   * Deliver packet to target destination
   */
  private deliverPacket(packet: NetworkPacket) {
    packet.status = 'delivered';
    this.totalDelivered++;
    this.deliveredByProtocol[packet.protocol] =
      (this.deliveredByProtocol[packet.protocol] || 0) + 1;
    this.activePackets.delete(packet.id);
  }

  /**
   * Evaluates connectivity, wireless AP coverage, and tycoon revenue loop
   */
  public updateProductivityAndEconomy(dt: number) {
    const gateways = Array.from(this.nodes.values()).filter((n) => n.type === 'gateway');
    const aps = Array.from(this.nodes.values()).filter((n) => n.type === 'ap');

    // Determine which APs have a cabled route to any Gateway
    const activeAps = aps.filter((ap) => {
      return gateways.some((gw) => this.findRoute(ap.id, gw.id) !== null);
    });

    let activeWorkers = 0;
    let totalWorkers = 0;
    let totalRevPerSec = 0;

    for (const node of this.nodes.values()) {
      const def = HARDWARE_DEFS[node.type];
      const isEndpoint = def.category === 'end_device' || node.type === 'server' || node.type === 'database';

      if (!isEndpoint) continue;
      totalWorkers++;

      // Check cabled route to gateway
      const hasCabledRoute = gateways.some((gw) => this.findRoute(node.id, gw.id) !== null);
      let isConnected = hasCabledRoute;
      let associatedAp: PlacedNode | undefined;

      // If not cabled, check wireless coverage
      if (!hasCabledRoute && def.isWireless) {
        const radius = 7;
        associatedAp = activeAps.find((ap) => {
          return Math.hypot(node.gridX - ap.gridX, node.gridZ - ap.gridZ) <= radius;
        });
        if (associatedAp) {
          isConnected = true;
          node.isWirelessConnected = true;
          node.associatedApId = associatedAp.id;
        } else {
          node.isWirelessConnected = false;
          node.associatedApId = undefined;
        }
      } else {
        node.isWirelessConnected = false;
        node.associatedApId = undefined;
      }

      node.hasGatewayRoute = isConnected;

      if (isConnected) {
        activeWorkers++;
        // Productivity score: 100% minus queue lag
        const queuePenalty = Math.min(25, (node.queueLength || 0) * 2);
        node.productivityScore = Math.max(50, 100 - queuePenalty);
        const nodeRev = def.revenuePerSec * (node.productivityScore / 100);
        node.revenuePerSec = Number(nodeRev.toFixed(1));
        totalRevPerSec += nodeRev;
        node.status = 'online';
      } else {
        node.productivityScore = 0;
        node.revenuePerSec = 0;
        node.status = 'warning';
      }
    }

    this.connectedEndpointsCount = activeWorkers;
    this.totalEndpointsCount = totalWorkers;
    this.productivityScore = totalWorkers > 0 ? (activeWorkers / totalWorkers) * 100 : 100;
    this.revenuePerSec = totalRevPerSec;

    // Accumulate Tycoon cash
    this.cash += totalRevPerSec * dt;
    this.totalRevenue += totalRevPerSec * dt;
  }

  /**
   * Automatic background traffic generator with support for scenario traffic waves
   */
  private generateBackgroundTraffic(dt: number) {
    this.trafficGenTimer += dt;
    this.productivityCheckTimer += dt;

    if (this.productivityCheckTimer >= 0.5) {
      this.productivityCheckTimer = 0;
      this.updateProductivityAndEconomy(0.5);
    }

    if (this.isDdosSpikeActive) {
      this.ddosTimer -= dt;
      if (this.ddosTimer <= 0) {
        this.isDdosSpikeActive = false;
      }
    }

    const gateways = Array.from(this.nodes.values()).filter((n) => n.type === 'gateway');
    const servers = Array.from(this.nodes.values()).filter((n) => n.type === 'server');
    const databases = Array.from(this.nodes.values()).filter((n) => n.type === 'database');
    const clients = Array.from(this.nodes.values()).filter(
      (n) => n.type === 'client' || n.type === 'pc' || n.type === 'laptop'
    );
    const phones = Array.from(this.nodes.values()).filter((n) => n.type === 'ipphone');
    const cameras = Array.from(this.nodes.values()).filter((n) => n.type === 'camera');
    const robots = Array.from(this.nodes.values()).filter((n) => n.type === 'robot');

    const shouldFloodDdos = this.isDdosSpikeActive || this.trafficProfile.allowDdos;

    // High frequency DDoS spike packets (from WAN Gateway to servers or switches)
    if (shouldFloodDdos && gateways.length > 0 && servers.length > 0) {
      if (Math.random() > 0.4) {
        const gw = gateways[Math.floor(Math.random() * gateways.length)];
        const srv = servers[Math.floor(Math.random() * servers.length)];
        const burstCount = this.isDdosSpikeActive ? 3 : 2;
        for (let i = 0; i < burstCount; i++) {
          this.spawnPacket('DDOS', gw.id, srv.id, 9999);
        }
      }
    }

    // Traffic cadence based on scenario spawnInterval
    const targetInterval = this.trafficProfile.spawnInterval || 0.45;
    if (this.trafficGenTimer >= targetInterval) {
      this.trafficGenTimer = 0;

      // 1. WAN Gateway -> Web Server HTTP/HTTPS traffic
      if (gateways.length > 0 && servers.length > 0) {
        const gw = gateways[Math.floor(Math.random() * gateways.length)];
        const proto: PacketProtocol = Math.random() > 0.4 ? 'HTTPS' : 'HTTP';

        if (this.trafficProfile.heavyTraffic) {
          const numReqs = Math.floor(Math.random() * 2) + 2;
          for (let i = 0; i < numReqs; i++) {
            const srv = servers[i % servers.length];
            this.spawnPacket(proto, gw.id, srv.id);
          }
        } else {
          const srv = servers[Math.floor(Math.random() * servers.length)];
          this.spawnPacket(proto, gw.id, srv.id);
        }
      }

      // 2. Web Server -> Database SQL query
      if (servers.length > 0 && databases.length > 0 && Math.random() > 0.3) {
        const srv = servers[Math.floor(Math.random() * servers.length)];
        const db = databases[Math.floor(Math.random() * databases.length)];
        this.spawnPacket('SQL', srv.id, db.id);
      }

      // 3. Client & PC & Laptop -> Gateway DNS query or Server HTTP
      if (clients.length > 0 && (gateways.length > 0 || servers.length > 0) && Math.random() > 0.3) {
        const cli = clients[Math.floor(Math.random() * clients.length)];
        if (Math.random() > 0.5 && gateways.length > 0) {
          this.spawnPacket('DNS', cli.id, gateways[0].id);
        } else if (servers.length > 0) {
          this.spawnPacket('HTTP', cli.id, servers[0].id);
        }
      }

      // 4. IP Phones VoIP Traffic (DNS/SIP/HTTPS)
      if (phones.length > 0 && servers.length > 0 && Math.random() > 0.5) {
        const phone = phones[Math.floor(Math.random() * phones.length)];
        this.spawnPacket('DNS', phone.id, servers[0].id);
      }

      // 5. Smart Cameras Video Stream -> Database / Server
      if (cameras.length > 0 && databases.length > 0 && Math.random() > 0.6) {
        const cam = cameras[Math.floor(Math.random() * cameras.length)];
        this.spawnPacket('SQL', cam.id, databases[0].id);
      }

      // 6. Autonomous Warehouse Robots -> Server Telemetry
      if (robots.length > 0 && servers.length > 0 && Math.random() > 0.4) {
        const bot = robots[Math.floor(Math.random() * robots.length)];
        this.spawnPacket('HTTPS', bot.id, servers[0].id);
      }

      // 7. Occasional SSH Admin connection
      if (clients.length > 0 && servers.length > 0 && Math.random() > 0.8) {
        const cli = clients[0];
        const srv = servers[Math.floor(Math.random() * servers.length)];
        this.spawnPacket('SSH', cli.id, srv.id);
      }
    }
  }

  /**
   * Deterministic Simulation Tick
   */
  public tick(dt: number) {
    this.tickCount++;

    // Generate simulated traffic
    this.generateBackgroundTraffic(dt);

    // Track buffer queue counts
    const currentQueueCounts: Record<string, number> = {};
    for (const [nodeId] of this.nodes) {
      currentQueueCounts[nodeId] = 0;
    }

    // Advance active packets
    const packets = Array.from(this.activePackets.values());

    for (const packet of packets) {
      const cable = this.cables.get(packet.currentCableId);
      if (!cable) {
        this.dropPacket(packet, packet.currentNodeId, 'no_route');
        continue;
      }

      // Advance progress on cable
      packet.progressOnCable += packet.speed * dt;

      if (packet.progressOnCable >= 1.0) {
        // Reached end of current cable
        const arrivedNodeId =
          packet.cableDirection === 'forward' ? cable.toNodeId : cable.fromNodeId;

        packet.currentNodeId = arrivedNodeId;
        packet.hopCount++;
        packet.ttl--;

        if (packet.ttl <= 0) {
          this.dropPacket(packet, arrivedNodeId, 'ttl_expired');
          continue;
        }

        if (arrivedNodeId === packet.dstNodeId) {
          // Reached destination!
          this.deliverPacket(packet);
          continue;
        }

        // Check node buffer overflow
        const arrivedNode = this.nodes.get(arrivedNodeId);

        // 1. Evaluate Firewall ACL rules if present on arrived node
        if (arrivedNode && arrivedNode.aclRules && arrivedNode.aclRules.length > 0) {
          const aclDecision = this.evaluateAcl(arrivedNode, packet);
          if (aclDecision === 'DROP') {
            arrivedNode.droppedPackets = (arrivedNode.droppedPackets || 0) + 1;
            this.dropPacket(packet, arrivedNodeId, 'firewall_drop');
            continue;
          }
        }

        const currentDepth = currentQueueCounts[arrivedNodeId] || 0;
        if (currentDepth >= this.MAX_QUEUE_DEPTH) {
          // Drop due to buffer overrun!
          if (arrivedNode) {
            arrivedNode.droppedPackets = (arrivedNode.droppedPackets || 0) + 1;
            arrivedNode.status = 'warning';
          }
          this.dropPacket(packet, arrivedNodeId, 'buffer_overflow');
          continue;
        }

        currentQueueCounts[arrivedNodeId] = currentDepth + 1;
        if (arrivedNode) {
          arrivedNode.queueLength = currentDepth + 1;
          arrivedNode.ingressMbps = Number(((currentDepth + 1) * 0.8 + Math.random() * 2).toFixed(1));
          arrivedNode.egressMbps = Number((arrivedNode.ingressMbps * 0.9).toFixed(1));
        }

        // Route to next hop
        const remainingRoute = this.findRoute(arrivedNodeId, packet.dstNodeId);
        if (!remainingRoute || remainingRoute.length < 2) {
          this.dropPacket(packet, arrivedNodeId, 'no_route');
          continue;
        }

        const nextHopId = remainingRoute[1];
        const nextEdge = this.adjacency
          .get(arrivedNodeId)
          ?.find((e) => e.neighborId === nextHopId);

        if (!nextEdge) {
          this.dropPacket(packet, arrivedNodeId, 'no_route');
          continue;
        }

        const nextCable = this.cables.get(nextEdge.cableId);
        if (!nextCable) {
          this.dropPacket(packet, arrivedNodeId, 'no_route');
          continue;
        }

        // Transfer onto next cable
        packet.currentCableId = nextCable.id;
        packet.cableDirection =
          nextCable.fromNodeId === arrivedNodeId ? 'forward' : 'reverse';
        packet.progressOnCable = 0.0;
      }
    }
  }

  public getActivePackets(): NetworkPacket[] {
    return Array.from(this.activePackets.values());
  }

  public consumeDropEvents(): PacketDropEvent[] {
    const events = [...this.recentDropEvents];
    this.recentDropEvents = [];
    return events;
  }

  public getStats(): SimulationStats {
    let activeThroughput = 0;
    for (const pkt of this.activePackets.values()) {
      activeThroughput += (pkt.sizeBytes * 8) / 1000000;
    }

    const bufferMap: Record<string, number> = {};
    for (const [nodeId] of this.nodes) {
      bufferMap[nodeId] = this.nodeQueues.get(nodeId)?.length || 0;
    }

    return {
      tickCount: this.tickCount,
      packetsInFlight: this.activePackets.size,
      totalDelivered: this.totalDelivered,
      totalDropped: this.totalDropped,
      droppedByReason: { ...this.droppedByReason },
      deliveredByProtocol: { ...this.deliveredByProtocol },
      currentThroughputMbps: Number(activeThroughput.toFixed(2)),
      bufferOccupancyMap: bufferMap,
      cash: Math.floor(this.cash),
      totalRevenue: Math.floor(this.totalRevenue),
      revenuePerSec: Math.round(this.revenuePerSec),
      productivityScore: Math.round(this.productivityScore),
      connectedEndpointsCount: this.connectedEndpointsCount,
      totalEndpointsCount: this.totalEndpointsCount,
    };
  }
}

export const globalSimulationEngine = new SimulationEngine();
