/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HardwareNodeType, PlacedNode, CableConnection, AclRule } from './types';

export type ScenarioId = 'sandbox' | 'level1' | 'level2' | 'level3' | 'level4';

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Sandbox';
  description: string;
  briefing: string[];
  objectives: string[];
  budget: number; // Max budget in dollars ($)
  durationSecondsToWin: number; // Seconds SLA must stay >= 99%
  starterNodes: () => PlacedNode[];
  starterCables: (nodes: PlacedNode[]) => CableConnection[];
  trafficProfile: {
    spawnInterval: number;
    allowDdos: boolean;
    heavyTraffic?: boolean;
  };
}

export const HARDWARE_COSTS: Record<HardwareNodeType | 'cable', number> = {
  gateway: 450,
  router: 600,
  switch: 350,
  ap: 280,
  firewall: 500,
  server: 500,
  database: 650,
  pc: 150,
  laptop: 180,
  ipphone: 120,
  printer: 200,
  camera: 160,
  robot: 320,
  client: 120,
  cable: 25,
  flak: 420,
  railgun: 650,
  cache: 380,
  harvester: 320,
};
