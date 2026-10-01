import * as THREE from 'three';
import { BodyPart, GameStats, GameStatus, PoseType } from '../types/game';
import { soundEngine } from './audio';
import { ArtGalleryEnvironment, MuseumExhibit } from './environment';
import { PaintTool, PlayerCharacter } from './player';
import { SeekerHunter } from './seeker';
import { WhistleEngine } from './whistleEngine';
import { MultiplayerClient, RoomPlayer } from '../network/multiplayerClient';

export interface GameCallbacks {
  onStatusChange: (status: GameStatus) => void;
  onPhaseChange: (phase: 'lobby' | 'hide' | 'seek' | 'ended', timer: number) => void;
  onTimeUpdate: (timeLeft: number) => void;
  onWhistleTimeUpdate: (timeToWhistle: number, progress: number) => void;
  onWhistleAlert: () => void;
  onPlayerCaught: (hiderName: string, isLocal: boolean) => void;
  onTagPenalty: (duration: number) => void;
  onStatsReady: (stats: GameStats) => void;
  onEyedropperSampled: (color: string, name: string) => void;
  onBackdropDetected: (name: string, matchPercent: number) => void;
}

export class GameController {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Subsystems
  public player: PlayerCharacter;
  public environment: ArtGalleryEnvironment;
  public whistleEngine: WhistleEngine;
  public networkClient: MultiplayerClient | null = null;

  // 3D AI Seekers patrolling the museum
  public aiSeekers: SeekerHunter[] = [];

  // Remote players
  public remotePlayers: Map<string, PlayerCharacter> = new Map();

  // Game state
  public status: GameStatus = 'playing';
  public currentRole: 'hider' | 'seeker' | 'spectator' = 'hider';
  public currentPhase: 'lobby' | 'hide' | 'seek' | 'ended' = 'hide';
  public phaseTimer: number = 35;
  public isSoloPractice: boolean = true;

  // Seeker mechanics
  public isSeekerPenalty: boolean = false;
  public penaltyTimer: number = 0;

  // Painting settings
  public activeTool: PaintTool = 'brush';
  public activeColor: string = '#1e3a8a';
  public brushSize: number = 18;
  public isPaintingOnCharacter: boolean = false;

