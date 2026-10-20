/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { SimulationStats, globalSimulationEngine } from '../engine/SimulationEngine';

interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2;
  stats: SimulationStats;

  // Actions
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: 1 | 2) => void;
  step: () => void;
  triggerDdosSpike: () => void;
  updateStats: (stats: SimulationStats) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isPlaying: true,
  speed: 1,
  stats: globalSimulationEngine.getStats(),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed) => set({ speed }),

  step: () => {
    globalSimulationEngine.tick(0.05);
    set({ stats: globalSimulationEngine.getStats() });
  },

  triggerDdosSpike: () => {
    globalSimulationEngine.triggerDdosSpike(5.0);
  },

  updateStats: (stats) => set({ stats }),
}));
