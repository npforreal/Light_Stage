/**
 * Stage3DScene - Pure Three.js Engine for Light Stage 3D
 * - Low-poly bodies & InstancedMesh for trusses, screens, and fixtures
 * - Only the fixtures of the active cue are drawn (single source of truth)
 * - Thin, low-opacity beams (no additive stacking). Default: selected fixture only,
 *   optional "show all beams" mode for the active cue.
 * - Top-Down view hides beams and draws thin floor pools instead
 * - Automatic beam cutoff threshold (default > 150 fixtures) for performance
 * - On-demand rendering (render on dirty) to protect CPU/battery
 * - OrbitControls constrained above stage floor + 3 fitted camera presets
 * - Raycasting for fixture/screen selection
 * - Clean dispose lifecycle
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  StageConfig,
  VirtualScreen,
  VirtualTruss,
  FixtureType,
} from '../../types/virtualStage';
import { Cue } from '../../types/stage';
import { VxOutput } from '../../types/visual';
import { placeFixtures, PlacedFixture } from '../../services/stageAutoPatch';
import { assignFixtureNumbers, FIXTURE_SYMBOLS } from '../../services/stageSymbols';
import { resolveLightingColorToLinear } from '../../data/colors';
import { applyDimmer, linearToOklab, oklabToOklch, gamutMap, rgbToHex } from '../../services/color';

export type CameraPresetType = 'foh' | 'topDown' | 'backstage';
export type CameraMode = CameraPresetType | 'free';

/** Visible body colour + silhouette per fixture type (colour-blind friendly labels in HUD). */
export const FIXTURE_BODY_COLORS: Record<FixtureType, number> = {
  Beam: 0xf472b6,
  Spot: 0x38bdf8,
  Wash: 0xa78bfa,
  Follow: 0xfbbf24,
  Blinder: 0xf87171,
  Strobe: 0x22d3ee,
  Par: 0x4ade80,
  Laser: 0xfb7185,
  Smoke: 0x94a3b8,
};

export interface Stage3DSceneOptions {
  beamThreshold?: number; // default 150
  onSelectFixture?: (fixtureId: string) => void;
  onSelectScreen?: (screenId: string) => void;
  onRender?: () => void;
  onCameraModeChange?: (mode: CameraMode) => void;
  rendererFactory?: (params?: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;
}

export interface Stage3DUpdateData {
  config: StageConfig;
  activeCue?: Cue | null;
  selectedFixtureId?: string | null;
  selectedScreenId?: string | null;
  haze?: boolean;
  vxOutputs?: VxOutput[];
  /** 'selected' (default) shows only the selected fixture's beam; 'all' shows every active cue beam. */
  beamMode?: 'selected' | 'all';
}

/** Check if WebGL context can be created */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export class Stage3DScene {
  public readonly container: HTMLElement;
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly controls: OrbitControls;

  private beamThreshold: number;
  private options: Stage3DSceneOptions;

  private isDirty = false;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Scene object groups
  private stageGroup: THREE.Group;
  private screenGroup: THREE.Group;
  private trussGroup: THREE.Group;
  private fixtureGroup: THREE.Group;
  private beamGroup: THREE.Group;
  private poolGroup: THREE.Group;
  private highlightGroup: THREE.Group;

  // Tracked data
  private currentConfig: StageConfig | null = null;
  private lastUpdateData: Stage3DUpdateData | null = null;
  private fixturePlacements: PlacedFixture[] = [];
  private screenMeshMap = new Map<string, THREE.Mesh>();
  private fixtureMeshMap = new Map<string, { type: FixtureType; index: number; placement: PlacedFixture }>();
  private fixtureHitBoxes: THREE.Mesh[] = [];

  // Camera state (drives preset button sync, incl. manual orbit -> free)
  private cameraMode: CameraMode = 'foh';
  private isApplyingPreset = false;

  // Rendered counters (exposed for verification tests)
  private renderedBeamCount = 0;
  private renderedPoolCount = 0;

  // Shared per-type body geometry/material caches
  private bodyGeometries = new Map<FixtureType, THREE.BufferGeometry>();
  private bodyMaterials = new Map<FixtureType, THREE.MeshStandardMaterial>();
  private poolMaterial: THREE.MeshBasicMaterial | null = null;
  private beamGeometry: THREE.BufferGeometry | null = null;
  private highlightSprites: THREE.Sprite[] = [];

  // Geometries and materials cache for clean disposal
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor(container: HTMLElement, options: Stage3DSceneOptions = {}) {
    this.container = container;
    this.options = options;
    this.beamThreshold = options.beamThreshold ?? 150;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10); // Deep theater dark

    // Camera
    const width = Math.max(10, container.clientWidth || 800);
    const height = Math.max(10, container.clientHeight || 500);
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);

