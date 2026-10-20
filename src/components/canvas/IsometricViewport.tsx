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
    scene.background = new THREE.Color('#0b0f17');
    scene.fog = new THREE.Fog('#0b0f17', 55, 120);

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 36;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      500
    );

    // Precise Isometric Camera Positioning
    const isoDistance = 45;
    camera.position.set(isoDistance, isoDistance * 0.95, isoDistance);
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    const targetCameraPos = camera.position.clone();
    camera.lookAt(cameraTarget);
    camera.zoom = 1.0;
    let targetZoom = 1.0;

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // --- 2. Lighting Rig ---
    const dirLight = new THREE.DirectionalLight('#ffe8d6', 1.8);
    dirLight.position.set(30, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const shadowD = 24;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 0.65);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight('#6366f1', 0.8);
    rimLight.position.set(-30, 20, -30);
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
        roughness: 0.65,
        metalness: 0.35,
      }),
      vent: new THREE.MeshStandardMaterial({
        map: ventTex,
        roughness: 0.8,
        metalness: 0.2,
      }),
      hazard: new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.5,
        metalness: 0.4,
      }),
    };

    for (let gz = 0; gz < GRID_SIZE; gz++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const { x, z } = gridToWorld(gx, gz);
        let mat = floorMaterials.raised;
        if (gx === 0 || gx === GRID_SIZE - 1 || gz === 0 || gz === GRID_SIZE - 1) {
          mat = (gx + gz) % 2 === 0 ? floorMaterials.hazard : floorMaterials.raised;
        } else if ((gx % 4 === 0 && gz % 2 === 0) || (gz % 4 === 0 && gx % 2 === 0)) {
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
      color: '#0e121a',
      roughness: 0.9,
      metalness: 0.1,
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

    const activeNodeGroups = new Map<string, THREE.Group>();

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

      // Chassis Base
      const baseW = TILE_SIZE * 0.75;
      const baseH = node.type === 'database' || node.type === 'server' ? 0.9 : 0.65;
      const baseD = TILE_SIZE * 0.65;

      const frontTex = PixelTextureFactory.getHardwareTexture(node.type, 'front');
      const topTex = PixelTextureFactory.getHardwareTexture(node.type, 'top');
      const sideTex = PixelTextureFactory.getHardwareTexture(node.type, 'side');
      const emissiveTex = PixelTextureFactory.getHardwareEmissiveTexture(node.type);

      const cubeMaterials = [
        new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.7, metalness: 0.4 }),
        new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.7, metalness: 0.4 }),
        new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.6, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: '#11141c', roughness: 0.9 }),
        new THREE.MeshStandardMaterial({
          map: frontTex,
          emissiveMap: emissiveTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.85,
          roughness: 0.5,
          metalness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ color: '#161a23', roughness: 0.8 }),
      ];

      const chassisGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
      const chassisMesh = new THREE.Mesh(chassisGeo, cubeMaterials);
      chassisMesh.position.y = baseH / 2 + 0.05;
      chassisMesh.castShadow = true;
      chassisMesh.receiveShadow = true;
      group.add(chassisMesh);

      // Rack Ears
      const earMat = new THREE.MeshStandardMaterial({
        color: '#3b4354',
        roughness: 0.4,
        metalness: 0.8,
      });
      const earGeo = new THREE.BoxGeometry(0.08, baseH * 0.9, 0.12);
      const leftEar = new THREE.Mesh(earGeo, earMat);
      leftEar.position.set(-baseW / 2 - 0.04, baseH / 2 + 0.05, baseD / 2 - 0.06);
      leftEar.castShadow = true;
      group.add(leftEar);

      const rightEar = leftEar.clone();
      rightEar.position.x = baseW / 2 + 0.04;
      group.add(rightEar);

      // Status LED
      let ledColor = '#10b981';
      if (node.status === 'warning') ledColor = '#f59e0b';
      if (node.status === 'offline') ledColor = '#64748b';
      if (node.status === 'compromised') ledColor = '#ef4444';

      const ledGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0, baseH + 0.1, baseD / 2 - 0.05);
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
        } else {
          setSelectedNodeId(null);
        }
      } else if (tool === 'delete') {
        if (clickedNode) {
          deleteNode(clickedNode.id);
        }
      } else if (tool === 'move') {
        if (!stateRef.current.movingNodeId) {
          if (clickedNode) {
            stateRef.current.movingNodeId = clickedNode.id;
            setSelectedNodeId(clickedNode.id);
          }
        } else {
          if (!clickedNode) {
            moveNode(stateRef.current.movingNodeId, gx, gz);
            stateRef.current.movingNodeId = null;
          } else {
            stateRef.current.movingNodeId = clickedNode.id;
            setSelectedNodeId(clickedNode.id);
          }
        }
      } else if (tool === 'wire') {
        // Wiring Cable Mode: click Node A, then click Node B
        if (!stateRef.current.wiringSourceNodeId) {
          if (clickedNode) {
            setWiringSourceNodeId(clickedNode.id);
          }
        } else {
          if (clickedNode) {
            if (clickedNode.id !== stateRef.current.wiringSourceNodeId) {
              addCable(stateRef.current.wiringSourceNodeId, clickedNode.id);
              setWiringSourceNodeId(null);
              if (ghostTubeMesh) ghostTubeMesh.visible = false;
            } else {
              // Clicked same node: cancel wiring
              setWiringSourceNodeId(null);
              if (ghostTubeMesh) ghostTubeMesh.visible = false;
            }
          } else {
            // Clicked empty tile: cancel wiring
            setWiringSourceNodeId(null);
            if (ghostTubeMesh) ghostTubeMesh.visible = false;
          }
        }
      } else {
        // Hardware placement tool
        if (!clickedNode) {
          addNode(tool, gx, gz);
        } else {
          setSelectedNodeId(clickedNode.id);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      targetZoom = THREE.MathUtils.clamp(targetZoom * zoomFactor, 0.45, 2.5);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);

    // --- 7. Window Resize Handling ---
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const newAspect = width / height;

      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- 8. Render & Simulation Animation Loop (Zero GC) ---
    let animationFrameId: number;
    let statsTimer = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

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

      // 4. Subtle pulsating LEDs on placed nodes
      const time = clock.getElapsedTime();
      activeNodeGroups.forEach((grp) => {
        const led = grp.children.find(
          (c) => c instanceof THREE.Mesh && c.geometry.type === 'BoxGeometry' && c.position.y > 0.6
        );
        if (led && led instanceof THREE.Mesh) {
          const s = 1.0 + Math.sin(time * 6 + grp.position.x) * 0.15;
          led.scale.set(s, s, s);
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
      targetCameraPos.set(isoDistance, isoDistance * 0.95, isoDistance);
      targetZoom = 1.0;
    };

    // --- Cleanup on unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
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
