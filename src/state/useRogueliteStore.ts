/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { RogueliteCard } from '../engine/types';
import { SoundFX } from '../audio/SoundFX';

export const ALL_ROGUELITE_CARDS: RogueliteCard[] = [
  {
    id: 'overclocked_cat6',
    title: 'Overclocked Cat6',
    description: 'All cabling provides +50% bandwidth capacity and turrets gain +25% targeting range.',
    rarity: 'common',
    icon: '🔌',
    category: 'bandwidth',
  },
  {
    id: 'bgp_anycast',
    title: 'BGP Anycast Routing',
    description: 'When Core Gateway is damaged, 40% of incoming damage reflects back as an electrical shockwave.',
    rarity: 'rare',
    icon: '⚡',
    category: 'defense',
  },
  {
    id: 'zero_day_payload',
    title: 'Zero-Day Payload',
    description: 'IPS Railguns apply corrosive Malware Burn, dealing 40 DPS over 4s and melting armor.',
    rarity: 'rare',
    icon: '☣️',
    category: 'combat',
  },
  {
    id: 'poe_overdrive',
    title: 'PoE Overdrive',
    description: 'PoE Switches periodically emit a chain-lightning arc that zaps nearby crossing packets.',
    rarity: 'rare',
    icon: '⚡',
    category: 'combat',
  },
  {
    id: 'automated_bot_fleet',
    title: 'Automated Bot Fleet',
    description: 'Instantly deploys +2 AGV Harvester Bots with +50% movement speed and 2x vacuum radius.',
    rarity: 'rare',
    icon: '🤖',
    category: 'economy',
  },
  {
    id: 'hardware_acceleration',
    title: 'Hardware Acceleration',
    description: 'All current and future defense turrets gain +25% base damage and golden chassis trims.',
    rarity: 'common',
    icon: '🛡️',
    category: 'combat',
  },
  {
    id: 'quantum_encryption',
    title: 'Quantum Encryption',
    description: 'Core Gateway gains a regenerable +60 HP energy overshield.',
    rarity: 'legendary',
    icon: '💎',
    category: 'defense',
  },
  {
    id: 'packet_sniffer',
    title: 'Packet Sniffer Protocol',
    description: 'TCP Stream kills refund an additional +$4 cash bounty directly into your balance.',
    rarity: 'common',
    icon: '💰',
    category: 'economy',
  },
  {
    id: 'superconductor_fiber',
    title: 'Superconductor Fiber',
    description: 'Eliminates all cable latency penalties and grants +30% attack speed to all cabled turrets.',
    rarity: 'rare',
    icon: '✨',
    category: 'bandwidth',
  },
  {
    id: 'honeypot_amplifiers',
    title: 'Honeypot Decoy Broadcast',
    description: 'Data Mining Servers taunt and pull 45% of incoming malware away from the Core Gateway.',
    rarity: 'rare',
    icon: '🍯',
    category: 'defense',
  },
  {
    id: 'bandwidth_overclock',
    title: 'Carrier-Grade Fiber Trunk',
    description: 'Adds +3,500 Mbps master bandwidth capacity to the Core Gateway.',
    rarity: 'common',
    icon: '🌐',
    category: 'bandwidth',
  },
  {
    id: 'nanite_auto_patch',
    title: 'Nanite Self-Healing Firmware',
    description: 'All nodes and cables automatically regenerate 4% HP every second when out of combat.',
    rarity: 'legendary',
    icon: '🧪',
    category: 'defense',
  },
];

export interface PersistentBuffs {
  bandwidthMultiplier: number;
  turretRangeMultiplier: number;
  turretDamageMultiplier: number;
  turretAttackSpeedMultiplier: number;
  bgpReflectShockwave: boolean;
  zeroDayBurn: boolean;
  poeChainLightning: boolean;
  botSpeedMultiplier: number;
  bonusBotCount: number;
  bonusCoreShield: number;
  tcpBonusCash: number;
  honeypotTaunt: boolean;
  naniteHeal: boolean;
  masterBandwidthBonus: number;
}

