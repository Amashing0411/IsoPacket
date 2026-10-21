# 🌐 CYBERCORE: PROTOCOL ROGUE (Mindustry × Network Defense × Roguelite)
> **Master Game Design, Engine Architecture & Technical Specification**

---

## 1. Executive Summary & Vision
CYBERCORE: PROTOCOL ROGUE combines the supply-chain logistics of *Mindustry*, the strategic spatial depth of *Tower Defense*, and the build diversity of modern *Roguelites* (such as *Balatro* and *FTL*).

Instead of ammunition belts and conveyor loaders, defense turrets are powered by **Bandwidth & Power-over-Ethernet (PoE)** transmitted across real-time network cabling from the **Wi-Fi 7 Core Gateway** and **PoE Core Switches**. Unpowered turrets droop and shut down; properly supplied turrets blaze with data packets and fire according to the **Protocol Ammo Stream** routed through them.

---

## 2. Core Gameplay Pillars

### 2.1 The Mindustry-Style Bandwidth & PoE Ammo Grid
- **Bandwidth as Ammunition:**
  - Every turret consumes bandwidth (e.g., 250 Mbps to 1000 Mbps).
  - The Core Gateway produces master bandwidth (default 5,000 Mbps, expandable via Caches and Upgrades).
  - Switches distribute and amplify bandwidth across connected ports.
- **Physical Cable Links:**
  - Cat6 and Fiber cables must connect turrets back to a PoE Switch or Gateway.
  - If a cable is severed by an EMP or enemy contact, downstream turrets become **Starved**: their barrels droop, status LEDs glow dark red, smoke/sparks emit, and they cannot fire.
- **Protocol Conduit System (Data Stream Types):**
  Switches allow selecting which protocol stream is routed through their subnets:
  1. **UDP (Green Stream):** +100% fire rate, rapid-fire bullet spray, lower per-shot damage (anti-swarm).
  2. **TCP (Blue Stream):** Balanced fire rate, verified packet delivery, refunds +$2 cash per confirmed kill.
  3. **TLS/HTTPS (Gold Stream):** Focused piercing beam that bypasses armored boss shields.
  4. **ICMP (Cyan Stream):** High-impact kinetic shockwave that shoves advancing packets backward.

---

## 3. The 8 Base Hardware Nodes & 16 Tier-3 Branching Specializations

| # | Base Node | Role | Tier 3 Path A | Tier 3 Path B |
|---|---|---|---|---|
| 1 | **Wi-Fi 7 Core Gateway** | Central Objective & Master Power | **[Omni-Antenna]**: Broadcasts wireless power radius (no cables needed within 6 tiles) | **[Hardened Bunker]**: 2.5x Max HP & reactive radial EMP shockwave when hit |
| 2 | **PoE Core Switch** | Bandwidth Distribution Hub | **[Overclock Hub]**: +50% fire rate and +100% throughput to directly cabled turrets | **[Tesla Conduit]**: Arcs continuous chain lightning along cables at crossing enemies |
| 3 | **DPI Flak Cannon** | Rapid Anti-Swarm Shredder | **[Gatling Scrubber]**: Insane multi-barrel anti-swarm fire rate | **[Decryption Array]**: Strips cloaking and energy shields from armored packets |
| 4 | **Firewall Scrubber** | Heavy Thermal Plasma Beam | **[Stateful Plasma Beam]**: Heavy thermal beam dealing stacking burning DoT | **[Air-Gapped Barricade]**: Solid physical energy barrier that blocks enemy traversal |
| 5 | **Next-Gen IPS Railgun** | Ultra Long-Range Sniper | **[Hyper-Railgun]**: Infinite-range piercing rail that tears across full grid lines | **[Zero-Day EMP]**: Cryogenic payload that freezes bosses and groups for 3.5s |
| 6 | **Bandwidth Proxy Cache** | Capacity Booster & Battery | **[Volatile Buffer]**: High-explosive shrapnel detonation if destroyed or triggered | **[Nanite Repair Node]**: Restores HP and shields to adjacent damaged turrets |
| 7 | **Autonomous AGV Harvester**| Mobile Resource Gatherer | **[Combat Drone]**: Armed rover patrol engaging leaks directly | **[Magnet Harvester]**: Long-range magnetic tractor beam for instant crystal pickup |
| 8 | **Data Mining Server Rack** | Tycoon Economy Generator | **[Crypto Miner]**: Exponential cash scaling per wave survival | **[Honeypot Trap]**: High-threat decoy beacon taunting and diverting enemy pathfinding |

