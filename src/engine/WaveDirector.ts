/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaliciousPacketType } from './DefenseEngine';

export interface WaveInfo {
  waveNumber: number;
  eraName: string;
  eraDescription: string;
  totalPackets: number;
  spawnInterval: number;
  ddosRatio: number;
  ransomwareRatio: number;
  malwareRatio: number;
  hasBoss: boolean;
  bossType?: 'ZERO_DAY_WORM' | 'BOTNET_COLOSSUS';
  bonusReward: number;
  dualRifts: boolean;
  empSurgeHazard: boolean;
}

export class WaveDirector {
  public static getEra(wave: number): { name: string; description: string; eraIndex: number } {
    if (wave <= 20) {
      return {
        name: 'The Local LAN Era',
        description: 'Low-tier SYN flood swarms & script-kiddie worms. Secure baseline cabling and PoE switches.',
        eraIndex: 1,
      };
    } else if (wave <= 40) {
      return {
        name: 'The Botnet Surge',
        description: 'Armored Ransomware tanks disable unshielded cables on contact. Decryption Flak arrays advised.',
        eraIndex: 2,
      };
    } else if (wave <= 60) {
      return {
        name: 'Cable Sabotage Era',
        description: 'Atmospheric EMP storms sever individual cable runs. Build redundant ring topologies & Proxy Caches.',
        eraIndex: 3,
      };
    } else if (wave <= 80) {
      return {
        name: 'Malware Inversion Era',
        description: 'Inversion payloads corrupt unmonitored turrets. Deploy Honeypot Decoys and Stateful Scrubbers.',
        eraIndex: 4,
      };
    } else {
      return {
        name: 'Nation-State Cyberwarfare',
        description: 'Dual perimeter spawn rifts, colossal Zero-Day Centipedes, and saturated DDoS dreadnoughts.',
        eraIndex: 5,
      };
    }
  }

  public static getWaveConfig(wave: number): WaveInfo {
    const era = this.getEra(wave);
    const isBossWave = wave % 5 === 0;
    const isMajorBoss = wave % 10 === 0;

    let bossType: 'ZERO_DAY_WORM' | 'BOTNET_COLOSSUS' | undefined;
    if (isMajorBoss) {
      bossType = 'BOTNET_COLOSSUS';
    } else if (isBossWave) {
      bossType = 'ZERO_DAY_WORM';
    }

    // Packet Count scaling: Starts at 12, scaling smoothly to 120 at wave 100
    const totalPackets = Math.floor(12 + wave * 1.8 + Math.pow(wave / 20, 1.6));

    // Cadence: Starts at 1.3s between spawns, drops to 0.28s in late waves
    const spawnInterval = Math.max(0.28, 1.3 - (wave * 0.012));

    // Threat Ratios
    let ddosRatio = Math.max(0.35, 0.75 - wave * 0.005);
    let ransomwareRatio = Math.min(0.35, 0.15 + wave * 0.003);
    let malwareRatio = Math.min(0.30, 0.10 + wave * 0.002);

    const bonusReward = 150 + wave * 35 + (isBossWave ? 250 : 0);
    const dualRifts = wave > 80;
    const empSurgeHazard = wave >= 41 && wave <= 60 && wave % 3 === 0;

    return {
      waveNumber: wave,
      eraName: era.name,
      eraDescription: era.description,
      totalPackets,
      spawnInterval,
      ddosRatio,
      ransomwareRatio,
      malwareRatio,
      hasBoss: isBossWave,
      bossType,
      bonusReward,
      dualRifts,
      empSurgeHazard,
    };
  }
}
