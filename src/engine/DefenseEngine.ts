/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundFX } from '../audio/SoundFX';
import { WaveDirector, WaveInfo } from './WaveDirector';
import { ProtocolStream, TierLevel, Tier3Branch } from './types';
import { useRogueliteStore } from '../state/useRogueliteStore';

export type MaliciousPacketType =
  | 'DDOS'
  | 'RANSOMWARE'
  | 'MALWARE'
  | 'ZERO_DAY_WORM'
  | 'BOTNET_COLOSSUS';

export interface MaliciousPacket {
  id: string;
  type: MaliciousPacketType;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  damage: number;
  reward: number;
  color: string;
  size: number;
  isCloaked?: boolean;
  burnTimer?: number;
  frozenTimer?: number;
  isSubWorm?: boolean;
}

export interface LaserBeam {
  id: string;
  fromX: number;
  fromY: number;
  fromZ: number;
  toX: number;
  toY: number;
  toZ: number;
  color: string;
  intensity: number;
  duration: number;
  elapsed: number;
  isSniper: boolean;
  protocol?: ProtocolStream;
}

export interface DroppedDataOrb {
  id: string;
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  value: number;
  createdAt: number;
  lifespan: number;
}

export interface AutonomousBot {
  id: string;
  name: string;
  gridX: number;
  gridZ: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotation: number;
  speed: number;
  status: 'idle' | 'moving' | 'harvesting' | 'returning' | 'stalled' | 'combat';
  carryingValue: number;
  maxCapacity: number;
  isConnected: boolean;
  warningText?: string;
  stallTimer: number;
  isCombatDrone?: boolean;
  isMagnet?: boolean;
}

export interface DefenseStats {
  coreHp: number;
  maxCoreHp: number;
  coreShield: number;
  maxCoreShield: number;
  wave: number;
  waveState: 'idle' | 'countdown' | 'in_progress' | 'victory' | 'game_over';
  waveCountdown: number;
  waveEnemiesRemaining: number;
  totalKills: number;
  empCooldown: number;
  maxEmpCooldown: number;
  isEmpReady: boolean;
  activeBotsCount: number;
  orbsOnGroundCount: number;
  eraName: string;
  eraDescription: string;
  activeProtocol: ProtocolStream;
  totalBandwidthProduced: number;
  totalBandwidthConsumed: number;
  poweredTurretsCount: number;
  starvedTurretsCount: number;
}

export class DefenseEngine {
  // Wi-Fi 7 Core Gateway (Map center: grid 16, 16)
  public coreGridX = 16;
  public coreGridZ = 16;
  public coreHp = 100;
  public maxCoreHp = 100;
  public coreShield = 40;
  public maxCoreShield = 40;

  // Active Global Protocol Ammo Stream
  public activeProtocol: ProtocolStream = 'TCP';

  // EMP Overcharge
  public empCooldown = 0;
  public readonly MAX_EMP_COOLDOWN = 20;

  // 100-Wave Progression
  public currentWave = 1;
  public waveState: 'idle' | 'countdown' | 'in_progress' | 'victory' | 'game_over' = 'idle';
  public waveCountdown = 4;
  private spawnTimer = 0;
  private spawnedThisWave = 0;
  private totalToSpawnThisWave = 0;
  public activeWaveInfo: WaveInfo | null = null;
  public totalKills = 0;

  // Power & Bandwidth Accounting
  public totalBandwidthProduced = 5000;
  public totalBandwidthConsumed = 0;
  public poweredTurretsCount = 0;
  public starvedTurretsCount = 0;

  // Entities
  public enemies: MaliciousPacket[] = [];
  public laserBeams: LaserBeam[] = [];
  public droppedOrbs: DroppedDataOrb[] = [];
  public bots: AutonomousBot[] = [];

  // Cooldowns
  private turretCooldowns: Map<string, number> = new Map();
  private teslaArcTimer = 0;

  // Callbacks
  public onRewardCash?: (amount: number, reason: string) => void;
  public onCoreDamaged?: (hp: number, maxHp: number) => void;
  public onWaveCompleted?: (wave: number, reward: number) => void;
  public onWaveFailed?: () => void;
  public onMicroToast?: (message: string, type: 'info' | 'warning' | 'success' | 'danger') => void;

  constructor() {
    this.initDefaultBots();
  }

