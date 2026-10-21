/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { HardwareNodeType } from '../engine/types';

/**
 * PixelTextureFactory
 * Generates crisp 16-bit style HD-2D procedural textures on offscreen HTML5 canvases.
 * Applied with THREE.NearestFilter and zero mipmap blurring for pure retro-hardware fidelity.
 */
class PixelTextureFactoryClass {
  private cache = new Map<string, THREE.CanvasTexture>();

  /**
   * Helper to configure standard pixel-art texture properties
   */
  private configurePixelTexture(texture: THREE.CanvasTexture, isDataMap = false): THREE.CanvasTexture {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = isDataMap ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Raised Data Center Floor Tile (64x64)
   * High-tech raised floor panels with grounding rivets, corner screws, and ventilation micro-perforations.
   */
  getFloorTileTexture(variant: 'raised' | 'vent' | 'cable_tray' | 'hazard' = 'raised'): THREE.CanvasTexture {
    const key = `floor_${variant}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base dark slate metal
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, size, size);

    if (variant === 'raised') {
      // Inner panel bevel
      ctx.fillStyle = '#262f3e';
      ctx.fillRect(2, 2, size - 4, size - 4);

      // Subtle metallic noise grid
      ctx.fillStyle = '#1a202c';
      for (let y = 6; y < size - 6; y += 8) {
        for (let x = 6; x < size - 6; x += 8) {
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Corner rivets / grounding screws
      ctx.fillStyle = '#475569';
      const corners = [
        [4, 4],
        [size - 6, 4],
        [4, size - 6],
        [size - 6, size - 6],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.fillRect(cx, cy, 3, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx + 1, cy + 1, 1, 1);
        ctx.fillStyle = '#475569';
      });

      // Outer bezel line
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

      // Subtle cyan electrical trace
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(size / 2 - 1, 4, 2, size - 8);
      ctx.fillRect(4, size / 2 - 1, size - 8, 2);
    } else if (variant === 'vent') {
      // Perforated airflow cooling tile
      ctx.fillStyle = '#161d27';
      ctx.fillRect(2, 2, size - 4, size - 4);

      ctx.fillStyle = '#090d14';
      for (let y = 6; y < size - 6; y += 4) {
        for (let x = 6; x < size - 6; x += 4) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      ctx.strokeStyle = '#334155';
      ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    } else if (variant === 'hazard') {
      // Warning caution stripes
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#eab308';
      for (let i = -size; i < size * 2; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 8, 0);
        ctx.lineTo(i + 8 + size, size);
        ctx.lineTo(i + size, size);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.configurePixelTexture(texture);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Hover Cursor Highlight Tile (64x64)
   * High-visibility glowing isometric reticle for tile placement
   */
  getCursorTexture(isValid = true): THREE.CanvasTexture {
    const key = `cursor_${isValid ? 'valid' : 'invalid'}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const color = isValid ? '#38bdf8' : '#ef4444';
    const bg = isValid ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)';

    // Semitransparent fill
    ctx.fillStyle = bg;
    ctx.fillRect(2, 2, size - 4, size - 4);

    // Thick corner targeting brackets
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    const cornerLen = 14;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(2, 2 + cornerLen);
    ctx.lineTo(2, 2);
    ctx.lineTo(2 + cornerLen, 2);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(size - 2 - cornerLen, 2);
    ctx.lineTo(size - 2, 2);
    ctx.lineTo(size - 2, 2 + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(2, size - 2 - cornerLen);
    ctx.lineTo(2, size - 2);
    ctx.lineTo(2 + cornerLen, size - 2);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(size - 2 - cornerLen, size - 2);
    ctx.lineTo(size - 2, size - 2);
    ctx.lineTo(size - 2, size - 2 - cornerLen);
    ctx.stroke();

    // Center crosshair dot
    ctx.fillStyle = color;
    ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4);

    const texture = new THREE.CanvasTexture(canvas);
    this.configurePixelTexture(texture);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Hardware Node Front/Top/Side Pixel-Art Textures (128x128)
   * Detailed 16-bit retro enterprise gear with ports, rack ears, cooling vents, and status screens.
   */
  getHardwareTexture(type: HardwareNodeType, face: 'front' | 'top' | 'side' = 'front'): THREE.CanvasTexture {
    const key = `hw_${type}_${face}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (face === 'top') {
      this.drawHardwareTop(ctx, size, type);
    } else if (face === 'side') {
      this.drawHardwareSide(ctx, size, type);
    } else {
      this.drawHardwareFront(ctx, size, type);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.configurePixelTexture(texture);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Emissive Map for dynamic LED lighting & night-mode glow
   */
  getHardwareEmissiveTexture(type: HardwareNodeType): THREE.CanvasTexture {
    const key = `hw_${type}_emissive`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Black background (no emissive)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Render glowing LEDs in pure bright color on the black map
    this.drawHardwareEmissiveOverlay(ctx, size, type);

    const texture = new THREE.CanvasTexture(canvas);
    this.configurePixelTexture(texture, true);
    this.cache.set(key, texture);
    return texture;
  }

  /* ------------------- DRAWING HELPERS ------------------- */

  private drawHardwareFront(ctx: CanvasRenderingContext2D, s: number, type: HardwareNodeType) {
    // Standard 19-inch rack unit base chassis (Dark matte steel)
    ctx.fillStyle = '#1e222d';
    ctx.fillRect(0, 0, s, s);

    // Beveled chassis edge
    ctx.fillStyle = '#2d3342';
    ctx.fillRect(2, 2, s - 4, 4);
    ctx.fillStyle = '#13161c';
    ctx.fillRect(2, s - 6, s - 4, 4);

    // Rack mount ears on left and right with bolt holes
    ctx.fillStyle = '#333b4d';
    ctx.fillRect(0, 0, 10, s);
    ctx.fillRect(s - 10, 0, 10, s);

    ctx.fillStyle = '#0f1115';
    // Left ear screw
    ctx.fillRect(3, 12, 4, 4);
    ctx.fillRect(3, s - 16, 4, 4);
    // Right ear screw
    ctx.fillRect(s - 7, 12, 4, 4);
    ctx.fillRect(s - 7, s - 16, 4, 4);

    // Inner hardware faceplate
    const px = 12;
    const py = 8;
    const pw = s - 24;
    const ph = s - 16;

    switch (type) {
      case 'gateway':
        // WAN Gateway / Fiber ONT: Matte black with fiber optics and globe badge
        ctx.fillStyle = '#151922';
        ctx.fillRect(px, py, pw, ph);

        // Branding bar (Cyan)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + 4, py + 6, pw - 8, 4);

        // WAN Optical Port (illuminated)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 24, 20, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 12, py + 28, 12, 12);
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(px + 16, py + 32, 4, 4);

        // SFP+ Optical cage
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 36, py + 26, 16, 16);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 40, py + 30, 8, 8);

        // Status LED array (WAN, LAN, OPTICAL, PWR, ALARM)
        const gLeds = ['#10b981', '#38bdf8', '#10b981', '#10b981', '#ef4444'];
        gLeds.forEach((color, i) => {
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(px + 62 + i * 8, py + 28, 5, 5);
          ctx.fillStyle = color;
          ctx.fillRect(px + 63 + i * 8, py + 29, 3, 3);
        });

        // Air exhaust micro-slits
        ctx.fillStyle = '#0f172a';
        for (let y = py + 58; y < py + ph - 8; y += 6) {
          ctx.fillRect(px + 8, y, pw - 16, 2);
        }
        break;

      case 'router':
        // Core Router: Indigo-accented dual module bays
        ctx.fillStyle = '#1a1f2c';
        ctx.fillRect(px, py, pw, ph);

        // Top accent stripe
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(px + 4, py + 4, pw - 8, 3);

        // Console Serial Port (RJ-45 Light Blue)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + 6, py + 18, 14, 12);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 9, py + 22, 8, 6);

        // 4x Gigabit SFP+ Ports
        for (let i = 0; i < 4; i++) {
          const x = px + 26 + i * 18;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x, py + 16, 14, 16);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 2, py + 18, 10, 12);
          // Activity LED above port
          ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#f59e0b';
          ctx.fillRect(x + 5, py + 12, 4, 3);
        }

        // Modular Expansion Bay Plate
        ctx.fillStyle = '#11141c';
        ctx.fillRect(px + 6, py + 48, pw - 12, 48);
        ctx.strokeStyle = '#374151';
        ctx.strokeRect(px + 6, py + 48, pw - 12, 48);

        // CPU / Traffic bargraph
        for (let b = 0; b < 10; b++) {
          ctx.fillStyle = b < 6 ? '#10b981' : b < 8 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(px + 12 + b * 8, py + 60, 6, 10);
        }
        break;

      case 'switch':
        // Enterprise 24-Port L2 Switch (Dual 12-port rows)
        ctx.fillStyle = '#161d24';
        ctx.fillRect(px, py, pw, ph);

        // Emerald accent line
        ctx.fillStyle = '#059669';
        ctx.fillRect(px + 4, py + 4, pw - 8, 3);

        // Port Array (2 rows of 8 ports visible on panel)
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 8; col++) {
            const rx = px + 8 + col * 11;
            const ry = py + 16 + row * 16;
            // Metal port frame
            ctx.fillStyle = '#64748b';
            ctx.fillRect(rx, ry, 9, 12);
            // Black jack cavity
            ctx.fillStyle = '#090d14';
            ctx.fillRect(rx + 1, ry + 2, 7, 8);
            // LED indicator (top row green/amber)
            ctx.fillStyle = (col + row) % 3 === 0 ? '#10b981' : (col + row) % 5 === 0 ? '#f59e0b' : '#059669';
            ctx.fillRect(rx + 2, ry - 3, 5, 2);
          }
        }

        // Uplink 10G SFP+ Ports on the right
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + pw - 24, py + 16, 18, 28);
        ctx.fillStyle = '#000000';
        ctx.fillRect(px + pw - 21, py + 20, 12, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw - 18, py + 12, 6, 3);

        // Hexagonal cooling intake
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(px + 8, py + 56, pw - 16, 40);
        ctx.fillStyle = '#1e293b';
        for (let y = py + 60; y < py + 92; y += 5) {
          for (let x = px + 12; x < px + pw - 16; x += 6) {
            ctx.fillRect(x, y, 3, 3);
          }
        }
        break;

      case 'firewall':
        // Next-Gen Firewall: Crimson security chassis
        ctx.fillStyle = '#261214';
        ctx.fillRect(px, py, pw, ph);

        // Bold security red header
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px + 4, py + 4, pw - 8, 6);

        // Shield emblem
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.moveTo(px + 14, py + 18);
        ctx.lineTo(px + 24, py + 18);
        ctx.lineTo(px + 19, py + 28);
        ctx.closePath();
        ctx.fill();

        // WAN / LAN / DMZ segmented ports
        const zones = [
          { label: 'WAN', color: '#ef4444', x: px + 34 },
          { label: 'DMZ', color: '#f59e0b', x: px + 56 },
          { label: 'LAN', color: '#10b981', x: px + 78 },
        ];
        zones.forEach((z) => {
          ctx.fillStyle = z.color;
          ctx.fillRect(z.x, py + 14, 16, 3);
          ctx.fillStyle = '#475569';
          ctx.fillRect(z.x, py + 18, 16, 16);
          ctx.fillStyle = '#090d14';
          ctx.fillRect(z.x + 2, py + 21, 12, 11);
          // Port status light
          ctx.fillStyle = z.color;
          ctx.fillRect(z.x + 5, py + 36, 6, 3);
        });

        // Threat Mitigation Status Matrix (Blinking grid)
        ctx.fillStyle = '#100708';
        ctx.fillRect(px + 8, py + 48, pw - 16, 48);
        ctx.strokeStyle = '#7f1d1d';
        ctx.strokeRect(px + 8, py + 48, pw - 16, 48);

        // Active filter status readout
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 8; c++) {
            const lit = (r * 8 + c) % 4 !== 0;
            ctx.fillStyle = lit ? (c % 2 === 0 ? '#ef4444' : '#f87171') : '#3f1115';
            ctx.fillRect(px + 14 + c * 10, py + 56 + r * 9, 6, 5);
          }
        }
        break;

      case 'server':
        // High-density Web Server Blade: Dual CPU, 4 hot-swap drives
        ctx.fillStyle = '#181b22';
        ctx.fillRect(px, py, pw, ph);

        // Purple blade trim
        ctx.fillStyle = '#9333ea';
        ctx.fillRect(px + 4, py + 4, pw - 8, 3);

        // 4x Hot-Swap 2.5" Drive Caddies
        for (let d = 0; d < 4; d++) {
          const dy = py + 12 + d * 21;
          // Drive tray frame
          ctx.fillStyle = '#2e3544';
          ctx.fillRect(px + 6, dy, 52, 18);
          // Drive handle
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 10, dy + 4, 34, 10);
          // Activity & Power LEDs
          ctx.fillStyle = '#10b981'; // Green drive power
          ctx.fillRect(px + 48, dy + 4, 4, 4);
          ctx.fillStyle = '#38bdf8'; // Blue drive read/write
          ctx.fillRect(px + 48, dy + 10, 4, 4);
        }

        // Server diagnostics LCD display
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(px + 64, py + 14, 32, 16);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(px + 67, py + 18, 26, 8); // LCD backlit screen

        // Power switch & ID button
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + 72, py + 36, 8, 8);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 84, py + 36, 6, 6);

        // Honeycomb ventilation
        ctx.fillStyle = '#0b0d12';
        ctx.fillRect(px + 64, py + 50, 32, 44);
        ctx.fillStyle = '#1e2430';
        for (let hy = py + 54; hy < py + 90; hy += 6) {
          ctx.fillRect(px + 66, hy, 28, 2);
        }
        break;

      case 'database':
        // NVMe Database Node: Amber enterprise array with illuminated flash modules
        ctx.fillStyle = '#1f1b14';
        ctx.fillRect(px, py, pw, ph);

        // Amber storage accent
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 4, py + 4, pw - 8, 3);

        // 8x Enterprise NVMe SSD vertical caddies
        for (let i = 0; i < 8; i++) {
          const nx = px + 6 + i * 11;
          ctx.fillStyle = '#3b3323';
          ctx.fillRect(nx, py + 14, 9, 64);
          // Activity bar
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(nx + 2, py + 18, 5, 6);
          // Status light
          ctx.fillStyle = '#10b981';
          ctx.fillRect(nx + 2, py + 70, 5, 4);
        }

        // RAID Controller Status Unit
        ctx.fillStyle = '#120f09';
        ctx.fillRect(px + 6, py + 82, pw - 12, 16);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 10, py + 86, 20, 8);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 36, py + 88, 6, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 46, py + 88, 6, 4);
        break;

      case 'client':
        // Client / Workstation: Cyberpunk retro desktop terminal with CRT monitor & keyboard
        ctx.fillStyle = '#182026';
        ctx.fillRect(px, py, pw, ph);

        // Cyan bezel
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(px + 4, py + 4, pw - 8, 3);

        // Terminal Screen (Green Phosphor CRT glow)
        ctx.fillStyle = '#031a0e';
        ctx.fillRect(px + 12, py + 14, pw - 24, 46);
        ctx.strokeStyle = '#065f46';
        ctx.strokeRect(px + 12, py + 14, pw - 24, 46);

        // Terminal text lines (monochrome green)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 18, py + 22, 28, 3);
        ctx.fillRect(px + 18, py + 29, 44, 3);
        ctx.fillRect(px + 18, py + 36, 36, 3);
        ctx.fillRect(px + 18, py + 43, 14, 3); // blinking cursor block

        // Keyboard deck
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 8, py + 66, pw - 16, 26);
        ctx.fillStyle = '#0f172a';
        for (let ky = py + 70; ky < py + 88; ky += 5) {
          for (let kx = px + 12; kx < px + pw - 20; kx += 7) {
            ctx.fillRect(kx, ky, 5, 3);
          }
        }
        break;

      case 'pc':
        // Modern Workstation PC: Monitor + Mini Tower
        ctx.fillStyle = '#141822';
        ctx.fillRect(px, py, pw, ph);

        // Monitor frame & stand
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 6, py + 8, pw - 34, 52);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 10, py + 12, pw - 42, 44);

        // Screen code editor lines
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 14, py + 18, 28, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 20, py + 24, 34, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 20, py + 30, 22, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 14, py + 36, 30, 3);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(px + 14, py + 42, 18, 3);

        // Stand base
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 26, py + 60, 16, 8);
        ctx.fillRect(px + 20, py + 68, 28, 4);

        // Mini Tower Case on right
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + pw - 24, py + 14, 20, 68);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + pw - 22, py + 18, 16, 12);
        // Power button & USB
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw - 16, py + 34, 4, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + pw - 18, py + 42, 8, 2);
        ctx.fillRect(px + pw - 18, py + 47, 8, 2);
        break;

      case 'laptop':
        // Executive Laptop: Clamshell with keyboard and trackpad
        ctx.fillStyle = '#181f2b';
        ctx.fillRect(px, py, pw, ph);

        // Open display lid
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 8, py + 6, pw - 16, 46);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(px + 12, py + 10, pw - 24, 38);

        // Laptop screen UI dashboard
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(px + 16, py + 14, 24, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 16, py + 24, 40, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 16, py + 30, 32, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 16, py + 36, 20, 3);

        // Base keyboard deck
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 4, py + 54, pw - 8, 38);
        // Backlit keyboard grid
        ctx.fillStyle = '#0f172a';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 9; c++) {
            ctx.fillRect(px + 8 + c * 9, py + 58 + r * 5, 7, 3);
          }
        }
        // Trackpad
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + pw / 2 - 12, py + 80, 24, 10);
        break;

      case 'ipphone':
        // Cisco VoIP IP Phone: Angled chassis with handset and color display
        ctx.fillStyle = '#1e2430';
        ctx.fillRect(px, py, pw, ph);

        // Left Handset Cradle & Handset
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 4, py + 6, 24, ph - 12);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 6, py + 8, 20, 20); // Earpiece
        ctx.fillRect(px + 10, py + 28, 12, 38); // Handle
        ctx.fillRect(px + 6, py + 66, 20, 20); // Mouthpiece

        // Right IP Phone Console
        // Color LCD Display
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 32, py + 10, pw - 38, 32);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(px + 34, py + 12, pw - 42, 28);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(px + 38, py + 16, 24, 4); // Cisco Extension line
        ctx.fillStyle = '#34d399';
        ctx.fillRect(px + 38, py + 24, 18, 3); // Call status active

        // Numeric Keypad (3x4 buttons)
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(px + 34 + col * 14, py + 48 + row * 10, 10, 7);
          }
        }
        // Speakerphone / Mute LED
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + pw - 14, py + 78, 6, 6);
        break;

      case 'printer':
        // Office Laser Printer: Output tray, paper feed, LCD
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, pw, ph);

        // Dark grey side trims
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px, py, 6, ph);
        ctx.fillRect(px + pw - 6, py, 6, ph);

        // Paper output slot
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 10, py + 20, pw - 20, 14);
        // Printed sheet of paper poking out
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 16, py + 14, pw - 32, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 20, py + 16, pw - 40, 2);

        // Control Panel
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 10, py + 44, pw - 20, 20);
        // Small green LCD screen
        ctx.fillStyle = '#059669';
        ctx.fillRect(px + 14, py + 48, 28, 12);
        // Keypad
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 48, py + 50, 6, 6);
        ctx.fillRect(px + 58, py + 50, 6, 6);

        // Paper cassette bottom tray
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 10, py + 70, pw - 20, 18);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + pw / 2 - 12, py + 76, 24, 6);
        break;

      case 'camera':
        // Smart Security Camera: Dome with red night-vision ring
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py, pw, ph);

        // Mounting base plate
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 12, py + 6, pw - 24, 16);

        // Articulated ball joint
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 34, 14, 0, Math.PI * 2);
        ctx.fill();

        // Dark glass dome camera housing
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 58, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // High aperture lens center
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 58, 12, 0, Math.PI * 2);
        ctx.fill();

        // Red IR Night-Vision Ring
        ctx.fillStyle = '#ef4444';
        for (let a = 0; a < 8; a++) {
          const angle = (a / 8) * Math.PI * 2;
          const rx = px + pw / 2 + Math.cos(angle) * 16;
          const ry = py + 58 + Math.sin(angle) * 16;
          ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
        }
        break;

      case 'robot':
        // Autonomous Warehouse AGV Robot: Yellow hazard chassis with LIDAR
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(px, py, pw, ph);

        // Hazard striped bumper
        for (let b = 0; b < pw; b += 12) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(px + b, py + ph - 16);
          ctx.lineTo(px + b + 6, py + ph - 16);
          ctx.lineTo(px + b + 12, py + ph);
          ctx.lineTo(px + b + 6, py + ph);
          ctx.closePath();
          ctx.fill();
        }

        // Heavy-duty rubber tread wheels
        ctx.fillStyle = '#18181b';
        ctx.fillRect(px - 4, py + 20, 8, ph - 40);
        ctx.fillRect(px + pw - 4, py + 20, 8, ph - 40);

        // Center cargo payload turntable
        ctx.fillStyle = '#3f3f46';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 42, 22, 0, Math.PI * 2);
        ctx.fill();

        // Spinning 360 LIDAR puck dome
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 42, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw / 2 - 2, py + 38, 4, 8); // laser aperture

        // Status beacon & battery bar
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + 12, py + 12, 18, 6); // Battery 100%
        ctx.fillStyle = '#eab308';
        ctx.fillRect(px + pw - 24, py + 12, 12, 8); // Flashing beacon
        break;

      case 'ap':
        // Cisco Catalyst Wi-Fi 6 Access Point: Circular ceiling dome
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px, py, pw, ph);

        // Elegant slim chassis bevel
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

        // Center Cisco blue circular emblem
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, 16, 0, Math.PI * 2);
        ctx.fill();

        // Radiating Wi-Fi radio waves (Cyan/Blue)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        for (let r = 24; r <= 36; r += 6) {
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, r, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, r, Math.PI * 0.25, Math.PI * 0.75);
          ctx.stroke();
        }

        // Center LED status ring
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  private drawHardwareTop(ctx: CanvasRenderingContext2D, s: number, type: HardwareNodeType) {
    // Top cover lid: Brushed dark alloy with laser-etched cooling vents and serial tags
    ctx.fillStyle = '#212733';
    ctx.fillRect(0, 0, s, s);

    // Beveled lid plate
    ctx.fillStyle = '#2b3342';
    ctx.fillRect(4, 4, s - 8, s - 8);

    // Dark inset cooling grilles
    ctx.fillStyle = '#151921';
    ctx.fillRect(16, 16, s - 32, s - 32);

    // Perforations
    ctx.fillStyle = '#0c0f14';
    for (let y = 20; y < s - 20; y += 4) {
      for (let x = 20; x < s - 20; x += 4) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // High-tech circuit / trace accent
    ctx.strokeStyle = this.getTypeAccent(type);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(24, 8);
    ctx.lineTo(32, 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s - 8, s - 8);
    ctx.lineTo(s - 24, s - 8);
    ctx.lineTo(s - 32, s - 16);
    ctx.stroke();
  }

  private drawHardwareSide(ctx: CanvasRenderingContext2D, s: number, type: HardwareNodeType) {
    // Side panel with rack rail mounting channels
    ctx.fillStyle = '#1a1f29';
    ctx.fillRect(0, 0, s, s);

    // Slide rail channel
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(4, s / 2 - 8, s - 8, 16);
    ctx.fillStyle = '#333e52';
    ctx.fillRect(6, s / 2 - 4, s - 12, 8);

    // Mounting screw points
    ctx.fillStyle = '#94a3b8';
    [16, s / 2, s - 16].forEach((x) => {
      ctx.fillRect(x - 2, s / 2 - 2, 4, 4);
    });

    // Side ventilation slots
    ctx.fillStyle = '#0c0e14';
    for (let x = 12; x < s - 12; x += 6) {
      ctx.fillRect(x, 14, 3, 20);
      ctx.fillRect(x, s - 34, 3, 20);
    }
  }

  private drawHardwareEmissiveOverlay(ctx: CanvasRenderingContext2D, s: number, type: HardwareNodeType) {
    const px = 12;
    const py = 8;
    const pw = s - 24;
    const ph = s - 16;

    switch (type) {
      case 'gateway':
        // Optical port glow & fiber link LEDs
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 12, py + 28, 12, 12);
        const gLeds = ['#10b981', '#38bdf8', '#10b981', '#10b981', '#ef4444'];
        gLeds.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(px + 63 + i * 8, py + 29, 3, 3);
        });
        break;

      case 'router':
        // Port LEDs & bargraph
        for (let i = 0; i < 4; i++) {
          const x = px + 26 + i * 18;
          ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#f59e0b';
          ctx.fillRect(x + 5, py + 12, 4, 3);
        }
        for (let b = 0; b < 10; b++) {
          ctx.fillStyle = b < 6 ? '#10b981' : b < 8 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(px + 12 + b * 8, py + 60, 6, 10);
        }
        break;

      case 'switch':
        // Switch port activity blinkers
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 8; col++) {
            const rx = px + 8 + col * 11;
            const ry = py + 16 + row * 16;
            ctx.fillStyle = (col + row) % 3 === 0 ? '#10b981' : (col + row) % 5 === 0 ? '#f59e0b' : '#059669';
            ctx.fillRect(rx + 2, ry - 3, 5, 2);
          }
        }
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw - 18, py + 12, 6, 3);
        break;

      case 'firewall':
        // Firewall alert LEDs & rule matrix
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 34 + 5, py + 36, 6, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 56 + 5, py + 36, 6, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 78 + 5, py + 36, 6, 3);

        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 8; c++) {
            const lit = (r * 8 + c) % 4 !== 0;
            if (lit) {
              ctx.fillStyle = c % 2 === 0 ? '#ef4444' : '#f87171';
              ctx.fillRect(px + 14 + c * 10, py + 56 + r * 9, 6, 5);
            }
          }
        }
        break;

      case 'server':
        // Drive status LEDs & LCD screen
        for (let d = 0; d < 4; d++) {
          const dy = py + 12 + d * 21;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + 48, dy + 4, 4, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 48, dy + 10, 4, 4);
        }
        ctx.fillStyle = '#34d399';
        ctx.fillRect(px + 67, py + 18, 26, 8);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + 72, py + 36, 8, 8);
        break;

      case 'database':
        // NVMe drive status columns
        for (let i = 0; i < 8; i++) {
          const nx = px + 6 + i * 11;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(nx + 2, py + 18, 5, 6);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(nx + 2, py + 70, 5, 4);
        }
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 10, py + 86, 20, 8);
        break;

      case 'client':
        // Terminal screen phosphor green glow
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 14, py + 16, pw - 28, 42);
        break;

      case 'pc':
        // Monitor screen glow + power LED
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 10, py + 12, pw - 42, 44);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + pw - 16, py + 34, 4, 4);
        break;

      case 'laptop':
        // Laptop screen and keyboard glow
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(px + 12, py + 10, pw - 24, 38);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 8, py + 58, pw - 16, 20);
        break;

      case 'ipphone':
        // Phone LCD backlight & speaker LED
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 34, py + 12, pw - 42, 28);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + pw - 14, py + 78, 6, 6);
        break;

      case 'printer':
        // Printer status green LED & display
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 14, py + 48, 28, 12);
        break;

      case 'camera':
        // Night-vision IR ring & lens reflection
        ctx.fillStyle = '#ef4444';
        for (let a = 0; a < 8; a++) {
          const angle = (a / 8) * Math.PI * 2;
          const rx = px + pw / 2 + Math.cos(angle) * 16;
          const ry = py + 58 + Math.sin(angle) * 16;
          ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
        }
        break;

      case 'robot':
        // LIDAR laser aperture & orange flashing beacon
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw / 2 - 2, py + 38, 4, 8);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(px + pw - 24, py + 12, 12, 8);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + 12, py + 12, 18, 6);
        break;

      case 'ap':
        // Wi-Fi 6 status halo & center blue logo
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pw / 2 - 6, py + ph / 2 - 6, 12, 12);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + pw / 2 - 3, py + ph / 2 - 3, 6, 6);
        break;
    }
  }

  private getTypeAccent(type: HardwareNodeType): string {
    switch (type) {
      case 'gateway': return '#38bdf8';
      case 'router': return '#6366f1';
      case 'switch': return '#10b981';
      case 'firewall': return '#ef4444';
      case 'server': return '#a855f7';
      case 'database': return '#f59e0b';
      case 'client': return '#06b6d4';
      case 'pc': return '#38bdf8';
      case 'laptop': return '#22d3ee';
      case 'ipphone': return '#34d399';
      case 'printer': return '#94a3b8';
      case 'camera': return '#fb7185';
      case 'robot': return '#facc15';
      case 'ap': return '#0ea5e9';
    }
  }
}

export const PixelTextureFactory = new PixelTextureFactoryClass();
