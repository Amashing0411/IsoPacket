# 🏢 IsoPacket: Cisco-Inspired Network Tycoon & Homelab Visualizer

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r173-black.svg?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

> An open-source, mobile-friendly **HD-2D Isometric Network Topology Simulator, Homelab Visualizer, and Packet Routing Tycoon Game**. Design enterprise-grade topologies, configure Cisco VLANs and Firewall ACLs, project Wi-Fi 6 AP cellular coverage rings, and keep office workstations and autonomous warehouse robots online to generate cash!

---

## 🌟 Key Features

### 1. 🎮 Cisco Tycoon & Educational Mechanics
- **The Productivity & Connectivity Loop:** Office PCs, Laptops, IP Phones, Security Cameras, and Warehouse AGV Robots *must* maintain a valid route to an active ISP WAN Fiber Gateway.
- **Real-Time Revenue Accumulation:**
  - **Autonomous Warehouse Robot (AGV):** `+$45/s` (IoT VLAN 30) — Halts immediately if connection drops or switch buffers overflow!
  - **Executive Laptop:** `+$25/s` (Data VLAN 10) — Roams seamlessly across Wi-Fi 6 Access Points.
  - **Workstation PC:** `+$20/s` (Data VLAN 10) — Office staff productivity.
  - **Smart PoE Camera:** `+$18/s` (IoT VLAN 30) — Streams high-bandwidth video feeds.
  - **NVMe Database Node:** `+$15/s` (Server VLAN 50) — High-throughput transactional queries.
  - **Cisco VoIP IP Phone:** `+$12/s` (Voice VLAN 20 with QoS) — Dedicated voice bandwidth.
  - **1U Blade Web Server:** `+$10/s` (Server VLAN 50) — Frontline web traffic serving.
  - **Network Laser Printer:** `+$8/s` (Data VLAN 10) — Shared departmental printing.
- **SLA Uptime Tracking:** Maintain $\ge 99.0\%$ SLA under high-concurrency traffic load to win campaign missions.

### 2. 🌐 Cisco Enterprise Networking Principles
- **VLAN Tagging & 802.1Q Encapsulation:** Segregate Voice (VLAN 20), Data (VLAN 10), and Warehouse Robotics (VLAN 30) to eliminate broadcast storms.
- **Wi-Fi 6 Cellular Coverage:** Cisco Catalyst 9100 APs project a dynamic 7-tile circular coverage ring. Any wireless-enabled device inside the ring links automatically without physical cabling!
- **Stateful Next-Gen Firewall ACLs:** Chain sequential `ALLOW` and `DROP` rules by protocol (HTTP, HTTPS, DNS, SSH, SQL, DDOS) to safeguard internal subnets.
- **Deterministic Packet Simulation:** Packets travel along physical 3D catenary patch cables with hop counters, TTL expiration, FIFO queue overflow, and shortest-path Dijkstra graph routing.

### 3. 🎨 HD-2D Visuals & 32x32 Isometric Grid
- **Expansive 32x32 Floor Baseplate:** High-tech data center raised flooring with cooling vents and strict perimeter hazard warning stripes.
- **Procedural 16-Bit Pixel Art:** 100% procedurally generated textures with zero external image asset dependencies or 404 errors.
- **Dynamic Lighting & Shadows:** Directional sunlight with soft PCF shadows, emissive LED link lights, and GPU-instanced glowing packet streams.

### 4. 🔊 Synthesized Web Audio Experience
- **Zero-Dependency Sound Synthesizer (`src/utils/AudioManager.ts`):** Mechanical tactile clicks, RJ45 patch cable connection snaps, packet drop glitch buzzers, victory fanfare arpeggios, and a toggleable ambient cyberpunk synth drone.

### 5. 📱 Mobile & Desktop Responsive
- **Touch Gestures:** Pinch-to-zoom and smooth touch pan.
- **Adaptive Inspector:** Transforms into a slide-up bottom sheet on mobile screens with drag grab handles, and a side drawer on desktop.
- **Interactive Onboarding Tutorial:** 5-step guided walkthrough for first-time players.

---

## 🕹️ Controls Guide

| Action | Desktop (Mouse & Keyboard) | Mobile & Tablet (Touch) |
|---|---|---|
| **Pan Camera** | Middle-Click Drag, Right-Click Drag, or `Shift + Left-Click Drag` | Single Finger Drag |
| **Zoom In/Out** | Mouse Scroll Wheel | Two-Finger Pinch In / Out |
| **Inspect Node** | Left-Click Node | Tap Node |
| **Wire Cables** | Select **Wire** Tool $\rightarrow$ Click Node A $\rightarrow$ Click Node B | Select **Wire** Tool $\rightarrow$ Tap Node A $\rightarrow$ Tap Node B |
| **Rotate Node** | Click Rotate Button or press `R` | Tap Rotate in Inspector |
| **Move Node** | Select **Move** Tool $\rightarrow$ Click Node $\rightarrow$ Click Empty Tile | Select **Move** $\rightarrow$ Tap Node $\rightarrow$ Tap Empty Tile |

---

## 🏆 Game Modes

### 1. Free Homelab Sandbox
- Unlimited budget ($), all hardware unlocked, topology reset presets, and the **Chaos Monkey** fault injection drawer (sever random fiber cables, trigger 100G DDoS waves, or simulate server kernel panics).

### 2. Campaign Scenarios
1. **Level 1: First Homelab Setup** — Wire an unwired starter server rack from WAN Gateway $\rightarrow$ Firewall $\rightarrow$ Switch $\rightarrow$ Web Server without losing packets.
2. **Level 2: DDoS Scrubbing Center** — Incoming volumetric DDoS SYN floods from the WAN; configure Next-Gen Firewall ACL rules to protect the server buffer.
3. **Level 3: Load Balancing the Slashdot Effect** — High-concurrency traffic surge overflowing a single blade server; deploy second replica to distribute requests.
4. **Level 4: VLAN Database Isolation** — Segment sensitive database onto VLAN 20 and configure strict ACLs to isolate untrusted workstations while permitting legitimate web traffic.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Local Installation
```bash
# Clone the repository
git clone https://github.com/your-username/isopacket.git
cd isopacket

# Install dependencies
npm install

# Start local development server (Runs at http://localhost:3000)
npm run dev
```

### Running Automated Tests
```bash
# Execute pure TypeScript simulation & scenario test suite
npm test
```

### Building for Production
```bash
npm run build
```

---

## ☁️ Deploy to Vercel

IsoPacket is built as a pure client-side Single Page Application (SPA) with zero external database dependencies or API secrets.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the **Deploy with Vercel** button above.
2. Select your GitHub repository.
3. Keep default settings (`Build Command: npm run build`, `Output Directory: dist`).
4. Click **Deploy** — your interactive Cisco Homelab will be live globally in seconds!

---

## 📄 License
Licensed under the Apache License, Version 2.0.
