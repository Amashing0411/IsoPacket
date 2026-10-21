# IsoPacket: Cisco-Inspired Network Tycoon & HD-2D Homelab Visualizer
> **Architecture Roadmap, Enterprise Invariants & Engineering Specification**

IsoPacket is a production-ready, mobile-friendly **Cisco-Inspired Network Tycoon & Educational Topology Visualizer Game**. It combines classic 16-bit isometric HD-2D pixel art with a deterministic packet routing simulation engine, real-time 3D graphics (dynamic soft shadows, emissive activity LEDs, catenary drooping patch cables, instanced GPU packet streams), and actual Cisco enterprise concepts (VLAN tagging, Subnetting, Access Control Lists, Wi-Fi 6 AP coverage, and Tycoon office productivity).

---

## 1. Architectural Invariants

### 1.1 HD-2D Isometric Viewport & Visual Presentation
- **32x32 Isometric Data Center Baseplate:** Expansive high-tech raised floor with metallic cooling vents and grounding rivets.
- **Strict Hazard Perimeter:** Hazard yellow-and-black caution stripes are strictly constrained to the absolute outer perimeter tiles (`gx === 0 || gx === 31 || gz === 0 || gz === 31`).
- **Retro Pixel-Art Shaders & Procedural Textures:** Zero 404 external sprite dependencies. All hardware chassis, drive caddies, RJ45 ports, and terminals are generated procedurally on offscreen HTML5 canvases using `THREE.NearestFilter` with zero mipmap blurring.
- **Wi-Fi 6 Cellular Radio Rings:** Cisco Catalyst 9100 Access Points project a 7-tile dynamic radio coverage radius on the floor, enabling seamless wireless roaming for laptops, security cameras, and automated warehouse AGV robots.
- **Catenary Physical Cables:** 3D catenary bezier curves with gravity-driven sag and RJ-45 boot colors (Cat6 Blue, Fiber Yellow, Security Red, Database Purple, Voice Green).

### 1.2 Cisco Enterprise Concepts & Tycoon Economics
- **Hierarchical Network Design:**
  - **Core Layer:** WAN Fiber Gateways & Cisco Core L3 Routers.
  - **Distribution Layer:** Cisco Catalyst L2/L3 Switches with 802.1Q trunking & Next-Gen Firewalls with stateful ACL rules.
  - **Access & Wireless Layer:** Wi-Fi 6 APs & Structured Cat6 Cabling.
  - **End Devices & Workloads:** Workstation PCs, Executive Laptops, Cisco VoIP IP Phones, Network Laser Printers, Smart PoE Cameras, and Autonomous AGV Robots.
- **Connectivity & Productivity Loop:**
  - End devices *must* maintain an active cabled or wireless route to an active ISP Gateway.
  - While online, each endpoint produces recurring cash ($/s) based on link stability and queue latency:
    - Autonomous Warehouse AGV Robot: **+$45/s** (IoT VLAN 30)
    - Mobile Executive Laptop: **+$25/s** (Data VLAN 10)
    - Office Workstation PC: **+$20/s** (Data VLAN 10)
    - Smart Security Camera: **+$18/s** (IoT VLAN 30)
    - NVMe Database Node: **+$15/s** (Server VLAN 50)
    - Cisco VoIP IP Phone: **+$12/s** (Voice VLAN 20 with QoS)
    - 1U Blade Web Server: **+$10/s** (Server VLAN 50)
    - Network Laser Printer: **+$8/s** (Data VLAN 10)
  - If a link drops, switch buffers overflow, or a cable is cut, workers halt and revenue drops to $0/s!

### 1.3 Audio Architecture (`src/utils/AudioManager.ts`)
- **Web Audio API Synthesizer:** Zero external audio files required. Synthesizes mechanical switch clicks, RJ45 cable connection snaps, packet drop glitch buzzers, victory arpeggio fanfares, and an ambient cyberpunk synth drone.
- **Audio Unlock:** Cleanly unlocked on user interaction during the animated loading sequence.

### 1.4 Responsive HUD & Mobile Touch Controls
- **Fluid Multi-Touch Gestures:** Pinch-to-zoom (tracking distance between dual touch points), single-finger pan, and tap selection.
- **Adaptive Drawer / Bottom-Sheet:** On mobile screens, the Node Inspector transforms into a slide-up bottom sheet with grab handles; on desktop, it functions as a compact side drawer.
- **Interactive Onboarding Tutorial:** Step-by-step walkthrough explaining core routing, distribution switching, VLAN segmentation, and tycoon objectives.

---

