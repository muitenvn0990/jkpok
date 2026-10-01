import * as THREE from 'three';
import { SeekerState } from '../types/game';

export class SeekerHunter {
  public group: THREE.Group;
  public position: THREE.Vector3;
  public rotationY: number = 0;
  public state: SeekerState = 'patrol';

  // AI Parameters
  public patrolSpeed: number = 2.4;
  public chaseSpeed: number = 4.2;
  public visionDistance: number = 13.5;
  public visionAngle: number = (52 * Math.PI) / 180; // 52 degrees FOV
  public suspicion: number = 0; // 0 to 100%

  // Patrol waypoints in the museum
  public waypoints: THREE.Vector3[] = [];
  public currentWaypointIndex: number = 0;
  private waitTimer: number = 0;
  private scanTimer: number = 0;
  private scanDirection: number = 1;

  // Sound investigation target
  public investigateTarget: THREE.Vector3 | null = null;
  public investigateTimer: number = 0;

  // 3D Components
  public spotLight: THREE.SpotLight;
  public visionConeMesh: THREE.Mesh;
  public alertMarker: THREE.Sprite;
  private alertCanvas: HTMLCanvasElement;
  private alertTexture: THREE.CanvasTexture;
  private flashLightMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;

  // Animation
  private walkTime: number = 0;
  public hasCaughtPlayer: boolean = false;

