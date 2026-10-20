# IsoPacket: HD-2D Isometric Network Topology Simulator & Homelab Visualizer
> **Architecture Roadmap, Invariants & Engineering Specification**

IsoPacket is an open-source, HD-2D (2.5D Pixel-Art + Three.js) Network Topology Simulator, Homelab Visualizer, and Packet Routing Puzzle Game. It merges the visual charm of classic 16-bit isometric pixel art with a deterministic packet routing simulation engine and real-time 3D graphics (dynamic shadows, emissive glow, 3D drooping patch cables, and instanced packet flows).

---

## 1. Architectural Invariants

### 1.1 Visual Style (HD-2D / 2.5D)
- **Pixel-Art Texture Fidelity:** All floor tiles, hardware front plates, servers, routers, and switches are procedurally generated or loaded at 64x64/128x128 resolution using `THREE.NearestFilter` with zero mipmap blurring (`generateMipmaps = false`, `minFilter = THREE.NearestFilter`, `magFilter = THREE.NearestFilter`).
- **Orthographic Isometric Camera:** True axonometric/isometric projection using `THREE.OrthographicCamera` angled at $\approx 35.264^\circ$ tilt ($\arctan(1/\sqrt{2})$) and $45^\circ$ horizontal azimuth rotation.
- **Dynamic Lighting & Emissive Materials:**
  - Directional sun/spotlight with soft PCF shadows (`castShadow = true`).
  - Emissive status LEDs on rack-mounted servers, switches, and routers (blinking TX/RX activity, link state, fault red/amber indicators).
  - Ground plane contact shadows and crisp isometric tile highlights.
- **Zero 404 Dependencies:** Initial boot loads 100% procedurally rendered retro hardware pixel art rendered onto offscreen HTML5 canvases.

### 1.2 Separation of Concerns & Directory Structure
```text
/
├── PLAN.md                               # This document: Single Source of Truth
├── src/
│   ├── engine/                           # Pure TypeScript deterministic packet engine
│   │   ├── types.ts                      # Packets, Protocols, L2/L3 Node specs, Interfaces
│   │   ├── SimulationEngine.ts           # Tick scheduler, clock sync, packet queue
│   │   ├── RoutingTable.ts               # L3 CIDR prefix matching & next-hop resolution
│   │   ├── FirewallAcl.ts                # Stateless & stateful L4 packet filtering rules
│   │   └── NetworkNode.ts                # Base class for Router, Switch, Server, Firewall
│   │
│   ├── state/                            # Zustand store
│   │   ├── useTopologyStore.ts           # Grid placement, nodes, cables, selection, tool mode
│   │   └── useSimulationStore.ts         # Engine speed, stats, scenario objectives, metrics
│   │
│   ├── assets/                           # Procedural Canvas 16-bit Pixel-Art Generator
│   │   ├── PixelTextureFactory.ts        # Offscreen canvas generator (tiles, servers, routers)
│   │   └── SpritePresets.ts              # Palettes, LED coordinates, bezel textures
│   │
│   ├── components/
│   │   ├── canvas/                       # Three.js 2.5D Isometric Scene
│   │   │   ├── IsometricViewport.tsx     # Three.js Canvas container with Pan/Zoom & Raycaster
│   │   │   ├── IsometricGrid.tsx         # 16x16 data center server floor tiles
│   │   │   ├── HardwareNodeMesh.tsx      # 2.5D layered billboard / beveled server rack mesh
│   │   │   ├── CatenaryCableMesh.tsx     # 3D drooping bezier spline patch cables
│   │   │   └── InstancedPacketSystem.tsx # GPU InstancedMesh glowing packet renderer
│   │   │
│   │   └── ui/                           # Cyberpunk / Homelab Terminal HUD
│   │       ├── HeaderBar.tsx             # Topology title, scenario indicator, simulation speed
│   │       ├── BottomToolbar.tsx         # Sleek collapsible dock for hardware placement
│   │       ├── NodeInspector.tsx         # Drawer for IP, MAC, VLAN, ACL, and queue monitoring
│   │       ├── ScenarioModal.tsx         # Campaign briefings and win/loss scoring
│   │       └── TopologyExportModal.tsx   # JSON / Docker-Compose import & export
│   │
│   ├── App.tsx                           # Root orchestrator
│   └── main.tsx                          # React entry point
```

---

## 2. Five-Phase Implementation Roadmap

### Phase 1: Foundation, `PLAN.md` & HD-2D Isometric Renderer [COMPLETED]
- [x] **Architecture Blueprint:** Author complete `PLAN.md` with system constraints and 5-phase breakdown.
- [x] **PixelTextureFactory:** Procedural pixel-art canvas generator for:
  - Isometric data center floor tiles (raised flooring, server rack vents, warning stripes).
  - Hardware chassis sprites (ISP Gateway, Core Router, L2 Switch, Next-Gen Firewall, Web Server Blade, PostgreSQL Database, Workstation / IoT Client).
  - Normal, bump, and emissive activity maps.
- [x] **Orthographic Isometric Viewport:**
  - Configured with `THREE.OrthographicCamera`, silky pan (middle/right-drag or space-drag), and discrete pixel-snapped zoom.
  - Directional shadow-casting key light, cool hemisphere fill, and ambient studio grounding.
- [x] **Interactive 16x16 Isometric Floor Grid:**
  - Raycaster calculating continuous mouse-to-isometric-grid coordinate transformations.
  - Hover cursor tile outline and height-offset placement proxy.
- [x] **Node Placement & Manipulation Foundation:**
  - Zustand state for hardware node placements on grid `(x, y)`.
  - Add, move, select, and delete node capabilities.
  - Bottom hardware palette dock (zero viewport obstruction).

