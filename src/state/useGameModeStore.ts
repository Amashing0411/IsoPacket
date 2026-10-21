/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { SoundFX } from '../audio/SoundFX';

export type GameMode = 'title' | 'defense' | 'academy' | 'sandbox';

interface GameModeState {
  currentMode: GameMode;
  isCinematicActive: boolean;
  setMode: (mode: GameMode) => void;
  enterDefenseMode: () => void;
  enterAcademyMode: () => void;
  enterSandboxMode: () => void;
  returnToTitle: () => void;
}

export const useGameModeStore = create<GameModeState>((set) => ({
  currentMode: 'title',
  isCinematicActive: true,

  setMode: (mode: GameMode) => {
    SoundFX.playClick(900);
    if (mode === 'defense') {
      SoundFX.startBGM();
      SoundFX.setCombatIntensity(0.4);
    } else if (mode === 'title') {
      SoundFX.setCombatIntensity(0.1);
    } else {
      SoundFX.setCombatIntensity(0.0);
    }
    set({ currentMode: mode, isCinematicActive: mode === 'title' });
  },

  enterDefenseMode: () => {
    SoundFX.playClick(1050);
    SoundFX.startBGM();
    SoundFX.setCombatIntensity(0.5);
    set({ currentMode: 'defense', isCinematicActive: false });
  },

  enterAcademyMode: () => {
    SoundFX.playClick(950);
    SoundFX.startBGM();
    SoundFX.setCombatIntensity(0.1);
    set({ currentMode: 'academy', isCinematicActive: false });
  },

  enterSandboxMode: () => {
    SoundFX.playClick(850);
    SoundFX.startBGM();
    SoundFX.setCombatIntensity(0.0);
    set({ currentMode: 'sandbox', isCinematicActive: false });
  },

  returnToTitle: () => {
    SoundFX.playClick(750);
    SoundFX.setCombatIntensity(0.1);
    set({ currentMode: 'title', isCinematicActive: true });
  },
}));