  constructor(id: number, startPos: THREE.Vector3, waypoints: THREE.Vector3[], speedMultiplier: number = 1.0) {
    this.group = new THREE.Group();
    this.group.name = `seeker_${id}`;
    this.position = this.group.position;
    this.position.copy(startPos);

    this.patrolSpeed *= speedMultiplier;
    this.chaseSpeed *= speedMultiplier;
    this.waypoints = waypoints;

    // 1. Character Body (Inspector / Security Guard with Trenchcoat)
    const coatMat = new THREE.MeshStandardMaterial({
      color: id === 1 ? 0x1e293b : 0x3f3f46,
      roughness: 0.8,
    });
    this.bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.25, 16), coatMat);
    this.bodyMesh.position.y = 0.85;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Head
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });
    this.headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
    this.headMesh.position.y = 1.62;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Inspector Hat (Fedora)
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 16), hatMat);
    hatBrim.position.y = 1.8;
    this.group.add(hatBrim);

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.28, 16), hatMat);
    hatCrown.position.y = 1.94;
    this.group.add(hatCrown);

    // Flashlight in hand
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    this.flashLightMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4, 12), metalMat);
    this.flashLightMesh.rotation.x = Math.PI / 2;
    this.flashLightMesh.position.set(0.35, 1.1, 0.35);
    this.group.add(this.flashLightMesh);

    // 2. Real Spotlight for flashlight
    this.spotLight = new THREE.SpotLight(0xfef08a, 18, this.visionDistance, this.visionAngle, 0.35, 1.2);
    this.spotLight.position.set(0.35, 1.1, 0.4);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 512;
    this.spotLight.shadow.mapSize.height = 512;

    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, 10);
    this.group.add(spotTarget);
    this.spotLight.target = spotTarget;
    this.group.add(this.spotLight);

    // 3. Volumetric Vision Cone Mesh (Translucent glowing cone projecting from flashlight)
    const coneRadius = Math.tan(this.visionAngle) * this.visionDistance;
    const coneGeo = new THREE.ConeGeometry(coneRadius, this.visionDistance, 24, 1, true);
    // Orient cone so tip is at origin, pointing down +Z
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, this.visionDistance / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.visionConeMesh = new THREE.Mesh(coneGeo, coneMat);
    this.visionConeMesh.position.set(0, 1.05, 0.2);
    this.group.add(this.visionConeMesh);

    // 4. Floating Alert Sprite Indicator ("?", "!", or normal)
    this.alertCanvas = document.createElement('canvas');
    this.alertCanvas.width = 128;
    this.alertCanvas.height = 128;
    this.alertTexture = new THREE.CanvasTexture(this.alertCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: this.alertTexture, transparent: true, depthWrite: false });
    this.alertMarker = new THREE.Sprite(spriteMat);
    this.alertMarker.scale.set(1.1, 1.1, 1.1);
    this.alertMarker.position.y = 2.45;
    this.alertMarker.visible = false;
    this.group.add(this.alertMarker);

    this.updateAlertMarker();
  }

  /**
   * Draw alert bubble on sprite texture
   */
  public updateAlertMarker() {
    const ctx = this.alertCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);

    if (this.state === 'alert' || this.state === 'chase' || this.suspicion >= 90) {
      // Crimson "!"
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 64, 62);
      this.alertMarker.visible = true;
    } else if (this.state === 'investigate_sound') {
      // Audio note / Whistle ear icon
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♫?', 64, 62);
      this.alertMarker.visible = true;
    } else if (this.suspicion > 25) {
      // Amber "?"
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 64, 60);
      this.alertMarker.visible = true;
    } else {
      this.alertMarker.visible = false;
    }

    this.alertTexture.needsUpdate = true;
  }

  /**
   * Called when player whistles to distract / attract seeker
   */
  public onHearWhistle(whistlePos: THREE.Vector3) {
    if (this.state === 'chase') return; // Don't interrupt active chase

    const dist = this.position.distanceTo(whistlePos);
    if (dist < 26) {
      // Within auditory hearing radius
      this.state = 'investigate_sound';
      this.investigateTarget = whistlePos.clone();
      this.investigateTimer = 7.5; // Investigate for 7.5 seconds
      this.updateAlertMarker();
    }
  }

  /**
   * Main AI Update Loop
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerFrozen: boolean,
    camoMatchPercentage: number,
    colliders: THREE.Box3[],
    onCatchPlayer: () => void,
    onAlertTriggered: () => void
  ) {
    // 1. Line-of-sight & Camouflage Check
    this.evaluatePlayerVision(
      delta,
      playerPos,
      isPlayerFrozen,
      camoMatchPercentage,
      colliders,
      onAlertTriggered
    );

    // 2. State Machine Logic
    switch (this.state) {
      case 'chase':
        this.updateChase(delta, playerPos, onCatchPlayer);
        break;
      case 'investigate_sound':
        this.updateInvestigate(delta);
        break;
      case 'scan':
        this.updateScan(delta);
        break;
      case 'patrol':
      default:
        this.updatePatrol(delta);
        break;
    }

    // 3. Update Visuals (Spotlight & Cone colors according to suspicion)
    this.updateVisionConeVisuals();
    this.updateAlertMarker();

    // 4. Bobbing walk animation
    if (this.state === 'patrol' || this.state === 'chase' || this.state === 'investigate_sound') {
      this.walkTime += delta * (this.state === 'chase' ? 12 : 6);
      this.bodyMesh.position.y = 0.85 + Math.abs(Math.sin(this.walkTime)) * 0.05;
      this.headMesh.position.y = 1.62 + Math.abs(Math.sin(this.walkTime)) * 0.05;
    }
  }

  /**
   * Calculate whether player is inside vision cone and raycast line of sight
   */
  private evaluatePlayerVision(
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerFrozen: boolean,
    camoMatchPercentage: number,
    colliders: THREE.Box3[],
    onAlertTriggered: () => void
  ) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const dist = toPlayer.length();

    // Check maximum vision distance
    if (dist > this.visionDistance) {
      // Decay suspicion slowly if player is far away
      if (this.state !== 'chase') {
        this.suspicion = Math.max(0, this.suspicion - delta * 15);
      }
      return;
    }

    // Check angle relative to seeker's forward direction
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    const angle = forward.angleTo(toPlayer.clone().normalize());

    if (angle > this.visionAngle) {
      // Outside vision cone
      if (this.state !== 'chase') {
        this.suspicion = Math.max(0, this.suspicion - delta * 15);
      }
      return;
    }

    // Check occlusion with museum walls and pillars
    const rayOrigin = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const rayDir = toPlayer.clone().normalize();
    const ray = new THREE.Ray(rayOrigin, rayDir);

    for (const box of colliders) {
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && hit.distanceTo(rayOrigin) < dist - 0.4) {
        // Obstructed by obstacle!
        if (this.state !== 'chase') {
          this.suspicion = Math.max(0, this.suspicion - delta * 12);
        }
        return;
      }
    }

    // PLAYER IS IN CLEAR LINE OF SIGHT!
    // Now evaluate Camouflage & Movement:

    if (!isPlayerFrozen) {
      // Player is MOVING or NOT FROZEN: movement catches human eye immediately!
      this.suspicion += delta * 60; // 0 to 100% in ~1.6s
    } else {
      // Player is FROZEN in pose:
      if (camoMatchPercentage >= 78) {
        // Master camouflage! Seeker completely overlooks player!
        // Mild decay or capped at 0
        this.suspicion = Math.max(0, this.suspicion - delta * 20);
      } else if (camoMatchPercentage >= 55) {
        // Moderate match: Seeker pauses to scrutinize
        this.suspicion += delta * 18;
      } else {
        // Poor camouflage (e.g. blank white against red brick): Seeker notices discrepancy quickly!
        this.suspicion += delta * 42;
      }
    }

    this.suspicion = Math.min(100, Math.max(0, this.suspicion));

    // Check trigger chase
    if (this.suspicion >= 100 && this.state !== 'chase') {
      this.state = 'chase';
      onAlertTriggered();
    }
  }

  /**
   * Patrol between museum waypoints
   */
  private updatePatrol(delta: number) {
    if (this.waypoints.length === 0) return;

    if (this.waitTimer > 0) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        // Advance to next waypoint
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
      return;
    }

    const target = this.waypoints[this.currentWaypointIndex];
    const diff = new THREE.Vector3().subVectors(target, this.position);
    diff.y = 0;
    const dist = diff.length();

    if (dist < 0.6) {
      // Arrived at waypoint! Enter scan mode
      this.state = 'scan';
      this.scanTimer = 3.5; // Scan for 3.5s
      return;
    }

    // Move toward waypoint
    const dir = diff.normalize();
    this.position.addScaledVector(dir, this.patrolSpeed * delta);

    // Rotate smoothly to face direction
    const targetAngle = Math.atan2(dir.x, dir.z);
    this.rotationY = this.lerpAngle(this.rotationY, targetAngle, delta * 6);
    this.group.rotation.y = this.rotationY;
  }

  /**
   * Scan mode: Look left and right at exhibits
   */
  private updateScan(delta: number) {
    this.scanTimer -= delta;

    // Sweep cone back and forth
    const sweepSpeed = 1.4;
    this.rotationY += this.scanDirection * sweepSpeed * delta;

    if (this.scanTimer <= 0) {
      this.state = 'patrol';
      this.waitTimer = 0.5;
      this.scanDirection = -this.scanDirection;
    }

    this.group.rotation.y = this.rotationY;
  }

  /**
   * Investigate sound origin from whistle
   */
  private updateInvestigate(delta: number) {
    if (!this.investigateTarget) {
      this.state = 'patrol';
      return;
    }

    this.investigateTimer -= delta;
    const diff = new THREE.Vector3().subVectors(this.investigateTarget, this.position);
    diff.y = 0;
    const dist = diff.length();

    if (dist < 1.0 || this.investigateTimer <= 0) {
      // Arrived at noise origin, look around
      this.state = 'scan';
      this.scanTimer = 4.0;
      this.investigateTarget = null;
      return;
    }

    // Move towards sound with alert haste
    const dir = diff.normalize();
    this.position.addScaledVector(dir, this.patrolSpeed * 1.35 * delta);

    const targetAngle = Math.atan2(dir.x, dir.z);
    this.rotationY = this.lerpAngle(this.rotationY, targetAngle, delta * 7);
    this.group.rotation.y = this.rotationY;
  }

  /**
   * Chase Player when spotted
   */
  private updateChase(delta: number, playerPos: THREE.Vector3, onCatchPlayer: () => void) {
    const diff = new THREE.Vector3().subVectors(playerPos, this.position);
    diff.y = 0;
    const dist = diff.length();

    if (dist < 1.35 && !this.hasCaughtPlayer) {
      this.hasCaughtPlayer = true;
      onCatchPlayer();
      return;
    }

    // Charge directly at player
    const dir = diff.normalize();
    this.position.addScaledVector(dir, this.chaseSpeed * delta);

    const targetAngle = Math.atan2(dir.x, dir.z);
    this.rotationY = this.lerpAngle(this.rotationY, targetAngle, delta * 9);
    this.group.rotation.y = this.rotationY;
  }

  /**
   * Update visual color of flashlight and vision cone
   */
  private updateVisionConeVisuals() {
    const coneMat = this.visionConeMesh.material as THREE.MeshBasicMaterial;

    if (this.state === 'chase' || this.suspicion >= 90) {
      // Crimson Red Alert
      this.spotLight.color.setHex(0xef4444);
      coneMat.color.setHex(0xef4444);
      coneMat.opacity = 0.28 + Math.sin(Date.now() * 0.015) * 0.08;
    } else if (this.suspicion > 30 || this.state === 'investigate_sound') {
      // Suspicious Orange
      this.spotLight.color.setHex(0xf97316);
      coneMat.color.setHex(0xf97316);
      coneMat.opacity = 0.22;
    } else {
      // Normal Warm Yellow
      this.spotLight.color.setHex(0xfef08a);
      coneMat.color.setHex(0xfef08a);
      coneMat.opacity = 0.15;
    }
  }

  private lerpAngle(from: number, to: number, t: number): number {
    const diff = (to - from + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return from + diff * Math.min(1, Math.max(0, t));
  }
}