  public resetAll() {
    this.coreHp = this.maxCoreHp;
    this.coreShield = this.maxCoreShield;
    this.currentWave = 1;
    this.waveState = 'idle';
    this.waveCountdown = 4;
    this.spawnTimer = 0;
    this.spawnedThisWave = 0;
    this.enemies = [];
    this.laserBeams = [];
    this.droppedOrbs = [];
    this.empCooldown = 0;
    this.initDefaultBots();
    SoundFX.setCombatIntensity(0);
  }

  public initDefaultBots() {
    this.bots = [
      {
        id: 'bot_agv_01',
        name: 'AGV Harvester 01',
        gridX: 18,
        gridZ: 15,
        x: 18,
        z: 15,
        targetX: 18,
        targetZ: 15,
        rotation: 0,
        speed: 2.6,
        status: 'idle',
        carryingValue: 0,
        maxCapacity: 150,
        isConnected: true,
        stallTimer: 0,
      },
    ];
  }

  public setProtocolStream(protocol: ProtocolStream) {
    this.activeProtocol = protocol;
    SoundFX.playClick(900);
    if (this.onMicroToast) {
      let desc = '';
      if (protocol === 'UDP') desc = 'UDP Selected: +100% Rapid-Fire Cadence Spray';
      if (protocol === 'TCP') desc = 'TCP Selected: Verified Delivery +$2 Bounty per Kill';
      if (protocol === 'TLS') desc = 'TLS Selected: Piercing Laser Bypasses Armored Shields';
      if (protocol === 'ICMP') desc = 'ICMP Selected: High-Impact Kinetic Knockback Shockwave';
      this.onMicroToast(`⚡ Conduit Stream: ${desc}`, 'info');
    }
  }

  public addBot(gridX: number, gridZ: number, isDrone = false, isMagnet = false) {
    const id = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const buffs = useRogueliteStore.getState().buffs;
    const speed = (isDrone ? 3.4 : 2.6) * buffs.botSpeedMultiplier;
    this.bots.push({
      id,
      name: isDrone ? `Combat Drone 0${this.bots.length + 1}` : `AGV Harvester 0${this.bots.length + 1}`,
      gridX,
      gridZ,
      x: gridX,
      z: gridZ,
      targetX: gridX,
      targetZ: gridZ,
      rotation: 0,
      speed,
      status: 'idle',
      carryingValue: 0,
      maxCapacity: 200,
      isConnected: true,
      stallTimer: 0,
      isCombatDrone: isDrone,
      isMagnet,
    });
  }

  public startNextWave() {
    if (this.waveState === 'in_progress') return;

    this.activeWaveInfo = WaveDirector.getWaveConfig(this.currentWave);
    this.totalToSpawnThisWave = this.activeWaveInfo.totalPackets;
    this.spawnedThisWave = 0;
    this.spawnTimer = 0;
    this.waveState = 'countdown';
    this.waveCountdown = 3.5;

    SoundFX.setCombatIntensity(0.5);
    if (this.activeWaveInfo.hasBoss) {
      SoundFX.playBossSiren();
    }

    if (this.onMicroToast) {
      this.onMicroToast(
        `🚨 ${this.activeWaveInfo.eraName} • Wave ${this.currentWave} Ingress Imminent!`,
        this.activeWaveInfo.hasBoss ? 'danger' : 'warning'
      );
    }
  }

  public triggerEmpBlast() {
    if (this.empCooldown > 0 || this.enemies.length === 0) return;

    this.empCooldown = this.MAX_EMP_COOLDOWN;
    SoundFX.playEMPBlast();

    let wiped = 0;
    this.enemies.forEach((enemy) => {
      enemy.hp -= 120;
      enemy.shield = 0;
      if (enemy.hp <= 0) wiped++;
    });

    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.totalKills += wiped;

    if (this.onMicroToast) {
      this.onMicroToast(`⚡ CORE EMP DISCHARGED: ${wiped} threats incinerated!`, 'warning');
    }
  }