  // Full 3D Camera System (rich isometric 3D third-person perspective)
  public isPaintFocus: boolean = false;
  public cameraAngleH: number = 0.58; // 33 degrees angle for full 3D room depth
  public cameraAngleV: number = 0.44; // elevated 3D perspective
  public cameraDistance: number = 6.6;
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  private isCameraDragging: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Movement input
  private keys: { [key: string]: boolean } = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  private callbacks: GameCallbacks;

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.018);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 2. Camera (Perspective 3D)
    this.camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 120);

    // 3. 3D Museum Lighting
    this.setupLighting();

    // 4. Museum 3D Environment with Masterpieces, Statues, Plants & Benches
    this.environment = new ArtGalleryEnvironment();
    this.scene.add(this.environment.scene);

    // 5. Local Player Mannequin (100% Rounded organic 3D figure)
    this.player = new PlayerCharacter('local', 'Họa Sĩ Trốn');
    this.scene.add(this.player.group);
    this.player.position.set(0, 0, 0);

    // 6. Spawn 2 Patrolling 3D AI Seekers
    this.initAISeekers();

    // 7. Whistle Engine
    this.whistleEngine = new WhistleEngine(this.scene, 22);

    // 8. Event listeners
    this.bindEvents();

    // 9. Start loop
    this.animate();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.95);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    mainLight.position.set(12, 18, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0008;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-14, 12, -12);
    this.scene.add(fillLight);
  }

  private initAISeekers() {
    // Seeker Hunter 1: Patrols North & East wings
    const seeker1 = new SeekerHunter(
      1,
      new THREE.Vector3(-10, 0, -12),
      [
        new THREE.Vector3(-12, 0, -12),
        new THREE.Vector3(12, 0, -12),
        new THREE.Vector3(12, 0, 2),
        new THREE.Vector3(-12, 0, 2),
      ],
      1.0
    );
    this.scene.add(seeker1.group);
    this.aiSeekers.push(seeker1);

    // Seeker Hunter 2: Patrols South & West wings
    const seeker2 = new SeekerHunter(
      2,
      new THREE.Vector3(10, 0, 12),
      [
        new THREE.Vector3(12, 0, 12),
        new THREE.Vector3(-12, 0, 12),
        new THREE.Vector3(-12, 0, -2),
        new THREE.Vector3(12, 0, -2),
      ],
      1.1
    );
    this.scene.add(seeker2.group);
    this.aiSeekers.push(seeker2);
  }

  public initNetwork(client: MultiplayerClient) {
    this.networkClient = client;
  }

  public playerJump() {
    this.player.jump();
  }

  /**
   * Toggle Paint Focus (Camera smoothly orbits in 3D closer to mannequin for 360 painting)
   */
  public togglePaintFocus(): boolean {
    this.isPaintFocus = !this.isPaintFocus;
    return this.isPaintFocus;
  }

  /**
   * Adjust camera distance (Zoom In / Out)
   */
  public zoomCamera(delta: number) {
    if (this.isPaintFocus) {
      this.cameraDistance = Math.max(2.0, Math.min(4.5, this.cameraDistance + delta));
    } else {
      this.cameraDistance = Math.max(3.2, Math.min(12.0, this.cameraDistance + delta));
    }
  }

  /**
   * Rotate camera horizontally / vertically in full 3D space
   */
  public rotateCamera(deltaH: number, deltaV: number = 0) {
    this.cameraAngleH -= deltaH;
    this.cameraAngleV = Math.max(0.08, Math.min(1.35, this.cameraAngleV + deltaV));
  }

  /**
   * Fill whole body in chosen color
   */
  public fillWholeBody(color: string) {
    this.activeColor = color;
    this.player.fillAllParts(color);
  }

  /**
   * Fill a specific part (Head, Torso, Arms, Legs)
   */
  public fillBodyPart(part: BodyPart, color: string) {
    this.activeColor = color;
    this.player.fillSpecificPart(part, color);
  }

  /**
   * Undo last paint stroke
   */
  public undoPaint() {
    this.player.undoLastStroke();
  }

  /**
   * Find closest exhibit to calculate camouflage match
   */
  public getClosestExhibit(): MuseumExhibit | null {
    let closest: MuseumExhibit | null = null;
    let minDist = Infinity;
    const pPos = this.player.position;

    for (const ex of this.environment.exhibits) {
      const dist = new THREE.Vector2(pPos.x - ex.worldPosition.x, pPos.z - ex.worldPosition.z).length();
      if (dist < minDist) {
        minDist = dist;
        closest = ex;
      }
    }

    return closest;
  }

  public updateRemotePeer(data: {
    id: string;
    position: [number, number, number];
    rotationY: number;
    isFrozen: boolean;
    pose: string;
    isMoving: boolean;
  }) {
    let peer = this.remotePlayers.get(data.id);
    if (!peer) {
      peer = new PlayerCharacter(data.id, 'Người chơi');
      this.remotePlayers.set(data.id, peer);
      this.scene.add(peer.group);
    }

    peer.position.set(data.position[0], data.position[1], data.position[2]);
    peer.rotationY = data.rotationY;
    peer.group.rotation.y = data.rotationY;
    peer.isMoving = data.isMoving;

    if (data.isFrozen !== peer.isFrozen || data.pose !== peer.currentPose) {
      peer.setFreeze(data.isFrozen, data.pose as PoseType);
    }
  }

  public removeRemotePlayer(id: string) {
    const peer = this.remotePlayers.get(id);
    if (peer) {
      this.scene.remove(peer.group);
      this.remotePlayers.delete(id);
    }
  }

  public syncRoomPlayers(players: RoomPlayer[], localId: string) {
    const activeIds = new Set(players.map(p => p.id));
    this.remotePlayers.forEach((_, id) => {
      if (!activeIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    });

    players.forEach(p => {
      if (p.id !== localId) {
        let peer = this.remotePlayers.get(p.id);
        if (!peer) {
          peer = new PlayerCharacter(p.id, p.name);
          this.remotePlayers.set(p.id, peer);
          this.scene.add(peer.group);
        }
        peer.isAlive = p.isAlive;
        peer.group.visible = p.isAlive;
      }
    });
  }

  /**
   * Seeker Catch/Tag Attempt
   */
  public attemptTagHider() {
    if (this.currentRole !== 'seeker' || this.isSeekerPenalty || this.currentPhase !== 'seek') {
      return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const candidateMeshes: { mesh: THREE.Mesh; playerId: string }[] = [];
    this.remotePlayers.forEach((peer, id) => {
      if (peer.isAlive) {
        peer.allMeshList.forEach(m => {
          candidateMeshes.push({ mesh: m, playerId: id });
        });
      }
    });

    const meshesOnly = candidateMeshes.map(c => c.mesh);
    const intersects = raycaster.intersectObjects(meshesOnly, false);

    if (intersects.length > 0 && intersects[0].distance < 6.5) {
      const hitObj = candidateMeshes.find(c => c.mesh === intersects[0].object);
      if (hitObj) {
        soundEngine.playAlert();
        if (this.networkClient) {
          this.networkClient.sendTagAttempt(hitObj.playerId);
        }
        return;
      }
    }

    // False catch penalty
    const sceneIntersects = raycaster.intersectObjects(this.environment.interactiveMeshes, true);
    if (sceneIntersects.length > 0 && sceneIntersects[0].distance < 6.5) {
      this.triggerSeekerPenalty(2.0);
      if (this.networkClient) {
        this.networkClient.sendTagAttempt(undefined);
      }
    }
  }

  public triggerSeekerPenalty(duration: number) {
    this.isSeekerPenalty = true;
    this.penaltyTimer = duration;
    this.callbacks.onTagPenalty(duration);
  }

  /**
   * EXACT 3D DIRECT PAINTING:
   * Raycasts precisely against the player's 3D body meshes.
   * If hit, paints at that exact UV on that specific mesh!
   */
  public handle3DDirectPaint(clientX: number, clientY: number): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 1. Raycast against local player meshes
    const intersects = raycaster.intersectObjects(this.player.allMeshList, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitMesh = hit.object as THREE.Mesh;
      if (hit.uv) {
        this.player.paintAtExactUV(
          hitMesh,
          hit.uv,
          this.activeColor,
          this.brushSize,
          this.activeTool
        );
        return true;
      }
    }

    // 2. 3D Eyedropper on Paintings or Walls
    if (this.activeTool === 'eyedropper') {
      const sceneHits = raycaster.intersectObjects(this.environment.interactiveMeshes, true);
      if (sceneHits.length > 0) {
        const hitMesh = sceneHits[0].object as THREE.Mesh;
        const exhibit = this.environment.exhibits.find(e => e.mesh === hitMesh);
        if (exhibit && exhibit.dominantColors.length > 0) {
          this.activeColor = exhibit.dominantColors[0];
          soundEngine.playSample();
          this.callbacks.onEyedropperSampled(this.activeColor, exhibit.nameVi);
        } else {
          this.activeColor = '#d97706';
          soundEngine.playSample();
          this.callbacks.onEyedropperSampled(this.activeColor, 'Bức tường bảo tàng');
        }
        this.activeTool = 'brush';
        return true;
      }
    }

    return false;
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isSeekerPenalty) {
      this.penaltyTimer -= delta;
      if (this.penaltyTimer <= 0) {
        this.isSeekerPenalty = false;
      }
    }

    // Camouflage match calculation
    let currentMatch = 50;
    const closestExhibit = this.getClosestExhibit();
    if (closestExhibit) {
      const dist = new THREE.Vector2(
        this.player.position.x - closestExhibit.worldPosition.x,
        this.player.position.z - closestExhibit.worldPosition.z
      ).length();

      let match = 55;
      if (this.player.isFrozen) match += 30;
      if (dist < 4.2) match += 15;
      if (this.player.isMoving) match = 15;

      currentMatch = Math.min(100, match);
      this.callbacks.onBackdropDetected(closestExhibit.nameVi, currentMatch);
    }

    // Whistle in Seek phase: alert seekers
    if (this.currentPhase === 'seek' && this.player.isAlive && this.currentRole === 'hider') {
      this.whistleEngine.update(delta, this.player.position, this.aiSeekers, () => {
        // Alert AI Seekers of whistle position
        this.aiSeekers.forEach(s => s.onHearWhistle(this.player.position));

        if (this.networkClient) {
          this.networkClient.sendWhistle([this.player.position.x, this.player.position.y, this.player.position.z]);
        }
        this.callbacks.onWhistleAlert();
      });

      this.callbacks.onWhistleTimeUpdate(
        this.whistleEngine.getTimeRemaining(),
        this.whistleEngine.getProgress()
      );
    }

    // Update Patrolling AI Seekers
    if (this.currentRole === 'hider' && this.player.isAlive) {
      this.aiSeekers.forEach(seeker => {
        seeker.update(
          delta,
          this.player.position,
          this.player.isFrozen,
          currentMatch,
          [],
          () => {
            // Player caught by AI Hunter
            this.callbacks.onPlayerCaught('Bạn', true);
          },
          () => {
            soundEngine.playAlert();
          }
        );
      });
    }

    // Update movement & remote animations
    this.updatePlayerMovement(delta);
    this.remotePlayers.forEach(peer => peer.update(delta));

    // Smooth 3D camera tracking
    this.updateCamera(delta);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Smooth movement with D-Pad & Keyboard
   */
  public triggerDirectionalMove(dx: number, dz: number) {
    this.joystickVector.x = dx;
    this.joystickVector.y = dz;
  }

  private updatePlayerMovement(delta: number) {
    if (this.player.isFrozen || this.isSeekerPenalty) {
      this.player.isMoving = false;
      return;
    }

    const moveInput = new THREE.Vector3();

    // WASD and Arrow Keys
    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveInput.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveInput.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveInput.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveInput.x += 1;

    // Directional controls / Joystick
    if (Math.abs(this.joystickVector.x) > 0.04 || Math.abs(this.joystickVector.y) > 0.04) {
      moveInput.x += this.joystickVector.x;
      moveInput.z += this.joystickVector.y;
    }

    const isMoving = moveInput.lengthSq() > 0.01;
    this.player.isMoving = isMoving;

    if (isMoving) {
      moveInput.normalize();

      const camForward = new THREE.Vector3(-Math.sin(this.cameraAngleH), 0, -Math.cos(this.cameraAngleH));
      const camRight = new THREE.Vector3(Math.cos(this.cameraAngleH), 0, -Math.sin(this.cameraAngleH));

      const worldMoveDir = new THREE.Vector3()
        .addScaledVector(camRight, moveInput.x)
        .addScaledVector(camForward, -moveInput.z)
        .normalize();

      const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 5.6 : 3.9;
      const stepX = worldMoveDir.x * speed * delta;
      const stepZ = worldMoveDir.z * speed * delta;

      // Smooth collision check: sliding along walls without sticking
      const nextPosX = new THREE.Vector3(this.player.position.x + stepX, 0, this.player.position.z);
      if (!this.environment.checkCollision(nextPosX)) {
        this.player.position.x += stepX;
      }

      const nextPosZ = new THREE.Vector3(this.player.position.x, 0, this.player.position.z + stepZ);
      if (!this.environment.checkCollision(nextPosZ)) {
        this.player.position.z += stepZ;
      }

      const targetAngle = Math.atan2(worldMoveDir.x, worldMoveDir.z);
      this.player.rotationY = this.lerpAngle(this.player.rotationY, targetAngle, delta * 14);

      if (Math.random() < 0.08) {
        soundEngine.playStep();
      }
    }

    this.player.update(delta);

    // Send transform to network
    if (this.networkClient) {
      this.networkClient.sendTransform(
        [this.player.position.x, this.player.position.y, this.player.position.z],
        this.player.rotationY,
        this.player.isFrozen,
        this.player.currentPose,
        this.player.isMoving
      );
    }
  }

  /**
   * Smooth orbital camera with 3D depth and damping
   */
  private updateCamera(delta: number) {
    if (this.currentRole === 'seeker') {
      const target = this.player.position.clone().add(new THREE.Vector3(0, 1.6, 0));
      const x = target.x + 3.2 * Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV);
      const y = target.y + 3.2 * Math.sin(this.cameraAngleV);
      const z = target.z + 3.2 * Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV);
      this.camera.position.lerp(new THREE.Vector3(x, y, z), delta * 12);
      this.camera.lookAt(target);
    } else {
      // In Paint Mode, camera orbits closer at 3.0m in 3D
      const lookY = this.isPaintFocus ? 1.05 : 1.2;
      const targetDist = this.isPaintFocus ? 3.0 : this.cameraDistance;

      const target = this.player.position.clone().add(new THREE.Vector3(0, lookY, 0));
      const x = target.x + targetDist * Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV);
      const y = target.y + targetDist * Math.sin(this.cameraAngleV);
      const z = target.z + targetDist * Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV);

      this.targetCameraPos.set(x, y, z);
      this.camera.position.lerp(this.targetCameraPos, Math.min(1, delta * 10));
      this.targetLookAt.lerp(target, Math.min(1, delta * 10));
      this.camera.lookAt(this.targetLookAt);
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    el.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    this.keys[e.key] = true;

    if (e.code === 'Space') {
      e.preventDefault();
      if (this.currentRole === 'seeker') {
        this.attemptTagHider();
      } else if (this.player.isFrozen) {
        // If frozen, space unfreezes
        this.player.setFreeze(false);
        soundEngine.playFreeze(false);
      } else {
        // If not frozen, space makes player JUMP in 3D!
        this.player.jump();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key] = false;
  };

  private handleWindowBlur = () => {
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
  };

  private handlePointerDown = (e: PointerEvent) => {
    // 1. Try to paint directly on the 3D character!
    const hitCharacter = this.handle3DDirectPaint(e.clientX, e.clientY);
    if (hitCharacter) {
      this.isPaintingOnCharacter = true;
      this.isCameraDragging = false;
      return;
    }

    // 2. Seeker tag attempt
    if (this.currentRole === 'seeker' && this.currentPhase === 'seek' && !this.isSeekerPenalty) {
      this.attemptTagHider();
      return;
    }

    // 3. Otherwise: Orbit 3D Camera around character
    this.isCameraDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isPaintingOnCharacter && e.buttons === 1) {
      this.handle3DDirectPaint(e.clientX, e.clientY);
      return;
    }

    if (!this.isCameraDragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    this.rotateCamera(dx * 0.005, dy * 0.005);
  };

  private handlePointerUp = () => {
    this.isCameraDragging = false;
    if (this.isPaintingOnCharacter) {
      this.isPaintingOnCharacter = false;
      this.player.endPaintStroke();
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoomCamera(e.deltaY * 0.006);
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private lerpAngle(from: number, to: number, t: number): number {
    const diff = (to - from + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return from + diff * Math.min(1, Math.max(0, t));
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('resize', this.handleResize);

    const el = this.renderer?.domElement;
    if (el) {
      el.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerup', this.handlePointerUp);
      el.removeEventListener('wheel', this.handleWheel);
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
    }
    this.renderer?.dispose();
  }
}
