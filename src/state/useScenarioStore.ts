/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { ScenarioId, ScenarioDefinition, HARDWARE_COSTS } from '../engine/scenarioTypes';
import { SCENARIOS } from '../engine/scenarioDefs';
import { useTopologyStore } from './useTopologyStore';
import { useSimulationStore } from './useSimulationStore';
import { globalSimulationEngine } from '../engine/SimulationEngine';

interface ScenarioState {
  activeScenarioId: ScenarioId;
  scenario: ScenarioDefinition;
  status: 'playing' | 'won' | 'failed';
  isSelectorOpen: boolean;
  isChaosDrawerOpen: boolean;
  chaosMessage: string | null;

  // SLA and Progress metrics
  slaPercent: number;
  timeAboveSlaThreshold: number; // in seconds (reaches durationSecondsToWin to win)
  spentBudget: number;

  // Actions
  openSelector: () => void;
  closeSelector: () => void;
  toggleChaosDrawer: () => void;
  selectScenario: (id: ScenarioId) => void;
  restartScenario: () => void;
  updateTickProgress: (delta: number) => void;

  // Chaos Monkey triggers
  chaosCutRandomCable: () => void;
  chaosInjectDdosWave: () => void;
  chaosCrashRandomNode: () => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => {
  const initialScenario = SCENARIOS.sandbox;

  return {
    activeScenarioId: 'sandbox',
    scenario: initialScenario,
    status: 'playing',
    isSelectorOpen: false,
    isChaosDrawerOpen: false,
    chaosMessage: null,

    slaPercent: 100.0,
    timeAboveSlaThreshold: 0,
    spentBudget: 0,

    openSelector: () => set({ isSelectorOpen: true }),
    closeSelector: () => set({ isSelectorOpen: false }),
    toggleChaosDrawer: () => set((s) => ({ isChaosDrawerOpen: !s.isChaosDrawerOpen })),

    selectScenario: (id: ScenarioId) => {
      const scenario = SCENARIOS[id];
      const starterNodes = scenario.starterNodes();
      const starterCables = scenario.starterCables(starterNodes);

      // Load into topology store
      useTopologyStore.setState({
        nodes: starterNodes,
        cables: starterCables,
        selectedNodeId: starterNodes[0]?.id || null,
        selectedCableId: null,
        wiringSourceNodeId: null,
        activeTool: 'select',
      });

      // Update simulation engine
      globalSimulationEngine.resetStats();
      globalSimulationEngine.setTrafficProfile(scenario.trafficProfile);
      globalSimulationEngine.updateTopology(starterNodes, starterCables);
      useSimulationStore.getState().updateStats(globalSimulationEngine.getStats());

      // Reset scenario stats
      set({
        activeScenarioId: id,
        scenario,
        status: 'playing',
        isSelectorOpen: false,
        timeAboveSlaThreshold: 0,
        slaPercent: 100.0,
        chaosMessage: null,
      });

      // Start simulation
      useSimulationStore.getState().play();
    },

    restartScenario: () => {
      get().selectScenario(get().activeScenarioId);
    },

    updateTickProgress: (delta: number) => {
      const { scenario, activeScenarioId, status, timeAboveSlaThreshold } = get();
      if (status === 'won') return;

      const simStats = globalSimulationEngine.getStats();
      const totalPackets = simStats.totalDelivered + simStats.totalDropped;
      const sla =
        totalPackets === 0
          ? 100.0
          : Number(((simStats.totalDelivered / totalPackets) * 100).toFixed(1));

      // Calculate spent budget
      const nodes = useTopologyStore.getState().nodes;
      const cables = useTopologyStore.getState().cables;
      const spent =
        nodes.reduce((acc, n) => acc + (HARDWARE_COSTS[n.type] || 300), 0) +
        cables.length * HARDWARE_COSTS.cable;

      // In puzzle campaign mode, evaluate win condition
      let newTimeAbove = timeAboveSlaThreshold;
      let newStatus: 'playing' | 'won' | 'failed' = status;

      if (activeScenarioId !== 'sandbox' && scenario.durationSecondsToWin > 0) {
        if (sla >= 99.0 && simStats.totalDelivered >= 10 && spent <= scenario.budget) {
          newTimeAbove += delta;
          if (newTimeAbove >= scenario.durationSecondsToWin) {
            newStatus = 'won';
          }
        } else if (sla < 99.0) {
          newTimeAbove = Math.max(0, newTimeAbove - delta * 1.5);
        }
      }

      set({
        slaPercent: sla,
        timeAboveSlaThreshold: newTimeAbove,
        spentBudget: spent,
        status: newStatus,
      });
    },

    // 🐒 Chaos Monkey: Cut a Random Cable
    chaosCutRandomCable: () => {
      const cables = useTopologyStore.getState().cables;
      if (cables.length === 0) {
        set({ chaosMessage: '🐒 Chaos Monkey: No active cables to sever!' });
        return;
      }
      const randomCable = cables[Math.floor(Math.random() * cables.length)];
      useTopologyStore.getState().deleteCable(randomCable.id);
      globalSimulationEngine.updateTopology(
        useTopologyStore.getState().nodes,
        useTopologyStore.getState().cables
      );
      set({
        chaosMessage: `🐒 Chaos Monkey: Physical cable ${randomCable.cableType.toUpperCase()} severed!`,
      });
      setTimeout(() => set({ chaosMessage: null }), 4500);
    },

    // 🐒 Chaos Monkey: Inject Volumetric DDoS Wave
    chaosInjectDdosWave: () => {
      globalSimulationEngine.triggerDdosSpike(8.0);
      set({
        chaosMessage: '🐒 Chaos Monkey: Injected 8-second 100Gbps SYN-Flood botnet wave!',
      });
      setTimeout(() => set({ chaosMessage: null }), 4500);
    },

    // 🐒 Chaos Monkey: Crash a Random Server Node
    chaosCrashRandomNode: () => {
      const nodes = useTopologyStore.getState().nodes;
      const targets = nodes.filter((n) => n.type === 'server' || n.type === 'database');
      if (targets.length === 0) {
        set({ chaosMessage: '🐒 Chaos Monkey: No server nodes found to crash!' });
        return;
      }
      const target = targets[Math.floor(Math.random() * targets.length)];
      useTopologyStore.setState({
        nodes: nodes.map((n) =>
          n.id === target.id ? { ...n, status: 'offline', cpuUsage: 0 } : n
        ),
      });

      set({
        chaosMessage: `🐒 Chaos Monkey: Kernel Panic! Crashed ${target.name} for 8 seconds!`,
      });

      // Recover after 8s
      setTimeout(() => {
        useTopologyStore.setState({
          nodes: useTopologyStore
            .getState()
            .nodes.map((n) => (n.id === target.id ? { ...n, status: 'online' } : n)),
        });
        set({ chaosMessage: null });
      }, 8000);
    },
  };
});
