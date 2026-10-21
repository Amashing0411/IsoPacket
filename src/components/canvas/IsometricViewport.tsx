/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useTopologyStore, GRID_SIZE, TILE_SIZE } from '../../state/useTopologyStore';
import { useSimulationStore } from '../../state/useSimulationStore';
import { globalSimulationEngine } from '../../engine/SimulationEngine';
import { PixelTextureFactory } from '../../assets/PixelTextureFactory';
import { PlacedNode, CableConnection } from '../../engine/types';
import { CatenaryCableSystem } from './CatenaryCableSystem';
import { InstancedPacketSystem } from './InstancedPacketSystem';
import { useScenarioStore } from '../../state/useScenarioStore';
import { AudioManager } from '../../utils/AudioManager';
import { globalDefenseEngine } from '../../engine/DefenseEngine';
import { useGameModeStore } from '../../state/useGameModeStore';
import { SoundFX } from '../../audio/SoundFX';

// Pre-allocated reusable math objects to avoid GC in animation loop
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _intersectPoint = new THREE.Vector3();
const _panStart = new THREE.Vector2();
const _panDelta = new THREE.Vector2();

export function gridToWorld(gx: number, gz: number): { x: number; z: number } {
  return {
    x: (gx - GRID_SIZE / 2 + 0.5) * TILE_SIZE,
    z: (gz - GRID_SIZE / 2 + 0.5) * TILE_SIZE,
  };
}

export function worldToGrid(wx: number, wz: number): { gx: number; gz: number } {
  return {
    gx: Math.floor(wx / TILE_SIZE + GRID_SIZE / 2),
    gz: Math.floor(wz / TILE_SIZE + GRID_SIZE / 2),
  };
}