    // Renderer
    const rendererParams: THREE.WebGLRendererParameters = {
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    };
    this.renderer = options.rendererFactory
      ? options.rendererFactory(rendererParams)
      : new THREE.WebGLRenderer(rendererParams);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 120;
    // Prevent camera dipping below stage floor level
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.addEventListener('change', () => this.requestRender());
    // Any manual orbit/zoom means the camera is no longer on a preset.
    this.controls.addEventListener('start', () => {
      if (this.isApplyingPreset) return;
      if (this.cameraMode !== 'free') {
        this.cameraMode = 'free';
        this.options.onCameraModeChange?.('free');
        this.rebuildFixtureVisuals();
        this.requestRender();
      }
    });

    // Groups
    this.stageGroup = new THREE.Group();
    this.screenGroup = new THREE.Group();
    this.trussGroup = new THREE.Group();
    this.fixtureGroup = new THREE.Group();
    this.beamGroup = new THREE.Group();
    this.poolGroup = new THREE.Group();
    this.highlightGroup = new THREE.Group();

    this.scene.add(this.stageGroup);
    this.scene.add(this.screenGroup);
    this.scene.add(this.trussGroup);
    this.scene.add(this.fixtureGroup);
    this.scene.add(this.beamGroup);
    this.scene.add(this.poolGroup);
    this.scene.add(this.highlightGroup);

    // Lighting
    this.setupLighting();

    // Default Camera Preset
    this.setCameraPreset('foh');

    // Pointer events for raycasting
    this.setupInteractions();

    // Resize handling
    this.setupResizeObserver();