  /**
   * Spawns an incoming enemy along the perimeter or dual rifts
   */
  private spawnEnemy(type: MaliciousPacketType, isDualRift: boolean = false) {
    const id = `threat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let startX = 0;
    let startZ = 0;

    if (isDualRift) {
      // Spawn at corner rifts
      const corner = Math.random() > 0.5 ? 0 : 31;
      startX = corner;
      startZ = Math.random() > 0.5 ? 0 : 31;
    } else {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) {
        startX = Math.random() * 30 + 1;
        startZ = 0.5;
      } else if (side === 1) {
        startX = 30.5;
        startZ = Math.random() * 30 + 1;
      } else if (side === 2) {
        startX = Math.random() * 30 + 1;
        startZ = 30.5;
      } else {
        startX = 0.5;
        startZ = Math.random() * 30 + 1;
      }
    }

    // Base stats scaling with wave index
    const waveFactor = 1 + this.currentWave * 0.045;
    let hp = Math.floor(20 * waveFactor);
    let shield = 0;
    let speed = 2.4;
    let damage = 5;
    let reward = 8;
    let color = '#ef4444';
    let size = 0.35;
    let isCloaked = false;

    if (type === 'RANSOMWARE') {
      hp = Math.floor(80 * waveFactor);
      shield = Math.floor(40 * waveFactor);
      speed = 1.35;
      damage = 20;
      reward = 28;
      color = '#eab308'; // Yellow Armored
      size = 0.5;
    } else if (type === 'MALWARE') {
      hp = Math.floor(45 * waveFactor);
      shield = Math.floor(20 * waveFactor);
      speed = 2.0;
      damage = 12;
      reward = 18;
      color = '#a855f7'; // Purple Spiky
      size = 0.42;
      isCloaked = Math.random() > 0.6;
    } else if (type === 'ZERO_DAY_WORM') {
      hp = Math.floor(450 * waveFactor);
      shield = 100;
      speed = 1.1;
      damage = 40;
      reward = 150;
      color = '#dc2626'; // Deep Red Centipede
      size = 0.85;
    } else if (type === 'BOTNET_COLOSSUS') {
      hp = Math.floor(850 * waveFactor);
      shield = 250;
      speed = 0.85;
      damage = 60;
      reward = 300;
      color = '#b91c1c'; // Armored Colossus
      size = 1.1;
    }

    this.enemies.push({
      id,
      type,
      x: startX,
      z: startZ,
      targetX: this.coreGridX,
      targetZ: this.coreGridZ,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed,
      damage,
      reward,
      color,
      size,
      isCloaked,
    });
  }

  /**
   * Main Simulation Tick: Mindustry Bandwidth & PoE supply verification,
   * turret aiming & firing, enemy pathing, and AGV harvesting.
   */
  public update(
    dt: number,
    nodes: Array<{
      id: string;
      type: string;
      gridX: number;
      gridZ: number;
      status: string;
      tier?: number;
      tier3Branch?: string;
      isPowered?: boolean;
    }>,
    cables: Array<{ fromNodeId: string; toNodeId: string; isPowered?: boolean }>
  ) {
    const rogueliteBuffs = useRogueliteStore.getState().buffs;

    // Apply Roguelite Core Shield bonus
    this.maxCoreShield = 40 + rogueliteBuffs.bonusCoreShield;
    if (this.coreShield > this.maxCoreShield) this.coreShield = this.maxCoreShield;

    // 1. Mindustry-Style PoE & Bandwidth Power Verification
    this.verifyPowerAndBandwidth(nodes, cables, rogueliteBuffs);

    // 2. EMP cooldown timer
    if (this.empCooldown > 0) {
      this.empCooldown = Math.max(0, this.empCooldown - dt);
    }

    // 3. Wave countdown & spawning logic
    if (this.waveState === 'countdown') {
      this.waveCountdown -= dt;
      if (this.waveCountdown <= 0) {
        this.waveState = 'in_progress';
        SoundFX.setCombatIntensity(0.85);
      }
    } else if (this.waveState === 'in_progress' && this.activeWaveInfo) {
      this.spawnTimer += dt;
      if (
        this.spawnTimer >= this.activeWaveInfo.spawnInterval &&
        this.spawnedThisWave < this.totalToSpawnThisWave
      ) {
        this.spawnTimer = 0;
        this.spawnedThisWave++;

        // Determine enemy type
        let type: MaliciousPacketType = 'DDOS';
        if (this.activeWaveInfo.hasBoss && this.spawnedThisWave === this.totalToSpawnThisWave) {
          type = this.activeWaveInfo.bossType || 'ZERO_DAY_WORM';
        } else {
          const roll = Math.random();
          if (roll < this.activeWaveInfo.ransomwareRatio) {
            type = 'RANSOMWARE';
          } else if (roll < this.activeWaveInfo.ransomwareRatio + this.activeWaveInfo.malwareRatio) {
            type = 'MALWARE';
          }
        }

        this.spawnEnemy(type, this.activeWaveInfo.dualRifts);
      }

      // Check wave completion -> trigger Roguelite Draft
      if (this.spawnedThisWave >= this.totalToSpawnThisWave && this.enemies.length === 0) {
        this.waveState = 'victory';
        const bonus = this.activeWaveInfo.bonusReward;
        SoundFX.playVictoryChime();
        SoundFX.setCombatIntensity(0.1);

        if (this.onRewardCash) {
          this.onRewardCash(bonus, `Wave ${this.currentWave} Cleanse Grant`);
        }
        if (this.onWaveCompleted) {
          this.onWaveCompleted(this.currentWave, bonus);
        }

        // Open 3-Card Roguelite Upgrade Draft!
        setTimeout(() => {
          useRogueliteStore.getState().openDraft();
        }, 600);

        this.currentWave++;
      }
    }

    // 4. Update Enemies Pathfinding & Status Effects (Burn, Freeze)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Handle DoT burn
      if (enemy.burnTimer && enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        enemy.hp -= 35 * dt;
        if (enemy.hp <= 0) {
          this.destroyEnemy(enemy);
          continue;
        }
      }

      // Handle Cryogenic Freeze
      if (enemy.frozenTimer && enemy.frozenTimer > 0) {
        enemy.frozenTimer -= dt;
        continue; // Frozen in place!
      }

      // Move toward Core Gateway
      const dx = this.coreGridX - enemy.x;
      const dz = this.coreGridZ - enemy.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= 0.8) {
        // Impact with Core Gateway!
        this.damageCore(enemy.damage);
        SoundFX.playPacketExplosion(enemy.type === 'ZERO_DAY_WORM' || enemy.type === 'BOTNET_COLOSSUS');
        this.enemies.splice(i, 1);
        continue;
      }

      const move = enemy.speed * dt;
      enemy.x += (dx / dist) * move;
      enemy.z += (dz / dist) * move;
    }

    // 5. Update Turret Targeting & Shooting (ONLY IF POWERED!)
    this.updateTurrets(dt, nodes, cables, rogueliteBuffs);

    // 6. Update Laser Beams (fade over duration)
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const beam = this.laserBeams[i];
      beam.elapsed += dt;
      if (beam.elapsed >= beam.duration) {
        this.laserBeams.splice(i, 1);
      }
    }

    // 7. Update Dropped Orbs
    for (let i = this.droppedOrbs.length - 1; i >= 0; i--) {
      const orb = this.droppedOrbs[i];
      orb.lifespan -= dt;
      if (orb.lifespan <= 0) {
        this.droppedOrbs.splice(i, 1);
      }
    }

    // 8. Update Autonomous AGV Bots
    this.updateBots(dt, nodes, rogueliteBuffs);
  }

  /**
   * Mindustry PoE & Bandwidth Verification
   * Traverses cabling graph from Core Gateway and Switches to mark nodes as powered.
   */
  private verifyPowerAndBandwidth(
    nodes: Array<{ id: string; type: string; gridX: number; gridZ: number; isPowered?: boolean; tier3Branch?: string }>,
    cables: Array<{ fromNodeId: string; toNodeId: string; isPowered?: boolean }>,
    buffs: any
  ) {
    const gateway = nodes.find((n) => n.type === 'gateway');
    const isOmni = gateway?.tier3Branch === 'omni_antenna';

    // Master bandwidth from Gateway + Caches
    let totalCapacity = 5000 + buffs.masterBandwidthBonus;
    nodes.filter((n) => n.type === 'cache').forEach(() => {
      totalCapacity += 2000;
    });
    this.totalBandwidthProduced = Math.round(totalCapacity * buffs.bandwidthMultiplier);

    // Graph BFS from Gateway / Core to find all connected nodes
    const poweredSet = new Set<string>();
    if (gateway) {
      poweredSet.add(gateway.id);
    } else {
      // Core Mainframe at (16, 16) powers nodes if no explicit gateway placed
      nodes.forEach((n) => poweredSet.add(n.id));
    }

    // Build adjacency
    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    cables.forEach((c) => {
      adj.get(c.fromNodeId)?.push(c.toNodeId);
      adj.get(c.toNodeId)?.push(c.fromNodeId);
    });

    if (gateway) {
      const queue = [gateway.id];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adj.get(curr) || [];
        for (const neighbor of neighbors) {
          if (!poweredSet.has(neighbor)) {
            poweredSet.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    // If Omni-Antenna Gateway, also power anything within 6 tiles radius!
    if (isOmni && gateway) {
      nodes.forEach((n) => {
        const d = Math.hypot(n.gridX - gateway.gridX, n.gridZ - gateway.gridZ);
        if (d <= 6.5) {
          poweredSet.add(n.id);
        }
      });
    }

    // Accounting
    let consumed = 0;
    let poweredCount = 0;
    let starvedCount = 0;

    nodes.forEach((node) => {
      const isTurret =
        node.type === 'flak' ||
        node.type === 'firewall' ||
        node.type === 'railgun' ||
        node.type === 'harvester';

      const isConnected = poweredSet.has(node.id);
      node.isPowered = isConnected;

      if (isTurret) {
        if (isConnected) {
          consumed += 400;
          poweredCount++;
        } else {
          starvedCount++;
        }
      }
    });

    cables.forEach((c) => {
      c.isPowered = poweredSet.has(c.fromNodeId) && poweredSet.has(c.toNodeId);
    });

    this.totalBandwidthConsumed = consumed;
    this.poweredTurretsCount = poweredCount;
    this.starvedTurretsCount = starvedCount;
  }

  /**
   * Turret shooting logic modulated by Protocol Ammo Stream:
   * - UDP: 2x attack rate, low per-shot damage
   * - TCP: Balanced, cash bounty on kill
   * - TLS: Shield-piercing beam
   * - ICMP: Kinetic knockback shove
   */
  private updateTurrets(
    dt: number,
    nodes: Array<{ id: string; type: string; gridX: number; gridZ: number; status: string; tier?: number; tier3Branch?: string; isPowered?: boolean }>,
    cables: Array<{ fromNodeId: string; toNodeId: string }>,
    buffs: any
  ) {
    if (this.enemies.length === 0) return;

    // Check switches with overclock branch
    const overclockedNodeIds = new Set<string>();
    const switches = nodes.filter((n) => n.type === 'switch');
    switches.forEach((sw) => {
      if (sw.tier3Branch === 'overclock_hub') {
        cables.forEach((c) => {
          if (c.fromNodeId === sw.id) overclockedNodeIds.add(c.toNodeId);
          if (c.toNodeId === sw.id) overclockedNodeIds.add(c.fromNodeId);
        });
      }
    });

    // Tesla Conduit periodic zap along cables
    this.teslaArcTimer += dt;
    if (this.teslaArcTimer >= 1.2) {
      this.teslaArcTimer = 0;
      switches.filter((s) => s.tier3Branch === 'tesla_conduit' && s.isPowered).forEach((sw) => {
        // Zap nearest enemy within 5 tiles
        const target = this.findNearestEnemy(sw.gridX, sw.gridZ, 5.0);
        if (target) {
          target.hp -= 45 * buffs.turretDamageMultiplier;
          this.laserBeams.push({
            id: `tesla_${Date.now()}`,
            fromX: sw.gridX,
            fromY: 0.6,
            fromZ: sw.gridZ,
            toX: target.x,
            toY: 0.3,
            toZ: target.z,
            color: '#38bdf8',
            intensity: 1.0,
            duration: 0.15,
            elapsed: 0,
            isSniper: true,
          });
          SoundFX.playRailgunCrack();
          if (target.hp <= 0) this.destroyEnemy(target);
        }
      });
    }

    nodes.forEach((node) => {
      if (node.status === 'offline' || node.isPowered === false) return; // STARVED / UNPOWERED TURRET!

      const isFlak = node.type === 'flak';
      const isFirewall = node.type === 'firewall';
      const isRailgun = node.type === 'railgun' || node.type === 'ap';

      if (!isFlak && !isFirewall && !isRailgun) return;

      const cd = this.turretCooldowns.get(node.id) || 0;
      if (cd > 0) {
        this.turretCooldowns.set(node.id, cd - dt);
        return;
      }

      // Base Range & Cooldown
      let range = 6.0;
      let baseCooldown = 0.5;
      let baseDamage = 15;

      if (isFlak) {
        range = 5.5;
        baseCooldown = node.tier3Branch === 'gatling_scrubber' ? 0.09 : 0.22;
        baseDamage = node.tier3Branch === 'gatling_scrubber' ? 10 : 14;
      } else if (isFirewall) {
        range = 7.0;
        baseCooldown = 0.45;
        baseDamage = 28;
      } else if (isRailgun) {
        range = node.tier3Branch === 'hyper_railgun' ? 32.0 : 12.0;
        baseCooldown = 1.2;
        baseDamage = 65;
      }

      // Apply Roguelite & Conduit Multipliers
      range *= buffs.turretRangeMultiplier;
      baseDamage *= buffs.turretDamageMultiplier;

      // Protocol Stream Modifications:
      let streamCooldown = baseCooldown;
      if (this.activeProtocol === 'UDP') {
        streamCooldown *= 0.5; // +100% attack rate
        baseDamage *= 0.75;
      } else if (this.activeProtocol === 'TLS') {
        baseDamage *= 1.25; // High-energy laser
      }

      // Overclock Switch Buff
      if (overclockedNodeIds.has(node.id)) {
        streamCooldown *= 0.65;
      }

      streamCooldown /= buffs.turretAttackSpeedMultiplier;

      // Find Target
      let target: MaliciousPacket | null = null;
      if (isRailgun) {
        // Prioritize Bosses & Armored Ransomware
        target = this.findPriorityEnemy(node.gridX, node.gridZ, range);
      } else {
        target = this.findNearestEnemy(node.gridX, node.gridZ, range);
      }

      if (target) {
        this.turretCooldowns.set(node.id, streamCooldown);

        // Protocol special interactions
        if (this.activeProtocol === 'ICMP') {
          // Kinetic Knockback: push packet back
          const kx = target.x - node.gridX;
          const kz = target.z - node.gridZ;
          const kdist = Math.hypot(kx, kz) || 1;
          target.x += (kx / kdist) * 0.7;
          target.z += (kz / kdist) * 0.7;
        }

        if (this.activeProtocol === 'TLS' || node.tier3Branch === 'decryption_array') {
          // Strip shield
          target.shield = Math.max(0, target.shield - baseDamage * 1.5);
          target.isCloaked = false;
        }

        // Apply Damage (Shield absorbs first unless TLS)
        let dmg = baseDamage;
        if (this.activeProtocol !== 'TLS' && target.shield > 0) {
          const absorbed = Math.min(target.shield, dmg);
          target.shield -= absorbed;
          dmg -= absorbed;
        }

        target.hp -= dmg;

        // Stateful Plasma Burning DoT
        if (node.tier3Branch === 'stateful_plasma') {
          target.burnTimer = 3.0;
        }

        // Zero-Day EMP Freeze
        if (node.tier3Branch === 'zero_day_emp') {
          target.frozenTimer = 3.5;
        }

        // Roguelite Burn Buff
        if (buffs.zeroDayBurn && isRailgun) {
          target.burnTimer = 4.0;
        }

        // Visual Laser Beam
        let beamColor = '#38bdf8';
        if (this.activeProtocol === 'UDP') beamColor = '#22c55e';
        if (this.activeProtocol === 'TLS') beamColor = '#facc15';
        if (this.activeProtocol === 'ICMP') beamColor = '#06b6d4';
        if (isFirewall) beamColor = '#ef4444';

        this.laserBeams.push({
          id: `beam_${Date.now()}_${Math.random()}`,
          fromX: node.gridX,
          fromY: 0.75,
          fromZ: node.gridZ,
          toX: target.x,
          toY: 0.3,
          toZ: target.z,
          color: beamColor,
          intensity: 1.0,
          duration: isFlak ? 0.08 : 0.16,
          elapsed: 0,
          isSniper: isRailgun,
          protocol: this.activeProtocol,
        });

        if (isFlak) SoundFX.playFlakBurst();
        else if (isFirewall) SoundFX.playPlasmaLaser();
        else SoundFX.playRailgunCrack();

        if (target.hp <= 0) {
          this.destroyEnemy(target);
        }
      }
    });
  }

  private findNearestEnemy(gx: number, gz: number, maxRange: number): MaliciousPacket | null {
    let nearest: MaliciousPacket | null = null;
    let minDist = maxRange;
    for (const enemy of this.enemies) {
      if (enemy.isCloaked) continue;
      const d = Math.hypot(enemy.x - gx, enemy.z - gz);
      if (d <= minDist) {
        minDist = d;
        nearest = enemy;
      }
    }
    return nearest;
  }

  private findPriorityEnemy(gx: number, gz: number, maxRange: number): MaliciousPacket | null {
    // Priority: Colossus > Worm > Ransomware > nearest
    for (const enemy of this.enemies) {
      if (enemy.type === 'BOTNET_COLOSSUS' || enemy.type === 'ZERO_DAY_WORM') {
        const d = Math.hypot(enemy.x - gx, enemy.z - gz);
        if (d <= maxRange) return enemy;
      }
    }
    for (const enemy of this.enemies) {
      if (enemy.type === 'RANSOMWARE') {
        const d = Math.hypot(enemy.x - gx, enemy.z - gz);
        if (d <= maxRange) return enemy;
      }
    }
    return this.findNearestEnemy(gx, gz, maxRange);
  }

  private destroyEnemy(enemy: MaliciousPacket) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.totalKills++;
    SoundFX.playPacketExplosion(enemy.type === 'ZERO_DAY_WORM' || enemy.type === 'BOTNET_COLOSSUS');

    // TCP Protocol Bounty refund
    const buffs = useRogueliteStore.getState().buffs;
    if (this.activeProtocol === 'TCP' && this.onRewardCash) {
      const tcpBonus = 2 + buffs.tcpBonusCash;
      this.onRewardCash(tcpBonus, 'TCP Delivery Bounty');
    }

    // Zero-Day Worm Split Mechanic
    if (enemy.type === 'ZERO_DAY_WORM' && !enemy.isSubWorm) {
      for (let s = 0; s < 2; s++) {
        this.enemies.push({
          id: `worm_sub_${Date.now()}_${s}`,
          type: 'MALWARE',
          x: enemy.x + (Math.random() * 0.8 - 0.4),
          z: enemy.z + (Math.random() * 0.8 - 0.4),
          targetX: this.coreGridX,
          targetZ: this.coreGridZ,
          hp: 85,
          maxHp: 85,
          shield: 20,
          maxShield: 20,
          speed: 2.5, // Faster sub-worms!
          damage: 15,
          reward: 40,
          color: '#f43f5e',
          size: 0.45,
          isSubWorm: true,
        });
      }
    }

    // Drop blue Data Crystals ($) on the floor
    this.droppedOrbs.push({
      id: `orb_${Date.now()}_${Math.random()}`,
      gridX: Math.round(enemy.x),
      gridZ: Math.round(enemy.z),
      worldX: enemy.x,
      worldZ: enemy.z,
      value: enemy.reward,
      createdAt: Date.now(),
      lifespan: 22.0,
    });
  }

  /**
   * Autonomous AGV Harvester Bots Movement & Vacuum Loop
   */
  private updateBots(dt: number, nodes: any[], buffs: any) {
    const gateway = { gridX: this.coreGridX, gridZ: this.coreGridZ };

    this.bots.forEach((bot) => {
      // If carrying data crystals, return to Core Gateway or nearest Server Rack to deposit
      if (bot.carryingValue > 0) {
        const depositTargets = [
          { gridX: this.coreGridX, gridZ: this.coreGridZ },
          ...nodes
            .filter((n) => (n.type === 'server' || n.type === 'database' || n.type === 'gateway') && n.status !== 'offline')
            .map((n) => ({ gridX: n.gridX, gridZ: n.gridZ })),
        ];

        let target = depositTargets[0];
        let targetDist = Math.hypot(bot.x - target.gridX, bot.z - target.gridZ);
        for (let i = 1; i < depositTargets.length; i++) {
          const d = Math.hypot(bot.x - depositTargets[i].gridX, bot.z - depositTargets[i].gridZ);
          if (d < targetDist) {
            target = depositTargets[i];
            targetDist = d;
          }
        }

        bot.status = 'returning';
        bot.targetX = target.gridX;
        bot.targetZ = target.gridZ;

        const dx = bot.targetX - bot.x;
        const dz = bot.targetZ - bot.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= 0.8) {
          if (this.onRewardCash) {
            this.onRewardCash(bot.carryingValue, `${bot.name} Crystal Deposit`);
          }
          SoundFX.playCoinPing(true);
          bot.carryingValue = 0;
          bot.status = 'idle';
        } else {
          const move = bot.speed * dt;
          bot.x += (dx / dist) * Math.min(dist, move);
          bot.z += (dz / dist) * Math.min(dist, move);
          bot.rotation = Math.atan2(dx, dz);
        }
        return;
      }

      // If dropped orbs exist, pathfind to vacuum them
      if (this.droppedOrbs.length > 0) {
        let nearestOrb: DroppedDataOrb | null = null;
        let minDist = Infinity;

        for (const orb of this.droppedOrbs) {
          const d = Math.hypot(orb.worldX - bot.x, orb.worldZ - bot.z);
          if (d < minDist) {
            minDist = d;
            nearestOrb = orb;
          }
        }

        if (nearestOrb) {
          bot.status = 'harvesting';
          bot.targetX = nearestOrb.worldX;
          bot.targetZ = nearestOrb.worldZ;

          const dx = bot.targetX - bot.x;
          const dz = bot.targetZ - bot.z;
          const dist = Math.hypot(dx, dz);

          const vacuumRange = bot.isMagnet ? 2.5 : 0.6;
          if (dist <= vacuumRange) {
            const idx = this.droppedOrbs.indexOf(nearestOrb);
            if (idx !== -1) {
              bot.carryingValue += nearestOrb.value;
              this.droppedOrbs.splice(idx, 1);
              SoundFX.playCoinPing(false);
            }
          } else {
            const move = bot.speed * dt;
            bot.x += (dx / dist) * Math.min(dist, move);
            bot.z += (dz / dist) * Math.min(dist, move);
            bot.rotation = Math.atan2(dx, dz);
          }
          return;
        }
      }

      // Default patrol radius
      bot.status = 'moving';
      const angle = Date.now() * 0.0008 + parseInt(bot.id.slice(-2) || '0', 10);
      bot.targetX = this.coreGridX + Math.cos(angle) * 4.5;
      bot.targetZ = this.coreGridZ + Math.sin(angle) * 4.5;

      const dx = bot.targetX - bot.x;
      const dz = bot.targetZ - bot.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.2) {
        const move = bot.speed * 0.65 * dt;
        bot.x += (dx / dist) * Math.min(dist, move);
        bot.z += (dz / dist) * Math.min(dist, move);
        bot.rotation = Math.atan2(dx, dz);
      }
    });
  }

  private damageCore(amount: number) {
    const buffs = useRogueliteStore.getState().buffs;

    // BGP Reflect Shockwave Buff
    if (buffs.bgpReflectShockwave) {
      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.coreGridX, e.z - this.coreGridZ);
        if (d <= 5.0) {
          e.hp -= amount * 0.4;
        }
      });
    }

    if (this.coreShield > 0) {
      const shieldDmg = Math.min(this.coreShield, amount);
      this.coreShield -= shieldDmg;
      amount -= shieldDmg;
    }

    if (amount > 0) {
      this.coreHp = Math.max(0, this.coreHp - amount);
    }

    if (this.onCoreDamaged) {
      this.onCoreDamaged(this.coreHp, this.maxCoreHp);
    }

    if (this.coreHp <= 0) {
      this.waveState = 'game_over';
      SoundFX.setCombatIntensity(0);
      if (this.onWaveFailed) {
        this.onWaveFailed();
      }
      if (this.onMicroToast) {
        this.onMicroToast('💥 CORE OVERRUN! Protocol Defense breached! Rebuild your topology.', 'danger');
      }
    }
  }

  public getStats(): DefenseStats {
    const era = WaveDirector.getEra(this.currentWave);
    return {
      coreHp: Math.round(this.coreHp),
      maxCoreHp: this.maxCoreHp,
      coreShield: Math.round(this.coreShield),
      maxCoreShield: this.maxCoreShield,
      wave: this.currentWave,
      waveState: this.waveState,
      waveCountdown: Math.max(0, Number(this.waveCountdown.toFixed(1))),
      waveEnemiesRemaining: this.enemies.length + Math.max(0, this.totalToSpawnThisWave - this.spawnedThisWave),
      totalKills: this.totalKills,
      empCooldown: Math.ceil(this.empCooldown),
      maxEmpCooldown: this.MAX_EMP_COOLDOWN,
      isEmpReady: this.empCooldown <= 0,
      activeBotsCount: this.bots.length,
      orbsOnGroundCount: this.droppedOrbs.length,
      eraName: era.name,
      eraDescription: era.description,
      activeProtocol: this.activeProtocol,
      totalBandwidthProduced: this.totalBandwidthProduced,
      totalBandwidthConsumed: this.totalBandwidthConsumed,
      poweredTurretsCount: this.poweredTurretsCount,
      starvedTurretsCount: this.starvedTurretsCount,
    };
  }
}

export const globalDefenseEngine = new DefenseEngine();