### Phase 2: 3D Catenary Patch Cables & Deterministic Packet Engine [COMPLETED]
- [x] **Port-to-Port Wiring System:**
  - Interactive cable connection tool (click port on Node A -> drag catenary curve to Node B).
  - Physical catenary curve math: smooth sag under gravity with subtle slack.
  - RJ-45 boot colors (Blue Cat6, Red Management, Yellow Fiber, Green DMZ) and port status LEDs.
- [x] **Deterministic Simulation Engine (`SimulationEngine.ts`):**
  - Discrete tick updates with Play, Pause, 1x/2x speed, and Single Step.
  - Packet structures: Header (SrcIP, DstIP, Protocol: `HTTP|HTTPS|DNS|SSH|SQL|DDOS`, PayloadSize, TTL, VLAN_Tag).
  - Bandwidth, queue size limits (FIFO buffer management), latency calculation, and packet loss on buffer overrun.
  - Shortest-path graph routing across cables and automated background traffic scheduling.
- [x] **InstancedMesh GPU Packet Flow:**
  - `THREE.InstancedMesh` rendering hundreds of glowing voxel packets smoothly moving along 3D catenary splines at 60 FPS.
  - Color-coded packet trails based on protocol (HTTP: Green, HTTPS: Cyan, DNS: Indigo, SSH: Amber, SQL: Purple, DDoS: Red).
  - Drop spark particle explosion bursts when packets drop due to node queue overrun.

### Phase 3: Deep Inspection HUD, CLI Configurator & Firewall ACLs [COMPLETED]
- [x] **Interactive Node Inspector Drawer:**
  - Network Configuration: Assign IP (`192.168.1.1/24`), MAC, Default Gateway, and VLAN ID.
  - Interface state: Port status, link duplex, Ingress/Egress throughput gauges (Mbps).
  - Queue depth buffer bar (with percentage & FIFO threshold) and CPU/Memory utilization meters.
  - Active Catenary Patch Cables list with disconnect buttons and wire shortcuts.
- [x] **Firewall & ACL Rule Editor:**
  - Order-dependent rule chain (`ALLOW` / `DROP`) evaluated sequentially in real time by `SimulationEngine.ts`.
  - Filtering by Protocol (`HTTP`, `HTTPS`, `DNS`, `SSH`, `SQL`, `DDOS`, `ALL`), Target VLAN, and Port.
  - Hit counter per rule tracking blocked/allowed packets.
  - Dynamic 3D holographic hexagonal energy shield barrier & spark burst animations when malicious packets hit a DROP rule.
- [x] **Terminal / Homelab CLI Mode:**
  - Embedded interactive terminal shell supporting `ping`, `iptables -L`, `route`, `ifconfig`, `tcpdump`, `clear`, and `help`.

### Phase 4: Campaign Scenarios & Chaos Engineering
- [ ] **Campaign 1: "The Slashdot Traffic Spike"**
  - Web server overloaded by incoming HTTP GET traffic; configure load balancer and horizontal cache server replica before SLA falls below 99.0%.
- [ ] **Campaign 2: "DDoS Mitigation 101"**
  - High-volume SYN flood from botnet gateway; deploy Next-Gen Firewall with rate-limiting ACLs while preserving legitimate customer traffic.
- [ ] **Campaign 3: "Zero-Downtime Database Failover"**
  - Primary DB failure simulation; reroute connection strings to read-replica switchover with zero dropped transactions.
- [ ] **Campaign 4: "VLAN Segmentation Challenge"**
  - Isolate untrusted IoT cameras from internal finance server while maintaining gateway internet egress.

### Phase 5: Open-Source Polish, Sprite Hot-Swap Studio & Topology Exporter
- [ ] **Custom Sprite Manager:**
  - Drag-and-drop custom PNG pixel art to replace procedural node textures on the fly.
- [ ] **Topology Import & Export:**
  - JSON Schema serialization of full network state (nodes, coordinates, cables, ACLs, IP tables).
  - Docker-Compose importer: automatically translates `services`, `ports`, and `networks` into an isometric 3D rack diagram!
- [ ] **Audio Feedback:**
  - Zero-dependency Web Audio synthesizer for relay clicks, server hum, packet ping chirps, and alarm buzzers.

---

## 3. Phase 1 Technical Invariants (Current Sprint)
1. **Three.js Canvas Setup:**
   - Isolated `div` mount with standard `useRef`.
   - `WebGLRenderer` configured with `THREE.SRGBColorSpace`, PCF soft shadow maps, and `toneMapping = THREE.ACESFilmicToneMapping`.
   - ResizeObserver handling seamless window resize and DPI scaling (`Math.min(window.devicePixelRatio, 2)`).
2. **Procedural Pixel-Art Generation:**
   - 64x64 Canvas with isometric isometric diamond tiles.
   - Distinctive 2.5D hardware models: Core Router (enterprise rack chassis with LED array), L2 Switch (24-port front panel), Firewall (hardened red industrial rack), Web Server (1U blade with drive bays), Database (array of illuminated hot-swap NVMe drives), Gateway (fiber ONT/satellite dish motif).
3. **Smooth Interaction:**
   - Isometric coordinate conversion:
     - World position $(X, 0, Z)$ maps to grid tile: $gx = \text{round}(X / \text{tileSize})$, $gz = \text{round}(Z / \text{tileSize})$.
   - Drag to pan, scroll wheel to zoom (smooth exponential damping).
   - Bottom dock: Node selection palette, view controls (reset camera, toggle grid, toggle shadows), node count.
