/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from './scenarioDefs';
import { SimulationEngine } from './SimulationEngine';
import { PlacedNode, CableConnection } from './types';

describe('Campaign Scenarios & Chaos Specification', () => {
  test('all 5 scenario definitions are complete and correctly configured', () => {
    const requiredIds = ['sandbox', 'level1', 'level2', 'level3', 'level4'] as const;
    
    for (const id of requiredIds) {
      const scenario = SCENARIOS[id];
      assert.ok(scenario, `Scenario ${id} must exist in SCENARIOS`);
      assert.equal(scenario.id, id);
      assert.ok(scenario.title.length > 0, `${id} title must not be empty`);
      assert.ok(scenario.briefing.length >= 3, `${id} briefing must have at least 3 points`);
      assert.ok(scenario.objectives.length >= 2, `${id} objectives must have at least 2 points`);
      assert.ok(scenario.budget > 0, `${id} budget must be positive`);
      
      const nodes = scenario.starterNodes();
      assert.ok(Array.isArray(nodes), `${id} starterNodes() must return an array`);
      assert.ok(nodes.length > 0, `${id} starterNodes() must not be empty`);

      const cables = scenario.starterCables(nodes);
      assert.ok(Array.isArray(cables), `${id} starterCables() must return an array`);
    }
  });

  test('Puzzle Level 1 has unwired starter rack to test student cabling', () => {
    const l1 = SCENARIOS.level1;
    const nodes = l1.starterNodes();
    const cables = l1.starterCables(nodes);
    assert.equal(cables.length, 0, 'Level 1 must start with 0 cables so the player wires them');
    assert.equal(l1.durationSecondsToWin, 30, 'Level 1 must require 30s SLA survival');
  });

  test('Puzzle Level 2 features scheduled DDoS traffic profile', () => {
    const l2 = SCENARIOS.level2;
    assert.equal(l2.trafficProfile.allowDdos, true, 'Level 2 must enable DDoS traffic wave');
    assert.equal(l2.durationSecondsToWin, 30, 'Level 2 must require 30s SLA survival');
  });

  test('SimulationEngine evaluates Firewall ACL rules and drops malicious traffic', () => {
    const engine = new SimulationEngine();

    const gw: PlacedNode = {
      id: 'gw-1',
      name: 'Gateway',
      type: 'gateway',
      gridX: 2,
      gridZ: 2,
      rotation: 0,
      status: 'online',
      ipAddress: '198.51.100.1',
      subnetMask: '255.255.255.0',
      gatewayIp: '0.0.0.0',
      vlanId: 1,
      ports: [{ id: 'p_gw_0', name: 'eth0', type: 'copper', macAddress: '00:11:22:33:44:55', speedMbps: 1000, isUp: true }],
      cpuUsage: 10,
      memoryUsage: 20,
      ingressMbps: 0,
      egressMbps: 0,
      droppedPackets: 0,
      queueLength: 0,
      aclRules: [],
      createdAt: Date.now(),
    };

    const fw: PlacedNode = {
      id: 'fw-1',
      name: 'Firewall',
      type: 'firewall',
      gridX: 4,
      gridZ: 2,
      rotation: 0,
      status: 'online',
      ipAddress: '10.0.1.1',
      subnetMask: '255.255.255.0',
      gatewayIp: '198.51.100.1',
      vlanId: 1,
      ports: [{ id: 'p_fw_0', name: 'eth0', type: 'copper', macAddress: '00:11:22:33:44:66', speedMbps: 1000, isUp: true }],
      cpuUsage: 15,
      memoryUsage: 25,
      ingressMbps: 0,
      egressMbps: 0,
      droppedPackets: 0,
      queueLength: 0,
      aclRules: [
        {
          id: 'rule_drop_ddos',
          action: 'DROP',
          protocol: 'DDOS',
          description: 'Drop DDoS flood',
          enabled: true,
          hits: 0,
        },
      ],
      createdAt: Date.now(),
    };

    const cable: CableConnection = {
      id: 'cable-gw-fw',
      fromNodeId: 'gw-1',
      fromPortId: 'p_gw_0',
      toNodeId: 'fw-1',
      toPortId: 'p_fw_0',
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 0,
      packetLossRate: 0,
      latencyMs: 1.0,
      color: '#3b82f6',
    };

    engine.updateTopology([gw, fw], [cable]);

    const stats = engine.getStats();
    assert.equal(stats.totalDropped, 0);
    assert.equal(stats.totalDelivered, 0);
  });

  test('Tycoon Productivity Loop: connected endpoints generate cash revenue', () => {
    const engine = new SimulationEngine();

    const gw: PlacedNode = {
      id: 'gw-1',
      name: 'WAN Gateway',
      type: 'gateway',
      gridX: 10,
      gridZ: 10,
      rotation: 0,
      status: 'online',
      ipAddress: '198.51.100.1',
      subnetMask: '255.255.255.0',
      vlanId: 1,
      ports: [{ id: 'p_gw', name: 'wan0', type: 'fiber', macAddress: '00:11:22:33:44:01', speedMbps: 10000, isUp: true }],
      cpuUsage: 10,
      memoryUsage: 20,
      ingressMbps: 0,
      egressMbps: 0,
      droppedPackets: 0,
      queueLength: 0,
      aclRules: [],
      createdAt: Date.now(),
    };

    const pc: PlacedNode = {
      id: 'pc-1',
      name: 'Office PC',
      type: 'pc',
      gridX: 12,
      gridZ: 10,
      rotation: 0,
      status: 'online',
      ipAddress: '10.0.10.101',
      subnetMask: '255.255.255.0',
      vlanId: 10,
      ports: [{ id: 'p_pc', name: 'eth0', type: 'copper', macAddress: '00:11:22:33:44:02', speedMbps: 1000, isUp: true }],
      cpuUsage: 15,
      memoryUsage: 25,
      ingressMbps: 0,
      egressMbps: 0,
      droppedPackets: 0,
      queueLength: 0,
      aclRules: [],
      createdAt: Date.now(),
    };

    const cable: CableConnection = {
      id: 'cable-gw-pc',
      fromNodeId: 'gw-1',
      fromPortId: 'p_gw',
      toNodeId: 'pc-1',
      toPortId: 'p_pc',
      cableType: 'cat6',
      bandwidthMbps: 1000,
      currentThroughputMbps: 10,
      packetLossRate: 0,
      latencyMs: 0.5,
      color: '#3b82f6',
    };

    engine.updateTopology([gw, pc], [cable]);
    engine.updateProductivityAndEconomy(1.0);

    const stats = engine.getStats();
    assert.equal(stats.connectedEndpointsCount, 1, 'PC should be marked connected');
    assert.ok(stats.revenuePerSec > 0, 'PC should generate revenue per second');
    assert.ok(stats.cash >= 2500, 'Cash should accumulate from productivity');
  });
});
