/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { NetworkPacket, PacketDropEvent } from '../../engine/types';
import { CatenaryCableSystem } from './CatenaryCableSystem';
import { gridToWorld } from './IsometricViewport';

const MAX_PACKETS = 1000;
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _forwardVec = new THREE.Vector3(0, 0, 1);
const _tangent = new THREE.Vector3();

interface SparkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

interface ShieldRipple {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class InstancedPacketSystem {
  public group = new THREE.Group();
  private instancedMesh: THREE.InstancedMesh;
  private sparks: SparkParticle[] = [];
  private sparkPointsMesh: THREE.Points;
  private sparkGeo: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkColors: Float32Array;
  private activeShields: ShieldRipple[] = [];

  constructor() {
    this.group.name = 'instanced_packet_system';

    // 1. Instanced Packet Mesh
    const packetGeo = new THREE.BoxGeometry(0.12, 0.12, 0.18);
    const packetMat = new THREE.MeshBasicMaterial({
      toneMapped: false,
    });

    this.instancedMesh = new THREE.InstancedMesh(packetGeo, packetMat, MAX_PACKETS);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    this.instancedMesh.count = 0;
    this.instancedMesh.frustumCulled = false;
    this.group.add(this.instancedMesh);

    // 2. Drop Spark Particle System
    const maxSparks = 250;
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(maxSparks * 3);
    this.sparkColors = new Float32Array(maxSparks * 3);

    this.sparkGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.sparkPositions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.sparkGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.sparkColors, 3).setUsage(THREE.DynamicDrawUsage)
    );

    const sparkMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkPointsMesh = new THREE.Points(this.sparkGeo, sparkMat);
    this.group.add(this.sparkPointsMesh);
  }

  /**
   * Spawn particle sparks and 3D firewall energy shield when packets drop
   */
  public triggerDropSparks(dropEvents: PacketDropEvent[]) {
    dropEvents.forEach((event) => {
      const { x, z } = gridToWorld(event.gridX, event.gridZ);
      const origin = new THREE.Vector3(x, 0.65, z);

      if (event.reason === 'firewall_drop') {
        // Spawn 3D Holographic Hexagonal Shield Barrier
        const shieldGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.6, 6, 1, true);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: '#ef4444',
          wireframe: true,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(x, 0.6, z);
        this.group.add(shieldMesh);

        this.activeShields.push({
          mesh: shieldMesh,
          life: 0,
          maxLife: 0.65,
        });

        // Spawn 16 high-energy sparks around shield
        for (let i = 0; i < 16; i++) {
          if (this.sparks.length >= 250) break;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3.5 + 2.0;
          this.sparks.push({
            pos: origin.clone(),
            vel: new THREE.Vector3(
              Math.cos(angle) * speed,
              Math.random() * 3.2 + 1.8,
              Math.sin(angle) * speed
            ),
            color: new THREE.Color(i % 2 === 0 ? '#ef4444' : '#38bdf8'),
            life: 0,
            maxLife: 0.5 + Math.random() * 0.3,
          });
        }
      } else {
        // Buffer overflow or route error sparks
        for (let i = 0; i < 8; i++) {
          if (this.sparks.length >= 250) break;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.2 + 1.2;
          this.sparks.push({
            pos: origin.clone(),
            vel: new THREE.Vector3(
              Math.cos(angle) * speed,
              Math.random() * 2.5 + 1.2,
              Math.sin(angle) * speed
            ),
            color: new THREE.Color(event.reason === 'buffer_overflow' ? '#f59e0b' : '#94a3b8'),
            life: 0,
            maxLife: 0.45 + Math.random() * 0.25,
          });
        }
      }
    });
  }

  /**
   * 60 FPS Render update for packets, shields & drop sparks
   */
  public update(
    packets: NetworkPacket[],
    cableSystem: CatenaryCableSystem,
    delta: number
  ) {
    // 1. Update Packet Instances along 3D curves
    let visibleCount = 0;

    for (let i = 0; i < packets.length && visibleCount < MAX_PACKETS; i++) {
      const pkt = packets[i];
      const curve = cableSystem.getCableCurve(pkt.currentCableId);
      if (!curve) continue;

      let t = pkt.cableDirection === 'forward' ? pkt.progressOnCable : 1.0 - pkt.progressOnCable;
      t = THREE.MathUtils.clamp(t, 0.001, 0.999);

      const pos = curve.getPointAt(t);
      curve.getTangentAt(t, _tangent);

      if (pkt.cableDirection === 'reverse') {
        _tangent.negate();
      }

      _dummy.position.copy(pos);
      _dummy.quaternion.setFromUnitVectors(_forwardVec, _tangent);

      const scale = pkt.protocol === 'DDOS' ? 1.4 : 1.0;
      _dummy.scale.set(scale, scale, scale * 1.5);
      _dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(visibleCount, _dummy.matrix);

      _color.set(pkt.color);
      _color.multiplyScalar(1.5);
      this.instancedMesh.setColorAt(visibleCount, _color);

      visibleCount++;
    }

    this.instancedMesh.count = visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // 2. Update Firewall Energy Shields
    for (let i = this.activeShields.length - 1; i >= 0; i--) {
      const shield = this.activeShields[i];
      shield.life += delta;
      if (shield.life >= shield.maxLife) {
        this.group.remove(shield.mesh);
        shield.mesh.geometry.dispose();
        (shield.mesh.material as THREE.Material).dispose();
        this.activeShields.splice(i, 1);
        continue;
      }

      const progress = shield.life / shield.maxLife;
      const scale = 1.0 + progress * 0.8;
      shield.mesh.scale.set(scale, scale * 0.8, scale);
      shield.mesh.rotation.y += delta * 4.0;
      (shield.mesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.9;
    }

    // 3. Update Drop Sparks Physics
    let sparkWriteIndex = 0;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += delta;
      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      s.vel.y -= 9.8 * delta;
      s.pos.addScaledVector(s.vel, delta);

      const progress = s.life / s.maxLife;
      const alpha = 1.0 - progress;

      this.sparkPositions[sparkWriteIndex * 3] = s.pos.x;
      this.sparkPositions[sparkWriteIndex * 3 + 1] = s.pos.y;
      this.sparkPositions[sparkWriteIndex * 3 + 2] = s.pos.z;

      this.sparkColors[sparkWriteIndex * 3] = s.color.r * alpha;
      this.sparkColors[sparkWriteIndex * 3 + 1] = s.color.g * alpha;
      this.sparkColors[sparkWriteIndex * 3 + 2] = s.color.b * alpha;

      sparkWriteIndex++;
    }

    for (let i = sparkWriteIndex; i < 250; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = -100;
      this.sparkPositions[i * 3 + 2] = 0;
    }

    const posAttr = this.sparkGeo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.sparkGeo.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach((m) => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
    this.sparkGeo.dispose();
    (this.sparkPointsMesh.material as THREE.Material).dispose();

    this.activeShields.forEach((shield) => {
      this.group.remove(shield.mesh);
      shield.mesh.geometry.dispose();
      (shield.mesh.material as THREE.Material).dispose();
    });
    this.activeShields = [];
  }
}