## 2. Directory Structure
```text
/
├── PLAN.md                               # Architecture Roadmap & Technical Invariants
├── README.md                             # Production GitHub & Vercel Documentation
├── src/
│   ├── engine/                           # Pure TypeScript deterministic packet engine
│   │   ├── types.ts                      # Packets, Protocols, Cisco L2/L3 Node specs
│   │   ├── SimulationEngine.ts           # Tick scheduler, routing graph, tycoon productivity
│   │   ├── scenarioDefs.ts               # Campaign missions & starter topologies
│   │   ├── scenarioTypes.ts              # Budget rules, SLA metrics, win conditions
│   │   └── simulation.test.ts            # Node.js test suite for engine invariants
│   │
│   ├── utils/
│   │   └── AudioManager.ts               # Synthesized Web Audio API sound effects & synth BGM
│   │
│   ├── state/                            # Zustand reactive state stores
│   │   ├── useTopologyStore.ts           # 32x32 grid nodes, cables, tools, selection
│   │   ├── useSimulationStore.ts         # Simulation clock, play/pause, stats
│   │   └── useScenarioStore.ts           # Campaign missions, SLA tracking, chaos drawer
│   │
│   ├── assets/
│   │   └── PixelTextureFactory.ts        # Procedural 16-bit pixel-art generator for all Cisco nodes
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── IsometricViewport.tsx     # 32x32 Three.js canvas, touch gestures, AP rings
│   │   │   ├── CatenaryCableSystem.ts    # Physical drooping catenary bezier cables
│   │   │   └── InstancedPacketSystem.ts  # Instanced glowing packets & spark bursts
│   │   │
│   │   └── ui/
│   │       ├── HeaderBar.tsx             # Tycoon status, Cash ($), SLA %, Speed, Audio mute
│   │       ├── BottomToolbar.tsx         # Categorized dock (Infrastructure vs End Devices)
│   │       ├── NodeInspector.tsx         # Mobile bottom-sheet / drawer for IP, VLAN, ACL, cables
│   │       ├── LoadingScreen.tsx         # Cyberpunk booting sequence & progress bar
│   │       ├── TutorialModal.tsx         # 5-step interactive Cisco onboarding tutorial
│   │       ├── ScenarioModal.tsx         # Campaign mission briefings & victory celebrations
│   │       ├── ChaosMonkeyDrawer.tsx     # Fault injection (cable cut, DDoS flood, server crash)
│   │       └── HelpModal.tsx             # Keyboard shortcuts & controls guide
│   │
│   ├── App.tsx                           # Master application orchestrator
│   └── main.tsx                          # Vite React entry point
```

---

## 3. Implementation Roadmap & Status

- [x] **Phase 1: Foundation & HD-2D Isometric 32x32 Engine**
  - [x] Scaled isometric grid to 32x32 tiles.
  - [x] Strict hazard borders confined strictly to outer boundary perimeter coordinates.
  - [x] Procedural pixel-art texture generator for enterprise routers, switches, APs, servers, PCs, phones, printers, and AGV robots.
- [x] **Phase 2: 3D Catenary Cables & Deterministic Packet Engine**
  - [x] Port-to-port catenary curve physics with RJ-45 boot colors.
  - [x] InstancedMesh GPU packet rendering with protocol-specific glows (HTTP, HTTPS, DNS, SSH, SQL, DDOS).
  - [x] Packet drop spark explosions and FIFO buffer queue overflow protection.
- [x] **Phase 3: Cisco Enterprise Features & Deep Inspection**
  - [x] Interactive VLAN assignment (Data VLAN 10, Voice VLAN 20, IoT VLAN 30, Server VLAN 50).
  - [x] Next-Gen Firewall ACL rule chain editor (`ALLOW` / `DROP`).
  - [x] Mobile bottom-sheet inspector with grab bar and touch-friendly controls.
- [x] **Phase 4: Campaign Scenarios & Chaos Engineering**
  - [x] Scenario Selector modal featuring Free Homelab Sandbox + 4 structured puzzle missions:
    1. First Homelab Setup (Unwired starter rack)
    2. DDoS Scrubbing Center (Firewall ACL protection)
    3. Load Balancing the Slashdot Effect (Multi-server clustering)
    4. VLAN Database Isolation (Segmenting sensitive database tier)
  - [x] SLA Uptime Gauge (requiring $\ge 99.0\%$ SLA for 30s) and hardware budgeting ($).
  - [x] Chaos Monkey fault injector (Sever Cable, 100G DDoS Spike, Kernel Panic).
- [x] **Phase 5: Cisco Tycoon Economy, Web Audio & Mobile Polish**
  - [x] Synthesized Web Audio API sound effects (`AudioManager.ts`) and cyberpunk synth drone.
  - [x] Animated cyberpunk booting screen with diagnostic progress bar.
  - [x] 5-step interactive onboarding tutorial explaining Cisco concepts and tycoon loop.
  - [x] Multi-touch pinch-to-zoom and touch pan support for mobile and tablet browsers.
  - [x] Tycoon cash accumulation loop: connected end devices generate revenue ($/s); disconnected devices lose productivity.