    // Initial render
    this.requestRender();
  }

  public getBeamThreshold(): number {
    return this.beamThreshold;
  }

  /** Fixtures currently drawn on stage (active cue only). */
  public getFixtureCount(): number {
    return this.fixtureMeshMap.size;
  }

  public getBeamCount(): number {
    return this.renderedBeamCount;
  }

  public getPoolRingCount(): number {
    return this.renderedPoolCount;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public setBeamThreshold(threshold: number): void {
    if (threshold !== this.beamThreshold) {
      this.beamThreshold = threshold;
      this.rebuildFixtureVisuals();
      this.requestRender();
    }
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    const backDirLight = new THREE.DirectionalLight(0x38bdf8, 0.25);
    backDirLight.position.set(-10, 15, -15);
    this.scene.add(backDirLight);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resize(width, height);
          }
        }
      });
      this.resizeObserver.observe(this.container);
    }
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    // Keep the stage framed on preset views when the window changes size.
    if (this.cameraMode !== 'free') {
      this.frameCamera(this.cameraMode);
      this.controls.update();
    }
    this.requestRender();
  }

  public requestRender(): void {
    if (!this.isDirty) {
      this.isDirty = true;
      this.animFrameId = requestAnimationFrame(() => {
        this.isDirty = false;
        this.render();
      });
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
    this.options.onRender?.();
  }

  /**
   * Fits the stage bounding box in view for the requested preset.
   * Replaces the previous hard-coded positions so 960px and 1920px windows
   * both show the whole stage without manual zooming.
   */
  private frameCamera(preset: CameraPresetType): void {
    const config = this.currentConfig;
    const width = config?.widthMeters ?? 18;
    const depth = config?.depthMeters ?? 12;
    const fixtures = config?.fixtures ?? [];
    const trusses = (config?.trusses ?? []).filter((truss) => truss.enabled !== false);
    const maxTrim = Math.max(
      4,
      ...fixtures.map((fixture) => fixture.z ?? 0),
      ...trusses.map((truss) => truss.zMeters ?? 7)
    );

    const targetY = preset === 'topDown' ? 0 : maxTrim * 0.45;
    const target = new THREE.Vector3(0, targetY, -depth * 0.5);

    const fitRadius = 0.5 * Math.hypot(width, depth, maxTrim) * 1.05;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.35, this.camera.aspect));
    const limitingFov = Math.min(vFov, hFov);
    const distance = Math.max(8, fitRadius / Math.sin(limitingFov / 2));

    if (preset === 'topDown') {
      // A small tilt keeps the plan view axis-aligned (a perfectly vertical camera
      // makes the up-vector degenerate and rolls the stage ~45°).
      const tilt = distance * 0.2;
      this.camera.position.set(0, distance * 0.98, target.z + tilt);
      this.controls.target.set(0, 0, target.z);
    } else if (preset === 'backstage') {
      const dir = new THREE.Vector3(-0.8, 0.42, -0.85).normalize();
      this.camera.position.copy(target).addScaledVector(dir, distance);
      this.controls.target.copy(target);
    } else {
      // FOH: front of house, slightly above head height, looking downstage.
      const dir = new THREE.Vector3(0, 0.34, 1).normalize();
      this.camera.position.copy(target).addScaledVector(dir, distance);
      this.controls.target.copy(target);
    }

    this.camera.updateProjectionMatrix();
  }

  public setCameraPreset(preset: CameraPresetType): void {
    this.isApplyingPreset = true;
    this.cameraMode = preset;
    this.frameCamera(preset);
    this.controls.update();
    this.isApplyingPreset = false;

    this.options.onCameraModeChange?.(preset);
    // Beams/pool rings depend on the view (Top-Down draws floor pools).
    this.rebuildFixtureVisuals();
    this.requestRender();
  }

  public update(data: Stage3DUpdateData): void {
    const isConfigChanged =
      !this.currentConfig ||
      this.currentConfig.preset !== data.config.preset ||
      this.currentConfig.widthMeters !== data.config.widthMeters ||
      this.currentConfig.depthMeters !== data.config.depthMeters ||
      this.currentConfig.screens !== data.config.screens ||
      this.currentConfig.trusses !== data.config.trusses ||
      this.currentConfig.fixtures !== data.config.fixtures;

    this.currentConfig = data.config;
    this.lastUpdateData = data;

    if (isConfigChanged) {
      this.buildStage(data.config);
      this.buildScreens(data.config.screens);
      this.buildTrusses(data.config.trusses);
      // Re-fit the stage if the rig dimensions changed while on a preset view.
      if (this.cameraMode !== 'free') {
        this.frameCamera(this.cameraMode);
        this.controls.update();
      }
    }

    // Auto-patch fixtures from active cue. Only fixtures of the CURRENT cue are
    // drawn — the idle base rig is not a second source of truth for the stage.
    const lxCue = data.activeCue?.departments?.lx;
    const placementResult = placeFixtures(data.config, lxCue);
    this.fixturePlacements = placementResult.placements.filter((placement) => placement.isActive);

    this.buildFixturesAndBeams(data);
    this.updateScreenDisplays(data);
    this.updateHighlights(data.selectedFixtureId, data.selectedScreenId);

    this.requestRender();
  }

  private buildStage(config: StageConfig): void {
    this.clearGroup(this.stageGroup);

    const width = Math.max(5, config.widthMeters);
    const depth = Math.max(5, config.depthMeters);
    const height = 0.6; // Stage riser height

    // Stage floor geometry
    const floorGeo = new THREE.BoxGeometry(width, height, depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.15,
    });
    this.disposables.push(floorGeo, floorMat);

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    // Center floor top at Y = 0; Z runs from 0 (plaster line) to -depth (upstage)
    floorMesh.position.set(0, -height / 2, -depth / 2);
    this.stageGroup.add(floorMesh);

    // Thrust extension if preset is Thrust
    if (config.preset === 'Thrust') {
      const thrustWidth = width * 0.35;
      const thrustDepth = 3.5;
      const thrustGeo = new THREE.BoxGeometry(thrustWidth, height, thrustDepth);
      const thrustMesh = new THREE.Mesh(thrustGeo, floorMat);
      // Protrudes downstage (positive Z)
      thrustMesh.position.set(0, -height / 2, thrustDepth / 2);
      this.stageGroup.add(thrustMesh);
    }

    // Meter grid on floor
    const gridHelper = new THREE.GridHelper(
      Math.max(width, depth),
      Math.max(width, depth),
      0x3f3f46,
      0x27272a
    );
    gridHelper.position.set(0, 0.002, -depth / 2);
    this.stageGroup.add(gridHelper);

    // Plaster Line marker (gold dashed accent line at Z = 0)
    const lineGeo = new THREE.BoxGeometry(width, 0.02, 0.08);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.disposables.push(lineGeo, lineMat);
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.set(0, 0.005, 0);
    this.stageGroup.add(lineMesh);
  }

  private buildScreens(screens: VirtualScreen[]): void {
    this.clearGroup(this.screenGroup);
    this.screenMeshMap.clear();

    const stageDepth = this.currentConfig?.depthMeters ?? 12;

    for (const screen of screens) {
      if (!screen.enabled) continue;

      const w = screen.widthMeters ?? 6;
      const h = screen.heightMeters ?? 3.5;
      const d = 0.15; // LED panel thickness

      const x = screen.xMeters ?? 0;
      const y = screen.yMeters ?? stageDepth - 0.5;
      const z = screen.zMeters ?? 1.2;

      // Outer bezel frame
      const frameGeo = new THREE.BoxGeometry(w + 0.1, h + 0.1, d);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        roughness: 0.9,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(x, z + h / 2, -y);

      // Inner emissive LED panel
      const displayGeo = new THREE.PlaneGeometry(w, h);
      const displayMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.3,
      });
      const displayMesh = new THREE.Mesh(displayGeo, displayMat);
      displayMesh.position.set(0, 0, d / 2 + 0.01);
      displayMesh.userData = { type: 'screen', id: screen.id };

      frameMesh.add(displayMesh);
      this.screenGroup.add(frameMesh);

      this.screenMeshMap.set(screen.id, displayMesh);
      this.disposables.push(frameGeo, frameMat, displayGeo, displayMat);
    }
  }

  private buildTrusses(trusses: VirtualTruss[]): void {
    this.clearGroup(this.trussGroup);

    for (const truss of trusses) {
      if (!truss.enabled) continue;

      const span = truss.widthMeters ?? 14;
      const trussWidth = 0.35;
      const trussHeight = 0.35;

      const x = truss.xMeters ?? 0;
      const y = truss.yMeters ?? 4;
      const z = truss.zMeters ?? 7;

      // Box truss span
      const trussGeo = new THREE.BoxGeometry(span, trussHeight, trussWidth);
      const trussMat = new THREE.MeshStandardMaterial({
        color: 0x71717a,
        roughness: 0.5,
        metalness: 0.85,
      });
      const trussMesh = new THREE.Mesh(trussGeo, trussMat);
      trussMesh.position.set(x, z, -y);
      trussMesh.userData = { type: 'truss', id: truss.id };

      this.trussGroup.add(trussMesh);
      this.disposables.push(trussGeo, trussMat);
    }
  }

  private rebuildFixtureVisuals(): void {
    if (!this.lastUpdateData) return;
    this.buildFixturesAndBeams(this.lastUpdateData);
  }

  /** Lazily creates a distinct low-poly silhouette for each fixture type. */
  private getBodyGeometry(type: FixtureType): THREE.BufferGeometry {
    const cached = this.bodyGeometries.get(type);
    if (cached) return cached;

    let geometry: THREE.BufferGeometry;
    switch (type) {
      case 'Beam': {
        geometry = new THREE.ConeGeometry(0.16, 0.44, 10);
        geometry.rotateX(Math.PI); // narrow nose pointing down, like a beam fixture
        break;
      }
      case 'Spot':
        geometry = new THREE.CylinderGeometry(0.12, 0.17, 0.4, 10);
        break;
      case 'Wash':
        geometry = new THREE.BoxGeometry(0.3, 0.32, 0.3);
        break;
      case 'Follow':
        geometry = new THREE.CylinderGeometry(0.19, 0.22, 0.58, 12);
        break;
      case 'Blinder':
        geometry = new THREE.BoxGeometry(0.52, 0.26, 0.22);
        break;
      case 'Strobe':
        geometry = new THREE.OctahedronGeometry(0.23);
        break;
      case 'Par':
        geometry = new THREE.SphereGeometry(0.19, 10, 8);
        break;
      case 'Laser':
        geometry = new THREE.CylinderGeometry(0.06, 0.06, 0.52, 8);
        break;
      case 'Smoke':
        geometry = new THREE.TorusGeometry(0.18, 0.05, 6, 12);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.28, 0.32, 0.28);
    }

    this.bodyGeometries.set(type, geometry);
    return geometry;
  }

  private getBodyMaterial(type: FixtureType): THREE.MeshStandardMaterial {
    const cached = this.bodyMaterials.get(type);
    if (cached) return cached;

    const color = FIXTURE_BODY_COLORS[type] ?? 0x94a3b8;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.35,
      emissive: color,
      emissiveIntensity: 0.16,
    });
    this.bodyMaterials.set(type, material);
    return material;
  }

  private getPoolMaterial(): THREE.MeshBasicMaterial {
    if (!this.poolMaterial) {
      this.poolMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    }
    return this.poolMaterial;
  }

  private buildFixturesAndBeams(data: Stage3DUpdateData): void {
    this.clearGroup(this.fixtureGroup);
    this.clearGroup(this.beamGroup);
    this.clearGroup(this.poolGroup);
    this.fixtureMeshMap.clear();
    this.fixtureHitBoxes = [];
    this.renderedBeamCount = 0;
    this.renderedPoolCount = 0;

    const placements = this.fixturePlacements;
    const totalCount = placements.length;
    if (totalCount === 0) {
      return;
    }

    // Group placements by FixtureType for InstancedMesh
    const byType = new Map<FixtureType, PlacedFixture[]>();
    for (const p of placements) {
      const list = byType.get(p.type) || [];
      list.push(p);
      byType.set(p.type, list);
    }

    const dummy = new THREE.Object3D();

    byType.forEach((typePlacements, fixtureType) => {
      const count = typePlacements.length;
      if (count === 0) return;

      const instancedMesh = new THREE.InstancedMesh(
        this.getBodyGeometry(fixtureType),
        this.getBodyMaterial(fixtureType),
        count
      );
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      for (let i = 0; i < count; i++) {
        const p = typePlacements[i];
        const x = p.x;
        const y = -p.y; // Three Z
        const z = p.z; // Three Y

        dummy.position.set(x, z, y);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1.45);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);

        this.fixtureMeshMap.set(p.id, {
          type: fixtureType,
          index: i,
          placement: p,
        });

        // Invisible hit box for Raycasting
        const hitGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.set(x, z, y);
        hitMesh.userData = { type: 'fixture', id: p.id };
        this.fixtureGroup.add(hitMesh);
        this.fixtureHitBoxes.push(hitMesh);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.fixtureGroup.add(instancedMesh);
    });

    // Cue colour for beams / floor pools
    const beamColor = this.resolveCueBeamColor(data);

    // Top-Down plan view: hide beams, show thin floor pools instead.
    if (this.cameraMode === 'topDown') {
      this.buildFloorPools(placements, beamColor);
      return;
    }

    if (totalCount > this.beamThreshold) return;

    const beamMode = data.beamMode ?? 'selected';
    const selectedId = data.selectedFixtureId ?? null;
    const targets =
      beamMode === 'all'
        ? placements
        : placements.filter((placement) => placement.id === selectedId);

    if (targets.length === 0) return;

    const hazeOn = data.haze ?? true;
    const intensity = this.resolveCueIntensity(data);
    const beamLengthGeometry = this.getBeamGeometry();
    const selectedTarget = targets.find((placement) => placement.id === selectedId);

    // Group beams: "others" are thin and very transparent; selected is brighter.
    const others = selectedTarget ? targets.filter((p) => p.id !== selectedTarget.id) : targets;

    if (others.length > 0) {
      const opacity = (hazeOn ? 0.085 : 0.06) * Math.max(0.4, intensity);
      const beamMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity,
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const othersMesh = new THREE.InstancedMesh(beamLengthGeometry, beamMat, others.length);
      othersMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      othersMesh.renderOrder = 2;

      others.forEach((p, i) => {
        this.applyBeamTransform(dummy, p);
        othersMesh.setMatrixAt(i, dummy.matrix);
      });
      othersMesh.instanceMatrix.needsUpdate = true;
      this.beamGroup.add(othersMesh);
      this.renderedBeamCount += others.length;
    }

    if (selectedTarget) {
      const selectedMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: (hazeOn ? 0.24 : 0.16) * Math.max(0.4, intensity),
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const selectedMesh = new THREE.Mesh(beamLengthGeometry, selectedMat);
      selectedMesh.renderOrder = 3;
      this.applyBeamTransform(dummy, selectedTarget, 0.62);
      selectedMesh.position.copy(dummy.position);
      selectedMesh.rotation.copy(dummy.rotation);
      selectedMesh.scale.copy(dummy.scale);
      this.beamGroup.add(selectedMesh);
      this.renderedBeamCount += 1;
    }
  }

  private getBeamGeometry(): THREE.BufferGeometry {
    if (!this.beamGeometry) {
      // Apex at origin, extends down -Y with unit radius; instances scale it.
      this.beamGeometry = new THREE.ConeGeometry(1, 6, 20, 1, true);
      this.beamGeometry.translate(0, -3, 0);
    }
    return this.beamGeometry;
  }

  /** Thin beam sized from the fixture's real beam angle and trim height. */
  private applyBeamTransform(dummy: THREE.Object3D, placement: PlacedFixture, widthScale = 1): void {
    const length = Math.min(Math.max(placement.z || 4, 2), 12);
    const angle = Math.min(Math.max(placement.beamAngle || 25, 1), 70);
    const radius = Math.min(
      2.6,
      Math.max(0.12, Math.tan(THREE.MathUtils.degToRad(angle / 2)) * length)
    );

    const elevationRad = THREE.MathUtils.degToRad(placement.aim?.elevation ?? -65);
    const azimuthRad = THREE.MathUtils.degToRad(placement.aim?.azimuth ?? 0);

    dummy.position.set(placement.x, (placement.z || 4) - 0.18, -placement.y);
    dummy.rotation.set(elevationRad + Math.PI / 2, azimuthRad, 0);
    dummy.scale.set(radius * widthScale, length / 6, radius * widthScale);
    dummy.updateMatrix();
  }

  /** Top-Down plan: a thin ring on the floor for every active fixture. */
  private buildFloorPools(placements: PlacedFixture[], color: THREE.Color): void {
    const material = this.getPoolMaterial();
    material.color.copy(color);

    for (const p of placements) {
      const length = Math.min(Math.max(p.z || 4, 2), 12);
      const angle = Math.min(Math.max(p.beamAngle || 25, 1), 70);
      const radius = Math.min(
        5,
        Math.max(0.25, Math.tan(THREE.MathUtils.degToRad(angle / 2)) * length)
      );

      const ringGeo = new THREE.RingGeometry(Math.max(0.2, radius - 0.06), radius, 40);
      const ring = new THREE.Mesh(ringGeo, material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.012, -p.y);
      ring.renderOrder = 1;
      this.poolGroup.add(ring);
    }

    this.renderedPoolCount = placements.length;
  }

  private resolveCueBeamColor(data: Stage3DUpdateData): THREE.Color {
    const lxCue = data.activeCue?.departments?.lx;
    const lightingColor =
      lxCue?.color ||
      (lxCue?.colorPreset ? { mode: 'rgb' as const, hex: lxCue.colorPreset } : undefined);
    const baseLinear = resolveLightingColorToLinear(lightingColor);
    const dimmer = applyDimmer(lxCue?.intensity ?? 80, 'square');
    const dimmedLinear = {
      r: baseLinear.r * dimmer,
      g: baseLinear.g * dimmer,
      b: baseLinear.b * dimmer,
    };
    const lab = linearToOklab(dimmedLinear);
    const lch = oklabToOklch(lab);
    const mapped = gamutMap(lch);
    return new THREE.Color(rgbToHex(mapped.color));
  }

  private resolveCueIntensity(data: Stage3DUpdateData): number {
    const rawIntensity = data.activeCue?.departments?.lx?.intensity ?? 80;
    return applyDimmer(rawIntensity, 'square');
  }

  private updateScreenDisplays(data: Stage3DUpdateData): void {
    const vxCue = data.activeCue?.departments?.vx;
    const hasVx = Boolean(vxCue?.contentName || (vxCue?.screens && vxCue.screens.length > 0));

    this.screenMeshMap.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (hasVx) {
          mat.emissive.setHex(0x10b981); // Emerald glow when visual content active
          mat.emissiveIntensity = 0.8;
        } else {
          mat.emissive.setHex(0x0284c7); // Cool sky cyan default
          mat.emissiveIntensity = 0.45;
        }
      }
    });
  }

  private updateHighlights(selectedFixtureId?: string | null, selectedScreenId?: string | null): void {
    this.clearGroup(this.highlightGroup);
    this.disposeHighlightSprites();

    if (selectedFixtureId) {
      const match = this.fixtureMeshMap.get(selectedFixtureId);
      if (match) {
        const p = match.placement;
        const ringGeo = new THREE.RingGeometry(0.35, 0.45, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b, // Amber highlight
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(p.x, p.z, -p.y);
        ringMesh.rotation.x = Math.PI / 2;
        this.highlightGroup.add(ringMesh);
        this.disposables.push(ringGeo, ringMat);

        // USITT-lite number + type label floating next to the selected fixture.
        const numbers = assignFixtureNumbers(this.fixturePlacements);
        const number = numbers[p.id];
        const label = number ? `#${number} ${FIXTURE_SYMBOLS[match.type]?.label ?? match.type}` : FIXTURE_SYMBOLS[match.type]?.label;
        const sprite = this.createLabelSprite(label ?? '');
        if (sprite) {
          sprite.position.set(p.x, p.z + 0.55, -p.y);
          this.highlightGroup.add(sprite);
          this.highlightSprites.push(sprite);
        }
      }
    }

    if (selectedScreenId) {
      const mesh = this.screenMeshMap.get(selectedScreenId);
      if (mesh && mesh.parent) {
        const planeGeo = mesh.geometry as THREE.PlaneGeometry;
        const w = planeGeo.parameters?.width ?? 2;
        const h = planeGeo.parameters?.height ?? 1.5;
        const wireGeo = new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.25);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        wireMesh.position.copy(mesh.parent.position);
        this.highlightGroup.add(wireMesh);
        this.disposables.push(wireGeo, wireMat);
      }
    }
  }

  /** Canvas-texture sprite for fixture numbers. Silently skipped when 2D canvas is absent (jsdom). */
  private createLabelSprite(text: string): THREE.Sprite | null {
    if (!text || typeof document === 'undefined') return null;
    // jsdom implements getContext('2d') as a noisy "not implemented" error.
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (isJsdom) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 32px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.1, 0.55, 1);
    sprite.renderOrder = 5;
    return sprite;
  }

  private disposeHighlightSprites(): void {
    for (const sprite of this.highlightSprites) {
      const material = sprite.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();
    }
    this.highlightSprites = [];
  }

  private setupInteractions(): void {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, this.camera);

      // Check fixture hit boxes
      const fixtureHits = raycaster.intersectObjects(this.fixtureHitBoxes, false);
      if (fixtureHits.length > 0) {
        const hit = fixtureHits[0];
        const fixtureId = hit.object.userData?.id;
        if (fixtureId) {
          this.options.onSelectFixture?.(fixtureId);
          return;
        }
      }

      // Check screens
      const screenMeshes = Array.from(this.screenMeshMap.values());
      const screenHits = raycaster.intersectObjects(screenMeshes, false);
      if (screenHits.length > 0) {
        const hit = screenHits[0];
        const screenId = hit.object.userData?.id;
        if (screenId) {
          this.options.onSelectScreen?.(screenId);
          return;
        }
      }
    };

    this.renderer.domElement.addEventListener('pointerdown', onPointerDown);
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
      }
    }
  }

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.controls.dispose();

    // Clear all groups
    this.clearGroup(this.stageGroup);
    this.clearGroup(this.screenGroup);
    this.clearGroup(this.trussGroup);
    this.clearGroup(this.fixtureGroup);
    this.clearGroup(this.beamGroup);
    this.clearGroup(this.poolGroup);
    this.clearGroup(this.highlightGroup);
    this.disposeHighlightSprites();

    // Shared per-type caches
    this.bodyGeometries.forEach((geometry) => geometry.dispose());
    this.bodyGeometries.clear();
    this.bodyMaterials.forEach((material) => material.dispose());
    this.bodyMaterials.clear();
    this.beamGeometry?.dispose();
    this.beamGeometry = null;
    this.poolMaterial?.dispose();
    this.poolMaterial = null;

    // Dispose cached geometries and materials
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];

    // Dispose renderer
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