---

## 4. 100-Wave Procedural Wave Director (`src/engine/WaveDirector.ts`)

The 100 waves are structured into 5 tactical eras:
1. **Waves 1–20 (The Local LAN Era):**
   - Script-kiddie worms and low-density SYN flood swarms. Teaches cabling fundamentals, PoE supply, and basic flak/firewall chokepoints.
2. **Waves 21–40 (The Botnet Surge):**
   - Armored Ransomware tanks (disable cables on contact) and cloaked Infiltrators that phase through basic turrets unless decrypted.
3. **Waves 41–60 (Cable Sabotage):**
   - Atmospheric EMP surges that sever random single cable links, forcing players to build redundant ring topologies and proxy caches.
4. **Waves 61–80 (Malware Inversion):**
   - Bosses launch corrupted injection payloads that temporarily hack turrets to fire toward the Core until rebooted or diverted by Honeypots.
5. **Waves 81–100+ (Nation-State Cyberwarfare):**
   - Dual spawn rifts, colossal multi-segmented worm bosses, continuous DDoS saturation storms.
6. **Boss Battles (Every 5th & 10th Wave):**
   - **Zero-Day Worm:** Multi-segmented cyber-centipede that splits into 2 faster sub-worms whenever a segment is destroyed.
   - **DDoS Botnet Colossus:** Armored behemoth with rotating orbital barrier shields and periodic ground EMP slams.

---

## 5. Post-Wave Roguelite Card Draft System
At the end of each wave, the game pauses with a dramatic slow-motion blur and presents **3 Randomized Roguelite Upgrades**:
- 🃏 **Overclocked Cat6:** *Cables deliver +50% bandwidth; turrets gain +25% range.*
- 🃏 **BGP Anycast Routing:** *When Core Gateway is hit, 30% of damage reflects as an electrical shockwave.*
- 🃏 **Zero-Day Payload:** *IPS Railgun hits apply a corrosive Malware Burn dealing 40 DPS over 4 seconds.*
- 🃏 **PoE Overdrive:** *Switches periodically emit a chain-lightning arc that zaps nearby enemies.*
- 🃏 **Automated Bot Fleet:** *Instantly spawns 2 additional AGV Harvester Bots with +50% speed and 2x vacuum radius.*
- 🃏 **Hardware Acceleration:** *All current and future turrets gain visual Tier-2 golden armor and +20% base damage.*
- 🃏 **Quantum Encryption:** *Core Gateway gains a regenerable 50 HP energy overshield.*
- 🃏 **Packet Sniffer:** *TCP kills refund an additional +$4 cash bonus.*

---

## 6. Procedural Web Audio Engine Specification (`src/audio/SoundFX.ts`)
- **Auto-Unlock:** Audio context unlocks seamlessly on the very first user click, tap, or touch event on `window`.
- **Procedural BGM:** 120-BPM driving synthesizer bassline with dual detuned saw oscillators and a resonant biquad lowpass filter. Cutoff dynamically scales from 450Hz to 3200Hz as wave intensity peaks.
- **Combat & Mechanical SFX:**
  - Turret rotation servo hum
  - Flak cannon twin-burst (`playFlakBurst`)
  - Railgun hypersonic crack (`playRailgunCrack`)
  - Plasma laser thermal hiss (`playPlasmaLaser`)
  - Packet explosion crunch & boss death detonation
  - Boss arrival klaxon siren
  - Roguelite card draft fanfare
  - In-HUD volume slider and instant mute toggle
