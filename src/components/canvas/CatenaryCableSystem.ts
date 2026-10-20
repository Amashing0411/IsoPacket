/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CableConnection, PlacedNode } from '../../engine/types';
import { gridToWorld } from './IsometricViewport';

export interface CableRenderObject {
  cableId: string;
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  material: THREE.MeshStandardMaterial;
  tubeMesh: THREE.Mesh;
  fromNodeId: string;
  toNodeId: string;
}

export class CatenaryCableSystem {
  public group = new THREE.Group();
  private cableObjects = new Map<string, CableRenderObject>();
  private bootGeometry = new THREE.BoxGeometry(0.12, 0.1, 0.18);
  private ledGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);

  // Materials
  private bootMaterial = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.6,
    metalness: 0.3,
  });

  private activeLedMaterial = new THREE.MeshBasicMaterial({
    color: '#10b981',
  });

  constructor() {
    this.group.name = 'catenary_cables';
  }

  /**
   * Calculate a natural catenary 3D curve with sag under gravity
   */
  public static calculateCurve(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3
  ): THREE.CatmullRomCurve3 {
    const dist = fromPos.distanceTo(toPos);
    // Sag proportional to distance, minimum 0.25, max 1.1
    const sag = Math.min(1.2, Math.max(0.28, dist * 0.14));

    // Mid points with catenary droop
    const mid1 = new THREE.Vector3(
      fromPos.x * 0.7 + toPos.x * 0.3,
      Math.min(fromPos.y, toPos.y) - sag * 0.75,
      fromPos.z * 0.7 + toPos.z * 0.3
    );

    const mid2 = new THREE.Vector3(
      fromPos.x * 0.3 + toPos.x * 0.7,
      Math.min(fromPos.y, toPos.y) - sag * 0.75,
      fromPos.z * 0.3 + toPos.z * 0.7
    );

    // Ensure lowest droop doesn't clip through floor (y > 0.12)
    mid1.y = Math.max(0.12, mid1.y);
    mid2.y = Math.max(0.12, mid2.y);

    return new THREE.CatmullRomCurve3([fromPos, mid1, mid2, toPos]);
  }

  /**
   * Get port connection point in world space for a node
   */
  public static getNodePortWorldPos(
    node: PlacedNode,
    isTarget = false
  ): THREE.Vector3 {
    const { x, z } = gridToWorld(node.gridX, node.gridZ);
    // Node center height is approx 0.45, offset slightly toward edge for port
    const y = 0.42;
    const offsetZ = isTarget ? -0.25 : 0.25;
    return new THREE.Vector3(x, y, z + offsetZ);
  }

  /**
   * Sync cable meshes with latest topology
   */
  public syncCables(
    cables: CableConnection[],
    nodeMap: Map<string, PlacedNode>
  ) {
    const activeCableIds = new Set(cables.map((c) => c.id));

    // Remove vanished cables
    for (const [id, obj] of this.cableObjects.entries()) {
      if (!activeCableIds.has(id)) {
        this.group.remove(obj.group);
        obj.tubeMesh.geometry.dispose();
        obj.material.dispose();
        this.cableObjects.delete(id);
      }
    }

    // Add or update cables
    for (const cable of cables) {
      const nodeA = nodeMap.get(cable.fromNodeId);
      const nodeB = nodeMap.get(cable.toNodeId);
      if (!nodeA || !nodeB) continue;

      const pA = CatenaryCableSystem.getNodePortWorldPos(nodeA, false);
      const pB = CatenaryCableSystem.getNodePortWorldPos(nodeB, true);
      const curve = CatenaryCableSystem.calculateCurve(pA, pB);

      let obj = this.cableObjects.get(cable.id);

      if (!obj) {
        // Create new cable object
        const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.042, 8, false);
        const material = new THREE.MeshStandardMaterial({
          color: cable.color,
          roughness: 0.45,
          metalness: 0.4,
          emissive: new THREE.Color(cable.color),
          emissiveIntensity: 0.15,
        });

        const tubeMesh = new THREE.Mesh(tubeGeo, material);
        tubeMesh.castShadow = true;
        tubeMesh.receiveShadow = true;

        const cableGroup = new THREE.Group();
        cableGroup.add(tubeMesh);

        // RJ-45 Boots and Port Status LEDs at ends
        const bootA = new THREE.Mesh(this.bootGeometry, this.bootMaterial);
        bootA.position.copy(pA);
        cableGroup.add(bootA);

        const bootB = new THREE.Mesh(this.bootGeometry, this.bootMaterial);
        bootB.position.copy(pB);
        cableGroup.add(bootB);

        const ledA = new THREE.Mesh(this.ledGeometry, this.activeLedMaterial);
        ledA.position.set(pA.x, pA.y + 0.08, pA.z);
        cableGroup.add(ledA);

        const ledB = new THREE.Mesh(this.ledGeometry, this.activeLedMaterial);
        ledB.position.set(pB.x, pB.y + 0.08, pB.z);
        cableGroup.add(ledB);

        this.group.add(cableGroup);

        obj = {
          cableId: cable.id,
          group: cableGroup,
          curve,
          material,
          tubeMesh,
          fromNodeId: cable.fromNodeId,
          toNodeId: cable.toNodeId,
        };
        this.cableObjects.set(cable.id, obj);
      } else {
        // Update existing geometry if nodes moved
        obj.tubeMesh.geometry.dispose();
        obj.tubeMesh.geometry = new THREE.TubeGeometry(curve, 28, 0.042, 8, false);
        obj.curve = curve;
        obj.material.color.set(cable.color);
      }
    }
  }

  public getCableCurve(cableId: string): THREE.CatmullRomCurve3 | undefined {
    return this.cableObjects.get(cableId)?.curve;
  }

  public dispose() {
    for (const [, obj] of this.cableObjects) {
      this.group.remove(obj.group);
      obj.tubeMesh.geometry.dispose();
      obj.material.dispose();
    }
    this.cableObjects.clear();
    this.bootGeometry.dispose();
    this.ledGeometry.dispose();
    this.bootMaterial.dispose();
    this.activeLedMaterial.dispose();
  }
}