export const IsometricViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Read state hooks
  const nodes = useTopologyStore((s) => s.nodes);
  const cables = useTopologyStore((s) => s.cables);
  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const activeTool = useTopologyStore((s) => s.activeTool);
  const wiringSourceNodeId = useTopologyStore((s) => s.wiringSourceNodeId);
  const showGrid = useTopologyStore((s) => s.showGrid);
  const showShadows = useTopologyStore((s) => s.showShadows);

  // Actions
  const setSelectedNodeId = useTopologyStore((s) => s.setSelectedNodeId);
  const setHoverTile = useTopologyStore((s) => s.setHoverTile);
  const setWiringSourceNodeId = useTopologyStore((s) => s.setWiringSourceNodeId);
  const addNode = useTopologyStore((s) => s.addNode);
  const moveNode = useTopologyStore((s) => s.moveNode);
  const deleteNode = useTopologyStore((s) => s.deleteNode);
  const addCable = useTopologyStore((s) => s.addCable);

  // Store latest refs to avoid re-binding event listeners
  const stateRef = useRef({
    nodes,
    cables,
    selectedNodeId,
    activeTool,
    wiringSourceNodeId,
    movingNodeId: null as string | null,
    showGrid,
    showShadows,
  });

  useEffect(() => {
    stateRef.current = {
      nodes,
      cables,
      selectedNodeId,
      activeTool,
      wiringSourceNodeId,
      movingNodeId: stateRef.current.movingNodeId,
      showGrid,
      showShadows,
    };
    // Sync simulation engine with updated topology
    globalSimulationEngine.updateTopology(nodes, cables);
  }, [nodes, cables, selectedNodeId, activeTool, wiringSourceNodeId, showGrid, showShadows]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene, Camera & Renderer Setup ---
    const scene = new THREE.Scene();
    // High-tech sleek NOC datacenter background (soft dark slate blue, high contrast against tiles)
    scene.background = new THREE.Color('#0d1527');
    scene.fog = new THREE.Fog('#0d1527', 260, 520);

    const aspect = container.clientWidth / container.clientHeight;
    // Calibrated orthographic frustum: base 32 units matches 32x32 isometric grid prominently
    const baseFrustum = 32;
    const frustumSize = aspect < 1.35 ? baseFrustum * (1.35 / aspect) : baseFrustum;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      600
    );

    // Locked Crisp Isometric Perspective: position (28, 32, 28) looking at (0, 0, 0)
    const ISO_X = 28;
    const ISO_Y = 32;
    const ISO_Z = 28;
    camera.position.set(ISO_X, ISO_Y, ISO_Z);
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    const targetCameraPos = new THREE.Vector3(ISO_X, ISO_Y, ISO_Z);
    camera.lookAt(cameraTarget);
    camera.zoom = 1.05;
    let targetZoom = 1.05;

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0; // Bright, luminous dynamic range
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.08).texture;
    pmremGenerator.dispose();

    // --- 2. High-Clarity Datacenter Lighting Rig ---
    // Warm ambient foundation
    const ambientLight = new THREE.AmbientLight('#e2e8f0', 2.3);
    scene.add(ambientLight);

    // Primary key directional sun
    const dirLight = new THREE.DirectionalLight('#ffffff', 3.4);
    dirLight.position.set(50, 80, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 220;
    const shadowD = 55;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // Cyber blue fill light from opposing angle (eliminates pitch-black shadows)
    const fillLight = new THREE.DirectionalLight('#38bdf8', 1.6);
    fillLight.position.set(-45, 60, -35);
    scene.add(fillLight);

    // Soft sky-to-ground hemisphere light
    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#334155', 1.8);
    scene.add(hemiLight);

    // Violet rim accent light
    const rimLight = new THREE.DirectionalLight('#c084fc', 1.3);
    rimLight.position.set(-35, 45, 50);
    scene.add(rimLight);

    // --- 3. Floor Grid Generation ---
    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    const tileGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.96, TILE_SIZE * 0.96);
    tileGeo.rotateX(-Math.PI / 2);

    const raisedTex = PixelTextureFactory.getFloorTileTexture('raised');
    const ventTex = PixelTextureFactory.getFloorTileTexture('vent');
    const hazardTex = PixelTextureFactory.getFloorTileTexture('hazard');

    const floorMaterials = {
      raised: new THREE.MeshStandardMaterial({
        map: raisedTex,
        roughness: 0.42,
        metalness: 0.22,
      }),
      vent: new THREE.MeshStandardMaterial({
        map: ventTex,
        roughness: 0.52,
        metalness: 0.22,
      }),
      hazard: new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.38,
        metalness: 0.28,
      }),
    };

    for (let gz = 0; gz < GRID_SIZE; gz++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const { x, z } = gridToWorld(gx, gz);
        let mat = floorMaterials.raised;
        // Strict Hazard Borders: only border the absolute outer edges of the 32x32 grid
        if (gx === 0 || gx === GRID_SIZE - 1 || gz === 0 || gz === GRID_SIZE - 1) {
          mat = floorMaterials.hazard;
        } else if ((gx % 6 === 0 && gz % 3 === 0) || (gz % 6 === 0 && gx % 3 === 0)) {
          mat = floorMaterials.vent;
        }

        const tileMesh = new THREE.Mesh(tileGeo, mat);
        tileMesh.position.set(x, 0, z);
        tileMesh.receiveShadow = true;
        floorGroup.add(tileMesh);
      }
    }

    // Outer concrete sub-floor
    const subFloorGeo = new THREE.BoxGeometry(
      GRID_SIZE * TILE_SIZE + 4,
      0.8,
      GRID_SIZE * TILE_SIZE + 4
    );
    const subFloorMat = new THREE.MeshStandardMaterial({
      color: '#162032',
      roughness: 0.75,
      metalness: 0.15,
    });
    const subFloorMesh = new THREE.Mesh(subFloorGeo, subFloorMat);
    subFloorMesh.position.set(0, -0.42, 0);
    subFloorMesh.receiveShadow = true;
    scene.add(subFloorMesh);

    // --- 4. Hover Reticle / Placement Cursor ---
    const cursorGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    cursorGeo.rotateX(-Math.PI / 2);
    const cursorValidTex = PixelTextureFactory.getCursorTexture(true);
    const cursorInvalidTex = PixelTextureFactory.getCursorTexture(false);

    const cursorMat = new THREE.MeshBasicMaterial({
      map: cursorValidTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.position.set(0, 0.03, 0);
    cursorMesh.visible = false;
    scene.add(cursorMesh);

    // Ghost Cable Preview for Wiring Tool
    const ghostCableMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    let ghostTubeMesh: THREE.Mesh | null = null;

    // --- 5. 3D Systems (Cables & Packets) ---
    const cableSystem = new CatenaryCableSystem();
    scene.add(cableSystem.group);

    const packetSystem = new InstancedPacketSystem();
    scene.add(packetSystem.group);

    // Dynamic Node Meshes Group
    const nodeMeshesGroup = new THREE.Group();
    scene.add(nodeMeshesGroup);

    // Dedicated Defense Entity Groups
    const coreMonolithGroup = new THREE.Group();
    scene.add(coreMonolithGroup);

    const defenseBotsGroup = new THREE.Group();
    scene.add(defenseBotsGroup);

    const defenseEnemiesGroup = new THREE.Group();
    scene.add(defenseEnemiesGroup);

    const defenseBeamsGroup = new THREE.Group();
    scene.add(defenseBeamsGroup);

    const defenseOrbsGroup = new THREE.Group();
    scene.add(defenseOrbsGroup);

    const activeNodeGroups = new Map<string, THREE.Group>();
    const activeBotMeshes = new Map<string, THREE.Group>();
    const activeEnemyMeshes = new Map<string, THREE.Group>();
    const activeOrbMeshes = new Map<string, THREE.Group>();

    // --- Core Mainframe Setup (Center of map: grid 16, 16 -> world 0, 0) ---
    function buildCoreMainframe(): THREE.Group {
      const coreGroup = new THREE.Group();
      coreGroup.name = 'core_mainframe_monolith';
      const { x, z } = gridToWorld(16, 16);
      coreGroup.position.set(x, 0, z);

      // Base Platform
      const baseGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.25, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.4,
        metalness: 0.8,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.125;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      coreGroup.add(baseMesh);

      // Tier 1 Obelisk Tower
      const t1Geo = new THREE.CylinderGeometry(1.1, 1.35, 0.9, 8);
      const t1Mat = new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.3,
        metalness: 0.7,
      });
      const t1Mesh = new THREE.Mesh(t1Geo, t1Mat);
      t1Mesh.position.y = 0.25 + 0.45;
      t1Mesh.castShadow = true;
      coreGroup.add(t1Mesh);

      // Tier 2 Server Slices
      const t2Geo = new THREE.CylinderGeometry(0.8, 1.0, 0.8, 8);
      const t2Mat = new THREE.MeshStandardMaterial({
        color: '#1e1b4b',
        roughness: 0.2,
        metalness: 0.85,
      });
      const t2Mesh = new THREE.Mesh(t2Geo, t2Mat);
      t2Mesh.position.y = 1.15 + 0.4;
      t2Mesh.castShadow = true;
      coreGroup.add(t2Mesh);

      // Glowing Inner Core Reactor Crystal
      const reactorGeo = new THREE.OctahedronGeometry(0.42, 0);
      const reactorMat = new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        wireframe: false,
      });
      const reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
      reactorMesh.name = 'core_reactor_crystal';
      reactorMesh.position.y = 2.15;
      coreGroup.add(reactorMesh);

      // Revolving Data Ring 1
      const ring1Geo = new THREE.TorusGeometry(0.65, 0.04, 8, 32);
      ring1Geo.rotateX(Math.PI / 2);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.name = 'core_holo_ring_1';
      ring1.position.y = 2.15;
      coreGroup.add(ring1);

      // Revolving Data Ring 2
      const ring2Geo = new THREE.TorusGeometry(0.85, 0.035, 8, 32);
      ring2Geo.rotateX(Math.PI / 3);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: '#818cf8' });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.name = 'core_holo_ring_2';
      ring2.position.y = 2.15;
      coreGroup.add(ring2);

      // Dynamic Core HP Floor Ring (emissive, changes color with health)
      const hpRingGeo = new THREE.RingGeometry(2.2, 2.45, 48);
      hpRingGeo.rotateX(-Math.PI / 2);
      const hpRingMat = new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const hpRing = new THREE.Mesh(hpRingGeo, hpRingMat);
      hpRing.name = 'core_hp_floor_ring';
      hpRing.position.y = 0.03;
      coreGroup.add(hpRing);

      return coreGroup;
    }

    coreMonolithGroup.add(buildCoreMainframe());

    // --- Distinct Procedural Hardware Silhouette Builder ---
    function buildNodeMeshGroup(node: PlacedNode): THREE.Group {
      const group = new THREE.Group();
      group.name = node.id;
      group.userData = { nodeId: node.id };

      const { x, z } = gridToWorld(node.gridX, node.gridZ);
      group.position.set(x, 0, z);
      group.rotation.y = node.rotation;

      // Contact Shadow Plane
      const shadowGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.position.y = 0.015;
      group.add(shadowMesh);

      const baseW = TILE_SIZE * 0.75;
      const baseD = TILE_SIZE * 0.65;
      const frontTex = PixelTextureFactory.getHardwareTexture(node.type, 'front');
      const topTex = PixelTextureFactory.getHardwareTexture(node.type, 'top');
      const sideTex = PixelTextureFactory.getHardwareTexture(node.type, 'side');
      const emissiveTex = PixelTextureFactory.getHardwareEmissiveTexture(node.type);

      const standardChassisMat = [
        new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.65, metalness: 0.45 }),
        new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.65, metalness: 0.45 }),
        new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.55, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: '#11141c', roughness: 0.9 }),
        new THREE.MeshStandardMaterial({
          map: frontTex,
          emissiveMap: emissiveTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.9,
          roughness: 0.45,
          metalness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ color: '#161a23', roughness: 0.8 }),
      ];

      // --- Distinct Silhouette per Node Type & Tier 3 Branches ---
      const isPowered = node.isPowered !== false;
      const tier = node.tier || 1;
      const branch = node.tier3Branch;

      if (node.type === 'flak') {
        // --- 1. DPI FLAK CANNON (Rapid Swarm Shredder) ---
        const baseGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.22, 16);
        const baseMat = new THREE.MeshStandardMaterial({
          color: '#1e293b',
          roughness: 0.3,
          metalness: 0.85,
        });
        const baseM = new THREE.Mesh(baseGeo, baseMat);
        baseM.position.y = 0.11 + 0.05;
        group.add(baseM);

        const turretHead = new THREE.Group();
        turretHead.name = 'turret_head';
        turretHead.position.set(0, 0.26, 0);

        if (!isPowered) {
          turretHead.rotation.x = 0.38; // Droop down when unpowered / starved
        }

        const swivelGeo = new THREE.BoxGeometry(0.32, 0.24, 0.36);
        const swivelMat = new THREE.MeshStandardMaterial({
          color: branch === 'gatling_scrubber' ? '#c2410c' : '#ea580c',
          roughness: 0.3,
          metalness: 0.8,
        });
        const swivelMesh = new THREE.Mesh(swivelGeo, swivelMat);
        turretHead.add(swivelMesh);

        // Barrels: Quad if Gatling, Decryption dish if Decryption Array, Dual otherwise
        if (branch === 'gatling_scrubber') {
          // Quad Gatling Barrels
          const bGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8);
          bGeo.rotateX(Math.PI / 2);
          const bMat = new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.95 });
          const offsets = [
            [-0.08, 0.08],
            [0.08, 0.08],
            [-0.08, -0.04],
            [0.08, -0.04],
          ];
          offsets.forEach(([bx, by]) => {
            const b = new THREE.Mesh(bGeo, bMat);
            b.position.set(bx, by, 0.32);
            turretHead.add(b);
          });
        } else if (branch === 'decryption_array') {
          // Decryption Satellite Radar Array
          const dishGeo = new THREE.SphereGeometry(0.28, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
          dishGeo.rotateX(Math.PI / 2 + 0.3);
          const dishMat = new THREE.MeshStandardMaterial({ color: '#22c55e', metalness: 0.85 });
          const dish = new THREE.Mesh(dishGeo, dishMat);
          dish.position.set(0, 0.16, 0.2);
          turretHead.add(dish);
        } else {
          // Dual Motorized Flak Barrels
          const bGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
          bGeo.rotateX(Math.PI / 2);
          const bMat = new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.95 });
          const bLeft = new THREE.Mesh(bGeo, bMat);
          bLeft.position.set(-0.11, 0.04, 0.3);
          const bRight = bLeft.clone();
          bRight.position.x = 0.11;
          turretHead.add(bLeft, bRight);
        }

        group.add(turretHead);
      } else if (node.type === 'firewall') {
        // --- 2. FIREWALL SCRUBBER (Heavy Thermal Plasma Beam) ---
        const fwBaseGeo = new THREE.BoxGeometry(baseW, 0.42, baseD);
        const fwBaseMesh = new THREE.Mesh(fwBaseGeo, standardChassisMat);
        fwBaseMesh.position.y = 0.21 + 0.05;
        fwBaseMesh.castShadow = true;
        group.add(fwBaseMesh);

        // Heavy Armor Skirts
        const armorMat = new THREE.MeshStandardMaterial({
          color: branch === 'stateful_plasma' ? '#7f1d1d' : '#334155',
          roughness: 0.3,
          metalness: 0.8,
        });
        const leftArmor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, baseD * 0.9), armorMat);
        leftArmor.position.set(-baseW / 2 - 0.06, 0.25, 0);
        leftArmor.rotation.z = 0.2;
        group.add(leftArmor);

        const rightArmor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, baseD * 0.9), armorMat);
        rightArmor.position.set(baseW / 2 + 0.06, 0.25, 0);
        rightArmor.rotation.z = -0.2;
        group.add(rightArmor);

        // Air-Gapped Barricade Side Shields
        if (branch === 'air_gap_barricade') {
          const barrierMat = new THREE.MeshBasicMaterial({
            color: '#06b6d4',
            transparent: true,
            opacity: 0.75,
          });
          const leftBarrier = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.6), barrierMat);
          leftBarrier.position.set(-baseW / 2 - 0.18, 0.35, 0);
          leftBarrier.rotation.y = Math.PI / 2;
          group.add(leftBarrier);

          const rightBarrier = leftBarrier.clone();
          rightBarrier.position.x = baseW / 2 + 0.18;
          group.add(rightBarrier);
        }

        const turretHead = new THREE.Group();
        turretHead.name = 'turret_head';
        turretHead.position.set(0, 0.48, 0);

        if (!isPowered) {
          turretHead.rotation.x = 0.38; // Droop when unpowered
        }

        const gimbalMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.4, 0.18, 16),
          new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.85 })
        );
        turretHead.add(gimbalMesh);

        // Plasma Emitter Nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 12);
        nozzleGeo.rotateX(Math.PI / 2);
        const nozzleMat = new THREE.MeshStandardMaterial({
          color: branch === 'stateful_plasma' ? '#f97316' : '#ef4444',
          metalness: 0.9,
        });
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, 0.08, 0.28);
        turretHead.add(nozzle);

        group.add(turretHead);
      } else if (node.type === 'railgun') {
        // --- 3. NEXT-GEN IPS RAILGUN (Ultra Long-Range Sniper) ---
        const mastGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.85, 12);
        const mast = new THREE.Mesh(
          mastGeo,
          new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.85 })
        );
        mast.position.y = 0.45;
        group.add(mast);

        const turretHead = new THREE.Group();
        turretHead.name = 'turret_head';
        turretHead.position.set(0, 0.92, 0);

        if (!isPowered) {
          turretHead.rotation.x = 0.42; // Droop when unpowered
        }

        // Long Accelerator Rail Barrels
        const railLength = branch === 'hyper_railgun' ? 1.4 : 0.85;
        const railGeo = new THREE.BoxGeometry(0.06, 0.08, railLength);
        const railMat = new THREE.MeshStandardMaterial({
          color: branch === 'zero_day_emp' ? '#06b6d4' : '#8b5cf6',
          metalness: 0.95,
        });
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(-0.06, 0, railLength / 2 - 0.1);
        const rightRail = leftRail.clone();
        rightRail.position.x = 0.06;
        turretHead.add(leftRail, rightRail);

        // Capacitor Bank
        const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12);
        const capMat = new THREE.MeshBasicMaterial({
          color: branch === 'zero_day_emp' ? '#22d3ee' : '#a855f7',
        });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.08, 0);
        turretHead.add(cap);

        group.add(turretHead);
      } else if (node.type === 'switch') {
        // --- 4. POE CORE SWITCH (Power & Routing Hub) ---
        const swBaseH = 0.38;
        const swChassisGeo = new THREE.BoxGeometry(baseW, swBaseH, baseD);
        const swChassis = new THREE.Mesh(swChassisGeo, standardChassisMat);
        swChassis.position.y = swBaseH / 2 + 0.05;
        group.add(swChassis);

        if (branch === 'tesla_conduit') {
          // Tesla Coil Discharge Tower
          const coilGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.6, 12);
          const coilMat = new THREE.MeshStandardMaterial({ color: '#0369a1', metalness: 0.9 });
          const coil = new THREE.Mesh(coilGeo, coilMat);
          coil.position.set(0, swBaseH + 0.35, 0);
          group.add(coil);

          const orbGeo = new THREE.SphereGeometry(0.16, 12, 12);
          const orbMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
          const orb = new THREE.Mesh(orbGeo, orbMat);
          orb.name = 'switch_tesla_orb';
          orb.position.set(0, swBaseH + 0.68, 0);
          group.add(orb);
        } else {
          // Top Distribution Hub & Fan
          const hubGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.14, 16);
          const hubMat = new THREE.MeshStandardMaterial({
            color: branch === 'overclock_hub' ? '#b45309' : '#064e3b',
            metalness: 0.8,
          });
          const hubMesh = new THREE.Mesh(hubGeo, hubMat);
          hubMesh.position.set(0, swBaseH + 0.12, 0);
          group.add(hubMesh);

          const hubRingGeo = new THREE.TorusGeometry(0.25, 0.025, 8, 24);
          hubRingGeo.rotateX(Math.PI / 2);
          const hubRingMat = new THREE.MeshBasicMaterial({
            color: branch === 'overclock_hub' ? '#f59e0b' : '#10b981',
          });
          const hubRing = new THREE.Mesh(hubRingGeo, hubRingMat);
          hubRing.name = 'switch_beam_ring';
          hubRing.position.set(0, swBaseH + 0.15, 0);
          group.add(hubRing);
        }
      } else if (node.type === 'cache') {
        // --- 5. BANDWIDTH PROXY CACHE (Booster Battery) ---
        const tankGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.95, 16);
        const tankMat = new THREE.MeshStandardMaterial({
          color: branch === 'volatile_buffer' ? '#991b1b' : '#0284c7',
          roughness: 0.25,
          metalness: 0.7,
        });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = 0.52;
        group.add(tank);

        // Fluid Level Rings
        const ringGeo = new THREE.TorusGeometry(0.44, 0.03, 8, 24);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: branch === 'nanite_repair' ? '#22c55e' : '#38bdf8',
        });
        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.position.y = 0.4;
        const r2 = r1.clone();
        r2.position.y = 0.75;
        group.add(r1, r2);
      } else if (node.type === 'harvester') {
        // --- 6. AUTONOMOUS AGV HARVESTER BAY ---
        const padGeo = new THREE.BoxGeometry(baseW * 1.1, 0.16, baseD * 1.1);
        const padMat = new THREE.MeshStandardMaterial({
          color: '#eab308',
          roughness: 0.5,
          metalness: 0.6,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = 0.08 + 0.05;
        group.add(pad);

        // Clamps
        const clampMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9 });
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.15), clampMat);
        c1.position.set(-0.35, 0.22, 0.25);
        const c2 = c1.clone();
        c2.position.x = 0.35;
        group.add(c1, c2);

        // Magnet Collector Tower if magnet_harvester
        if (branch === 'magnet_harvester') {
          const magGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 24);
          magGeo.rotateX(Math.PI / 2);
          const magMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
          const mag = new THREE.Mesh(magGeo, magMat);
          mag.position.y = 0.45;
          group.add(mag);
        }
      } else {
        // --- 7 & 8. SERVER RACKS, ROUTERS, ENTERPRISE GATEWAYS ---
        const baseH = node.type === 'server' || node.type === 'database' ? 0.92 : 0.62;
        const chassisGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
        const chassisMesh = new THREE.Mesh(chassisGeo, standardChassisMat);
        chassisMesh.position.y = baseH / 2 + 0.05;
        chassisMesh.castShadow = true;
        group.add(chassisMesh);

        // Metal Rack Ears
        const earMat = new THREE.MeshStandardMaterial({
          color: branch === 'crypto_miner' ? '#f59e0b' : '#3b4354',
          roughness: 0.3,
          metalness: 0.85,
        });
        const earGeo = new THREE.BoxGeometry(0.08, baseH * 0.9, 0.12);
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-baseW / 2 - 0.04, baseH / 2 + 0.05, baseD / 2 - 0.06);
        leftEar.castShadow = true;
        group.add(leftEar);

        const rightEar = leftEar.clone();
        rightEar.position.x = baseW / 2 + 0.04;
        group.add(rightEar);

        // Honeypot Decoy Broadcast Hologram
        if (branch === 'honeypot_trap') {
          const trapGeo = new THREE.OctahedronGeometry(0.24, 0);
          const trapMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true });
          const trap = new THREE.Mesh(trapGeo, trapMat);
          trap.name = 'server_honeypot_trap';
          trap.position.y = baseH + 0.28;
          group.add(trap);
        }
      }

      // Status LED Point Indicator
      let ledColor = '#10b981';
      if (node.status === 'warning') ledColor = '#f59e0b';
      if (node.status === 'offline') ledColor = '#64748b';
      if (node.status === 'compromised') ledColor = '#ef4444';

      const ledGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0, 0.72, baseD / 2 - 0.04);
      group.add(ledMesh);

      // Selection Highlight Border
      const selectBorderGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 0.04, TILE_SIZE * 0.9);
      const selectBorderMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.9,
      });
      const selectBorder = new THREE.Mesh(selectBorderGeo, selectBorderMat);
      selectBorder.position.y = 0.02;
      selectBorder.name = 'selection_highlight';
      selectBorder.visible = node.id === stateRef.current.selectedNodeId;
      group.add(selectBorder);

      // Wiring Source Target Marker
      const wireMarkerGeo = new THREE.RingGeometry(0.5, 0.65, 32);
      wireMarkerGeo.rotateX(-Math.PI / 2);
      const wireMarkerMat = new THREE.MeshBasicMaterial({
        color: '#eab308',
        side: THREE.DoubleSide,
      });
      const wireMarker = new THREE.Mesh(wireMarkerGeo, wireMarkerMat);
      wireMarker.position.y = 0.03;
      wireMarker.name = 'wire_source_marker';
      wireMarker.visible = node.id === stateRef.current.wiringSourceNodeId;
      group.add(wireMarker);

      return group;
    }

    function syncNodesWithScene(currentNodes: PlacedNode[]) {
      const activeIds = new Set(currentNodes.map((n) => n.id));

      for (const [id, grp] of activeNodeGroups.entries()) {
        if (!activeIds.has(id)) {
          nodeMeshesGroup.remove(grp);
          activeNodeGroups.delete(id);
        }
      }

      currentNodes.forEach((node) => {
        let grp = activeNodeGroups.get(node.id);
        if (!grp) {
          grp = buildNodeMeshGroup(node);
          activeNodeGroups.set(node.id, grp);
          nodeMeshesGroup.add(grp);
        } else {
          const { x, z } = gridToWorld(node.gridX, node.gridZ);
          grp.position.set(x, 0, z);
          grp.rotation.y = node.rotation;

          const sel = grp.getObjectByName('selection_highlight');
          if (sel) {
            sel.visible = node.id === stateRef.current.selectedNodeId;
          }

          const wireMarker = grp.getObjectByName('wire_source_marker');
          if (wireMarker) {
            wireMarker.visible = node.id === stateRef.current.wiringSourceNodeId;
          }
        }
      });
    }

    // --- Dynamic Defense Entities Visual Sync (Bots, Enemies, Lasers, Orbs) ---
    function buildBotMesh(botId: string): THREE.Group {
      const botGrp = new THREE.Group();
      botGrp.name = botId;

      // Rubber Treads
      const treadMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9 });
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.6), treadMat);
      t1.position.set(-0.25, 0.11, 0);
      const t2 = t1.clone();
      t2.position.x = 0.25;
      botGrp.add(t1, t2);

      // Chassis Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#facc15',
        roughness: 0.4,
        metalness: 0.6,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.5), bodyMat);
      body.position.y = 0.22;
      body.castShadow = true;
      botGrp.add(body);

      // Underglow cyan light
      const underglowMat = new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.8,
      });
      const underglow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), underglowMat);
      underglow.rotateX(-Math.PI / 2);
      underglow.position.y = 0.02;
      botGrp.add(underglow);

      // Rotating LiDAR Dome
      const lidar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12),
        new THREE.MeshBasicMaterial({ color: '#38bdf8' })
      );
      lidar.name = 'bot_lidar';
      lidar.position.y = 0.42;
      botGrp.add(lidar);

      // Magnetic Collector Gripper Arm
      const armMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.9 });
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.18), armMat);
      arm.position.set(0, 0.18, 0.32);
      botGrp.add(arm);

      // Carried Data Orb ($) (initially hidden)
      const orbMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
      const carriedOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), orbMat);
      carriedOrb.name = 'bot_carried_orb';
      carriedOrb.position.set(0, 0.58, 0.2);
      carriedOrb.visible = false;
      botGrp.add(carriedOrb);

      // Red Warning Billboard (shown when stalled/no link)
      const warnMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
      const warnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.04), warnMat);
      warnMesh.name = 'bot_warning_billboard';
      warnMesh.position.set(0, 0.75, 0);
      warnMesh.visible = false;
      botGrp.add(warnMesh);

      return botGrp;
    }

    function buildEnemyMesh(enemyType: string): THREE.Group {
      const grp = new THREE.Group();

      if (enemyType === 'BOSS') {
        // Massive Dreadnought
        const hullMat = new THREE.MeshStandardMaterial({
          color: '#7f1d1d',
          roughness: 0.3,
          metalness: 0.85,
        });
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), hullMat);
        hull.position.y = 0.35;
        grp.add(hull);

        const shieldRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.9, 0.06, 8, 32),
          new THREE.MeshBasicMaterial({ color: '#ef4444' })
        );
        shieldRing.name = 'enemy_shield_ring';
        shieldRing.rotateX(Math.PI / 2);
        shieldRing.position.y = 0.35;
        grp.add(shieldRing);
      } else if (enemyType === 'RANSOMWARE') {
        // Armored Yellow Polyhedron
        const mat = new THREE.MeshStandardMaterial({
          color: '#eab308',
          roughness: 0.2,
          metalness: 0.8,
        });
        const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38), mat);
        core.position.y = 0.38;
        grp.add(core);
      } else if (enemyType === 'MALWARE') {
        // Spiky Purple Virus Capsid
        const mat = new THREE.MeshStandardMaterial({
          color: '#a855f7',
          roughness: 0.3,
          metalness: 0.7,
        });
        const capsid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32), mat);
        capsid.position.y = 0.35;
        grp.add(capsid);
      } else {
        // DDOS Red Crystal
        const mat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
        crystal.position.y = 0.3;
        grp.add(crystal);
      }

      return grp;
    }

    function buildOrbMesh(): THREE.Group {
      const orbGrp = new THREE.Group();
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshBasicMaterial({ color: '#38bdf8' })
      );
      orb.name = 'orb_crystal';
      orb.position.y = 0.25;
      orbGrp.add(orb);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.02, 6, 16),
        new THREE.MeshBasicMaterial({ color: '#67e8f9' })
      );
      halo.name = 'orb_halo';
      halo.rotateX(Math.PI / 2);
      halo.position.y = 0.25;
      orbGrp.add(halo);

      return orbGrp;
    }

    function syncDefenseVisuals(time: number) {
      // 1. Sync Core Mainframe Reactor and HP Ring
      const coreMonolith = coreMonolithGroup.getObjectByName('core_mainframe_monolith');
      if (coreMonolith) {
        const reactor = coreMonolith.getObjectByName('core_reactor_crystal');
        if (reactor) {
          reactor.rotation.y = time * 2;
          reactor.rotation.x = time * 1.5;
        }

        const ring1 = coreMonolith.getObjectByName('core_holo_ring_1');
        if (ring1) ring1.rotation.z = time * 2.5;

        const ring2 = coreMonolith.getObjectByName('core_holo_ring_2');
        if (ring2) ring2.rotation.y = -time * 1.8;

        const hpRing = coreMonolith.getObjectByName('core_hp_floor_ring') as THREE.Mesh | undefined;
        if (hpRing) {
          const hpRatio = globalDefenseEngine.coreHp / globalDefenseEngine.maxCoreHp;
          const mat = hpRing.material as THREE.MeshBasicMaterial;
          if (hpRatio > 0.6) {
            mat.color.set('#06b6d4');
            mat.opacity = 0.75 + Math.sin(time * 4) * 0.15;
          } else if (hpRatio > 0.3) {
            mat.color.set('#f59e0b');
            mat.opacity = 0.8 + Math.sin(time * 6) * 0.2;
          } else {
            mat.color.set('#ef4444');
            mat.opacity = 0.5 + Math.sin(time * 12) * 0.5; // Urgent flashing
          }
        }
      }

      // 2. Sync Moving Autonomous Warehouse Bots
      const currentBots = globalDefenseEngine.bots;
      const activeBotIds = new Set(currentBots.map((b) => b.id));

      for (const [id, grp] of activeBotMeshes.entries()) {
        if (!activeBotIds.has(id)) {
          defenseBotsGroup.remove(grp);
          activeBotMeshes.delete(id);
        }
      }

      currentBots.forEach((bot) => {
        let bMesh = activeBotMeshes.get(bot.id);
        if (!bMesh) {
          bMesh = buildBotMesh(bot.id);
          activeBotMeshes.set(bot.id, bMesh);
          defenseBotsGroup.add(bMesh);
        }

        const { x, z } = gridToWorld(bot.x, bot.z);
        bMesh.position.set(x, 0, z);
        bMesh.rotation.y = bot.rotation;

        // Spin LiDAR
        const lidar = bMesh.getObjectByName('bot_lidar');
        if (lidar) lidar.rotation.y = time * 8;

        // Carried Orb
        const carriedOrb = bMesh.getObjectByName('bot_carried_orb');
        if (carriedOrb) {
          carriedOrb.visible = bot.carryingValue > 0;
          if (carriedOrb.visible) {
            carriedOrb.rotation.y = time * 4;
          }
        }

        // Stalled Warning Billboard
        const warn = bMesh.getObjectByName('bot_warning_billboard');
        if (warn) {
          warn.visible = bot.status === 'stalled';
          if (warn.visible) {
            warn.rotation.y = -bot.rotation; // Always face camera
            warn.scale.setScalar(1.0 + Math.sin(time * 10) * 0.2);
          }
        }
      });

      // 3. Sync Malicious Enemy Packets
      const currentEnemies = globalDefenseEngine.enemies;
      const activeEnemyIds = new Set(currentEnemies.map((e) => e.id));

      for (const [id, grp] of activeEnemyMeshes.entries()) {
        if (!activeEnemyIds.has(id)) {
          defenseEnemiesGroup.remove(grp);
          activeEnemyMeshes.delete(id);
        }
      }

      currentEnemies.forEach((enemy) => {
        let eMesh = activeEnemyMeshes.get(enemy.id);
        if (!eMesh) {
          eMesh = buildEnemyMesh(enemy.type);
          activeEnemyMeshes.set(enemy.id, eMesh);
          defenseEnemiesGroup.add(eMesh);
        }

        const { x, z } = gridToWorld(enemy.x, enemy.z);
        eMesh.position.set(x, 0, z);
        eMesh.rotation.y = time * 3;

        const shield = eMesh.getObjectByName('enemy_shield_ring');
        if (shield) shield.rotation.z = time * 4;
      });

      // 4. Sync Dropped Blue Data Orbs ($)
      const currentOrbs = globalDefenseEngine.droppedOrbs;
      const activeOrbIds = new Set(currentOrbs.map((o) => o.id));

      for (const [id, grp] of activeOrbMeshes.entries()) {
        if (!activeOrbIds.has(id)) {
          defenseOrbsGroup.remove(grp);
          activeOrbMeshes.delete(id);
        }
      }

      currentOrbs.forEach((orb) => {
        let oMesh = activeOrbMeshes.get(orb.id);
        if (!oMesh) {
          oMesh = buildOrbMesh();
          activeOrbMeshes.set(orb.id, oMesh);
          defenseOrbsGroup.add(oMesh);
        }

        const { x, z } = gridToWorld(orb.worldX, orb.worldZ);
        oMesh.position.set(x, Math.sin(time * 5 + orb.worldX) * 0.08, z);

        const crystal = oMesh.getObjectByName('orb_crystal');
        if (crystal) crystal.rotation.y = time * 3;

        const halo = oMesh.getObjectByName('orb_halo');
        if (halo) halo.rotation.z = -time * 2;
      });

      // 5. Sync Laser Beams
      // Clear previous beam geometry
      while (defenseBeamsGroup.children.length > 0) {
        defenseBeamsGroup.remove(defenseBeamsGroup.children[0]);
      }

      globalDefenseEngine.laserBeams.forEach((beam) => {
        const fromW = gridToWorld(beam.fromX, beam.fromZ);
        const toW = gridToWorld(beam.toX, beam.toZ);

        const points = [
          new THREE.Vector3(fromW.x, beam.fromY, fromW.z),
          new THREE.Vector3(toW.x, beam.toY, toW.z),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: beam.color,
          linewidth: beam.isSniper ? 3 : 2,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        defenseBeamsGroup.add(line);
      });
    }

    // --- 6. Raycasting & Interaction Logic ---
    let isDragging = false;
    let dragMode: 'pan' | 'click' = 'click';

    const getRaycastGridPos = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.ray.intersectPlane(_groundPlane, _intersectPoint);
      if (!hits) return null;

      const { gx, gz } = worldToGrid(_intersectPoint.x, _intersectPoint.z);
      return { gx, gz, worldX: _intersectPoint.x, worldZ: _intersectPoint.z };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
        isDragging = true;
        dragMode = 'pan';
        _panStart.set(e.clientX, e.clientY);
        return;
      }

      if (e.button === 0) {
        isDragging = true;
        dragMode = 'click';
        _panStart.set(e.clientX, e.clientY);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging && dragMode === 'pan') {
        _panDelta.set(e.clientX - _panStart.x, e.clientY - _panStart.y);
        _panStart.set(e.clientX, e.clientY);

        const panSpeed = (frustumSize / container.clientHeight) * (1 / targetZoom);
        const right = new THREE.Vector3(1, 0, -1).normalize();
        const up = new THREE.Vector3(-1, 0, -1).normalize();

        const moveVec = right
          .clone()
          .multiplyScalar(-_panDelta.x * panSpeed)
          .add(up.clone().multiplyScalar(_panDelta.y * panSpeed));

        cameraTarget.add(moveVec);
        targetCameraPos.add(moveVec);
        return;
      }

      if (isDragging && dragMode === 'click') {
        const dist = Math.hypot(e.clientX - _panStart.x, e.clientY - _panStart.y);
        if (dist > 8) {
          dragMode = 'pan';
        }
      }

      // Hover Reticle & Ghost Cable update
      const gridHit = getRaycastGridPos(e.clientX, e.clientY);
      if (
        gridHit &&
        gridHit.gx >= 0 &&
        gridHit.gx < GRID_SIZE &&
        gridHit.gz >= 0 &&
        gridHit.gz < GRID_SIZE
      ) {
        const { x, z } = gridToWorld(gridHit.gx, gridHit.gz);
        cursorMesh.position.set(x, 0.03, z);
        cursorMesh.visible = true;

        const isOccupied = stateRef.current.nodes.some(
          (n) => n.gridX === gridHit.gx && n.gridZ === gridHit.gz
        );

        const tool = stateRef.current.activeTool;
        let isValid = !isOccupied;
        if (tool === 'select' || tool === 'delete') {
          isValid = isOccupied;
        } else if (tool === 'wire') {
          isValid = isOccupied;
        }

        cursorMat.map = isValid ? cursorValidTex : cursorInvalidTex;
        cursorMat.needsUpdate = true;
        setHoverTile({ x: gridHit.gx, z: gridHit.gz, isValid });

        // Update Ghost Cable if wiring source is active
        const sourceNodeId = stateRef.current.wiringSourceNodeId;
        if (tool === 'wire' && sourceNodeId) {
          const sourceNode = stateRef.current.nodes.find((n) => n.id === sourceNodeId);
          if (sourceNode) {
            const pA = CatenaryCableSystem.getNodePortWorldPos(sourceNode, false);
            const pB = new THREE.Vector3(gridHit.worldX, 0.42, gridHit.worldZ);
            const ghostCurve = CatenaryCableSystem.calculateCurve(pA, pB);

            if (ghostTubeMesh) {
              ghostTubeMesh.geometry.dispose();
              ghostTubeMesh.geometry = new THREE.TubeGeometry(ghostCurve, 20, 0.035, 6, false);
            } else {
              ghostTubeMesh = new THREE.Mesh(
                new THREE.TubeGeometry(ghostCurve, 20, 0.035, 6, false),
                ghostCableMat
              );
              scene.add(ghostTubeMesh);
            }
            ghostTubeMesh.visible = true;
          }
        } else if (ghostTubeMesh) {
          ghostTubeMesh.visible = false;
        }
      } else {
        cursorMesh.visible = false;
        setHoverTile(null);
        if (ghostTubeMesh) ghostTubeMesh.visible = false;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      const wasClick = dragMode === 'click';
      isDragging = false;

      if (!wasClick || e.button !== 0) return;

      const gridHit = getRaycastGridPos(e.clientX, e.clientY);
      if (
        !gridHit ||
        gridHit.gx < 0 ||
        gridHit.gx >= GRID_SIZE ||
        gridHit.gz < 0 ||
        gridHit.gz >= GRID_SIZE
      ) {
        return;
      }

      const { gx, gz } = gridHit;
      const clickedNode = stateRef.current.nodes.find(
        (n) => n.gridX === gx && n.gridZ === gz
      );

      const tool = stateRef.current.activeTool;

      if (tool === 'select') {
        if (clickedNode) {
          setSelectedNodeId(clickedNode.id);
          AudioManager.playClick(900);
        } else {
          setSelectedNodeId(null);
        }
      } else if (tool === 'delete') {
        if (clickedNode) {
          deleteNode(clickedNode.id);
          AudioManager.playPacketDrop();
        }
      } else if (tool === 'move') {
        if (!stateRef.current.movingNodeId) {
          if (clickedNode) {
            stateRef.current.movingNodeId = clickedNode.id;
            setSelectedNodeId(clickedNode.id);
            AudioManager.playClick(850);
          }
        } else {
          if (!clickedNode) {
            moveNode(stateRef.current.movingNodeId, gx, gz);
            stateRef.current.movingNodeId = null;
            AudioManager.playClick(950);
          } else {
            stateRef.current.movingNodeId = clickedNode.id;
            setSelectedNodeId(clickedNode.id);
            AudioManager.playClick(850);
          }
        }
      } else if (tool === 'wire') {
        // Wiring Cable Mode: click Node A, then click Node B
        if (!stateRef.current.wiringSourceNodeId) {
          if (clickedNode) {
            setWiringSourceNodeId(clickedNode.id);
            AudioManager.playClick(1000);
          }
        } else {
          if (clickedNode) {
            if (clickedNode.id !== stateRef.current.wiringSourceNodeId) {
              addCable(stateRef.current.wiringSourceNodeId, clickedNode.id);
              setWiringSourceNodeId(null);
              AudioManager.playWireSnap();
              if (ghostTubeMesh) ghostTubeMesh.visible = false;
            } else {
              setWiringSourceNodeId(null);
              if (ghostTubeMesh) ghostTubeMesh.visible = false;
            }
          } else {
            setWiringSourceNodeId(null);
            if (ghostTubeMesh) ghostTubeMesh.visible = false;
          }
        }
      } else {
        // Hardware placement tool
        if (!clickedNode) {
          addNode(tool, gx, gz);
          AudioManager.playClick(1100);
        } else {
          setSelectedNodeId(clickedNode.id);
          AudioManager.playClick(900);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      targetZoom = THREE.MathUtils.clamp(targetZoom * zoomFactor, 0.55, 3.5);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleDblClick = () => {
      (window as any).__resetIsoCamera?.();
    };

    // Mobile Touch Pinch-To-Zoom & Touch Pan
    const activeTouches = new Map<number, { x: number; y: number }>();
    let initialPinchDist = 0;
    let pinchStartZoom = 1.0;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (activeTouches.size === 2) {
        const [t1, t2] = Array.from(activeTouches.values());
        initialPinchDist = Math.hypot(t1.x - t2.x, t1.y - t2.y);
        pinchStartZoom = targetZoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (activeTouches.size === 2 && initialPinchDist > 0) {
        const [t1, t2] = Array.from(activeTouches.values());
        const currentDist = Math.hypot(t1.x - t2.x, t1.y - t2.y);
        const factor = currentDist / initialPinchDist;
        targetZoom = THREE.MathUtils.clamp(pinchStartZoom * factor, 0.55, 3.5);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.delete(e.changedTouches[i].identifier);
      }
      if (activeTouches.size < 2) {
        initialPinchDist = 0;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);
    dom.addEventListener('dblclick', handleDblClick);

    // --- 7. Window Resize Handling ---
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const newAspect = width / height;
      const currentFrustum = newAspect < 1.35 ? baseFrustum * (1.35 / newAspect) : baseFrustum;

      camera.left = (-currentFrustum * newAspect) / 2;
      camera.right = (currentFrustum * newAspect) / 2;
      camera.top = currentFrustum / 2;
      camera.bottom = -currentFrustum / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- 8. Render & Simulation Animation Loop (Zero GC) ---
    let animationFrameId: number;
    let statsTimer = 0;
    let lastTime = performance.now();
    let lastMode = useGameModeStore.getState().currentMode;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth camera position damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPos.x, 8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPos.y, 8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPos.z, 8, delta);

      camera.zoom = THREE.MathUtils.damp(camera.zoom, targetZoom, 10, delta);
      camera.updateProjectionMatrix();
      camera.lookAt(cameraTarget);

      // 1. Simulation Engine Tick
      const simStore = useSimulationStore.getState();
      if (simStore.isPlaying) {
        globalSimulationEngine.tick(delta * simStore.speed);
        useScenarioStore.getState().updateTickProgress(delta * simStore.speed);
      }

      // Sync stats to store at throttled intervals
      statsTimer += delta;
      if (statsTimer >= 0.25) {
        statsTimer = 0;
        simStore.updateStats(globalSimulationEngine.getStats());
      }

      // 2. Sync Nodes & Cables
      const currentNodes = stateRef.current.nodes;
      const currentCables = stateRef.current.cables;
      const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

      syncNodesWithScene(currentNodes);
      cableSystem.syncCables(currentCables, nodeMap);

      // 3. Update GPU Instanced Packets & Particle Sparks
      const activePackets = globalSimulationEngine.getActivePackets();
      packetSystem.update(activePackets, cableSystem, delta);

      const dropEvents = globalSimulationEngine.consumeDropEvents();
      if (dropEvents.length > 0) {
        packetSystem.triggerDropSparks(dropEvents);
      }

      const time = performance.now() * 0.001;

      // 4. Cinematic Camera Sweep in Title Menu Mode & Seamless Transition
      const currentMode = useGameModeStore.getState().currentMode;
      const isTitleMode = currentMode === 'title';
      if (isTitleMode) {
        targetCameraPos.set(Math.cos(time * 0.12) * 36, 32, Math.sin(time * 0.12) * 36);
        cameraTarget.set(0, 0, 0);
        targetZoom = 0.88;
      } else if (lastMode === 'title') {
        // Just transitioned from title into gameplay! Force immediate reset to locked isometric view
        cameraTarget.set(0, 0, 0);
        targetCameraPos.set(ISO_X, ISO_Y, ISO_Z);
        targetZoom = 1.05;
      }
      lastMode = currentMode;

      // 5. Update Tower Defense Engine & Entities
      globalDefenseEngine.update(delta, currentNodes, currentCables);
      syncDefenseVisuals(time);

      // 6. Secondary Mechanical Animations (Radar Dishes, Fan Blades, LEDs)
      activeNodeGroups.forEach((grp) => {
        // Rotating Radar Dish on AP / Sniper
        const radar = grp.getObjectByName('radar_dish');
        if (radar) {
          radar.rotation.y = time * 2.2;
        }

        // Rotating Fan Blades on Switches
        const fan = grp.getObjectByName('switch_fan_blades');
        if (fan) {
          fan.rotation.y = time * 12;
        }

        // Pulsing Turret Barrels & LEDs
        const led = grp.children.find(
          (c) => c instanceof THREE.Mesh && c.geometry.type === 'BoxGeometry' && c.position.y > 0.6
        );
        if (led && led instanceof THREE.Mesh) {
          const s = 1.0 + Math.sin(time * 6 + grp.position.x) * 0.15;
          led.scale.set(s, s, s);
        }

        // Wi-Fi 6 AP radio beacon ripple
        const apRing = grp.children.find((c) => c.name === 'ap_coverage_ring');
        if (apRing && apRing instanceof THREE.Mesh) {
          const wave = (Math.sin(time * 3) + 1) * 0.5;
          (apRing.material as THREE.MeshBasicMaterial).opacity = 0.25 + wave * 0.2;
        }
      });

      // Toggle grid & shadows
      floorGroup.visible = stateRef.current.showGrid;
      renderer.shadowMap.enabled = stateRef.current.showShadows;

      renderer.render(scene, camera);
    };

    renderer.compile(scene, camera);
    animate();

    (window as any).__resetIsoCamera = () => {
      cameraTarget.set(0, 0, 0);
      targetCameraPos.set(ISO_X, ISO_Y, ISO_Z);
      targetZoom = 1.05;
    };

    // --- Cleanup on unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
      dom.removeEventListener('dblclick', handleDblClick);
      resizeObserver.disconnect();

      cableSystem.dispose();
      packetSystem.dispose();
      renderer.dispose();
      if (ghostTubeMesh) {
        ghostTubeMesh.geometry.dispose();
        ghostCableMat.dispose();
      }
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [addCable, addNode, deleteNode, moveNode, setHoverTile, setSelectedNodeId, setWiringSourceNodeId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden cursor-crosshair bg-[#0b0f17]"
      style={{ touchAction: 'none' }}
    />
  );
};