interface RogueliteState {
  isDraftOpen: boolean;
  draftChoices: RogueliteCard[];
  activeCards: RogueliteCard[];
  buffs: PersistentBuffs;
  rerollsAvailable: number;

  openDraft: () => void;
  selectCard: (card: RogueliteCard) => void;
  rerollDraft: () => void;
  resetAllCards: () => void;
}

const DEFAULT_BUFFS: PersistentBuffs = {
  bandwidthMultiplier: 1.0,
  turretRangeMultiplier: 1.0,
  turretDamageMultiplier: 1.0,
  turretAttackSpeedMultiplier: 1.0,
  bgpReflectShockwave: false,
  zeroDayBurn: false,
  poeChainLightning: false,
  botSpeedMultiplier: 1.0,
  bonusBotCount: 0,
  bonusCoreShield: 0,
  tcpBonusCash: 0,
  honeypotTaunt: false,
  naniteHeal: false,
  masterBandwidthBonus: 0,
};

function pickThreeRandomCards(excludeIds: Set<string>): RogueliteCard[] {
  const available = ALL_ROGUELITE_CARDS.filter((c) => !excludeIds.has(c.id));
  const pool = available.length >= 3 ? available : ALL_ROGUELITE_CARDS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export const useRogueliteStore = create<RogueliteState>((set, get) => ({
  isDraftOpen: false,
  draftChoices: [],
  activeCards: [],
  buffs: { ...DEFAULT_BUFFS },
  rerollsAvailable: 2,

  openDraft: () => {
    SoundFX.playCardDraftFanfare();
    const activeIds = new Set(get().activeCards.map((c) => c.id));
    const choices = pickThreeRandomCards(activeIds);
    set({ isDraftOpen: true, draftChoices: choices });
  },

  selectCard: (card: RogueliteCard) => {
    SoundFX.playCoinPing(true);
    set((state) => {
      const newActive = [...state.activeCards, card];
      const newBuffs = { ...state.buffs };

      // Apply modifiers
      if (card.id === 'overclocked_cat6') {
        newBuffs.bandwidthMultiplier += 0.5;
        newBuffs.turretRangeMultiplier += 0.25;
      } else if (card.id === 'bgp_anycast') {
        newBuffs.bgpReflectShockwave = true;
      } else if (card.id === 'zero_day_payload') {
        newBuffs.zeroDayBurn = true;
      } else if (card.id === 'poe_overdrive') {
        newBuffs.poeChainLightning = true;
      } else if (card.id === 'automated_bot_fleet') {
        newBuffs.bonusBotCount += 2;
        newBuffs.botSpeedMultiplier += 0.5;
      } else if (card.id === 'hardware_acceleration') {
        newBuffs.turretDamageMultiplier += 0.25;
      } else if (card.id === 'quantum_encryption') {
        newBuffs.bonusCoreShield += 60;
      } else if (card.id === 'packet_sniffer') {
        newBuffs.tcpBonusCash += 4;
      } else if (card.id === 'superconductor_fiber') {
        newBuffs.turretAttackSpeedMultiplier += 0.3;
      } else if (card.id === 'honeypot_amplifiers') {
        newBuffs.honeypotTaunt = true;
      } else if (card.id === 'bandwidth_overclock') {
        newBuffs.masterBandwidthBonus += 3500;
      } else if (card.id === 'nanite_auto_patch') {
        newBuffs.naniteHeal = true;
      }

      return {
        isDraftOpen: false,
        activeCards: newActive,
        buffs: newBuffs,
      };
    });
  },

  rerollDraft: () => {
    const { rerollsAvailable } = get();
    if (rerollsAvailable <= 0) return;
    SoundFX.playClick(950);
    const activeIds = new Set(get().activeCards.map((c) => c.id));
    const choices = pickThreeRandomCards(activeIds);
    set({
      draftChoices: choices,
      rerollsAvailable: rerollsAvailable - 1,
    });
  },

  resetAllCards: () => {
    set({
      isDraftOpen: false,
      draftChoices: [],
      activeCards: [],
      buffs: { ...DEFAULT_BUFFS },
      rerollsAvailable: 2,
    });
  },
}));
