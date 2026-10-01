import * as THREE from 'three';
import { BodyPart, PoseType } from '../types/game';
import { soundEngine } from './audio';

export type PaintTool = 'brush' | 'bucket' | 'eraser' | 'eyedropper';

export interface PaintablePart {
  part: BodyPart;
  mesh: THREE.Mesh;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
}

export class PlayerCharacter {
  public id: string;
  public name: string;
  public group: THREE.Group;
  public mannequinRoot: THREE.Group;

  // Joint hierarchy
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private chestGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShinGroup: THREE.Group;
  private rightShinGroup: THREE.Group;

  // Body parts list with dedicated canvas textures: 100% accurate, zero bleeding!
  public paintableParts: Map<THREE.Mesh, PaintablePart> = new Map();
  public allMeshList: THREE.Mesh[] = [];

  // Transform states
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public isMoving: boolean = false;
  public isFrozen: boolean = false;
  public isAlive: boolean = true;
  public currentPose: PoseType = 'standing';

  // Animation
  private walkTime: number = 0;
  private freezeRingMesh: THREE.Mesh;

  // Undo history (stores snapshots of each part's canvas)
  private historyStack: { part: THREE.Mesh; data: ImageData }[] = [];

  // Track last painted UV for smooth stroke interpolation
  private lastPaintedMesh: THREE.Mesh | null = null;
  private lastPaintedUV: THREE.Vector2 | null = null;

  constructor(id: string = 'local', name: string = 'Họa Sĩ Trốn') {
    this.id = id;
    this.name = name;
    this.group = new THREE.Group();
    this.group.name = `player_${id}`;
    this.position = this.group.position;

    this.mannequinRoot = new THREE.Group();
    this.group.add(this.mannequinRoot);

    this.torsoGroup = new THREE.Group();
    this.chestGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftForearmGroup = new THREE.Group();
    this.rightForearmGroup = new THREE.Group();
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.leftShinGroup = new THREE.Group();
    this.rightShinGroup = new THREE.Group();

    // Build the completely ROUNDED, organic mannequin (Capsules & Spheres, ZERO BOXES!)
    this.buildRoundedMannequin();

    // Freeze ground indicator ring (glowing cyan circle)
    const ringGeo = new THREE.RingGeometry(0.75, 0.9, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.freezeRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.freezeRingMesh.position.y = 0.03;
    this.group.add(this.freezeRingMesh);

    // Initial fill with classic white plaster
    this.fillAllParts('#f8fafc', false);
  }

  /**
   * Helper to create a dedicated high-precision canvas texture for each mesh
   */
  private createPartMaterial(part: BodyPart, width: number = 256, height: number = 256): {
    material: THREE.MeshStandardMaterial;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.05,
    });

    return { material, canvas, ctx, texture };
  }

  private registerPaintableMesh(
    mesh: THREE.Mesh,
    part: BodyPart,
    pData: {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
    }
  ) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.geometry.computeVertexNormals();
    this.allMeshList.push(mesh);
    this.paintableParts.set(mesh, {
      part,
      mesh,
      canvas: pData.canvas,
      ctx: pData.ctx,
      texture: pData.texture,
    });
  }

  /**
   * BUILD COMPLETELY ROUNDED MANNEQUIN:
   * Uses CapsuleGeometry and SphereGeometry throughout.
   * NO blocky boxes, NO square corners, NO weird protruding cubes!
   */
  private buildRoundedMannequin() {
    // 1. Pelvis / Hips (Smooth rounded sphere-ellipsoid)
    const pelvisData = this.createPartMaterial('torso', 256, 256);
    const pelvisGeo = new THREE.SphereGeometry(0.24, 28, 24);
    pelvisGeo.scale(1.15, 0.88, 0.95);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pelvisData.material);
    pelvisMesh.position.y = 0.9;
    this.mannequinRoot.add(pelvisMesh);
    this.registerPaintableMesh(pelvisMesh, 'torso', pelvisData);

    // 2. Lower Abdomen / Torso (Smooth Capsule)
    this.torsoGroup.position.set(0, 0.96, 0);
    this.mannequinRoot.add(this.torsoGroup);

    const torsoData = this.createPartMaterial('torso', 256, 256);
    const torsoGeo = new THREE.CapsuleGeometry(0.21, 0.22, 20, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoData.material);
    torsoMesh.position.y = 0.16;
    this.torsoGroup.add(torsoMesh);
    this.registerPaintableMesh(torsoMesh, 'torso', torsoData);

    // 3. Chest (Upper Torso - Rounded Capsule with subtle broadness)
    this.chestGroup.position.set(0, 0.32, 0);
    this.torsoGroup.add(this.chestGroup);

    const chestData = this.createPartMaterial('torso', 256, 256);
    const chestGeo = new THREE.CapsuleGeometry(0.25, 0.28, 20, 24);
    chestGeo.scale(1.14, 1.0, 0.86); // Rounded chest curve
    const chestMesh = new THREE.Mesh(chestGeo, chestData.material);
    chestMesh.position.y = 0.2;
    this.chestGroup.add(chestMesh);
    this.registerPaintableMesh(chestMesh, 'torso', chestData);

    // 4. Neck & Head (Smooth Capsule & Oval Sphere)
    this.headGroup.position.set(0, 0.44, 0);
    this.chestGroup.add(this.headGroup);

    const neckData = this.createPartMaterial('head', 128, 128);
    const neckGeo = new THREE.CapsuleGeometry(0.085, 0.12, 16, 20);
    const neckMesh = new THREE.Mesh(neckGeo, neckData.material);
    neckMesh.position.y = 0.08;
    this.headGroup.add(neckMesh);
    this.registerPaintableMesh(neckMesh, 'head', neckData);

    // Head: Perfectly smooth rounded mannequin head
    const headData = this.createPartMaterial('head', 256, 256);
    const headGeo = new THREE.SphereGeometry(0.25, 32, 28);
    headGeo.scale(1.0, 1.26, 1.06); // Elegant smooth mannequin egg shape
    const headMesh = new THREE.Mesh(headGeo, headData.material);
    headMesh.position.y = 0.35;
    this.headGroup.add(headMesh);
    this.registerPaintableMesh(headMesh, 'head', headData);

    // 5. Left Arm (Shoulder sphere, Upper arm capsule, Elbow sphere, Forearm capsule, Rounded hand)
    this.leftArmGroup.position.set(0.38, 0.34, 0);
    this.chestGroup.add(this.leftArmGroup);

    const lShoulderData = this.createPartMaterial('arms', 128, 128);
    const lShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), lShoulderData.material);
    this.leftArmGroup.add(lShoulderMesh);
    this.registerPaintableMesh(lShoulderMesh, 'arms', lShoulderData);

    const lUpperArmData = this.createPartMaterial('arms', 128, 256);
    const lUpperArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.25, 16, 20), lUpperArmData.material);
    lUpperArmMesh.position.y = -0.22;
    this.leftArmGroup.add(lUpperArmMesh);
    this.registerPaintableMesh(lUpperArmMesh, 'arms', lUpperArmData);

    this.leftForearmGroup.position.set(0, -0.4, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const lElbowData = this.createPartMaterial('arms', 128, 128);
    const lElbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), lElbowData.material);
    this.leftForearmGroup.add(lElbowMesh);
    this.registerPaintableMesh(lElbowMesh, 'arms', lElbowData);

    const lForearmData = this.createPartMaterial('arms', 128, 256);
    const lForearmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 16, 20), lForearmData.material);
    lForearmMesh.position.y = -0.18;
    this.leftForearmGroup.add(lForearmMesh);
    this.registerPaintableMesh(lForearmMesh, 'arms', lForearmData);

    // Hand: Smooth rounded capsule (no sharp box edges!)
    const lHandData = this.createPartMaterial('arms', 128, 128);
    const lHandMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.12, 16, 16), lHandData.material);
    lHandMesh.position.y = -0.36;
    this.leftForearmGroup.add(lHandMesh);
    this.registerPaintableMesh(lHandMesh, 'arms', lHandData);

    // 6. Right Arm (Mirror of Left Arm)
    this.rightArmGroup.position.set(-0.38, 0.34, 0);
    this.chestGroup.add(this.rightArmGroup);

    const rShoulderData = this.createPartMaterial('arms', 128, 128);
    const rShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), rShoulderData.material);
    this.rightArmGroup.add(rShoulderMesh);
    this.registerPaintableMesh(rShoulderMesh, 'arms', rShoulderData);

    const rUpperArmData = this.createPartMaterial('arms', 128, 256);
    const rUpperArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.25, 16, 20), rUpperArmData.material);
    rUpperArmMesh.position.y = -0.22;
    this.rightArmGroup.add(rUpperArmMesh);
    this.registerPaintableMesh(rUpperArmMesh, 'arms', rUpperArmData);

    this.rightForearmGroup.position.set(0, -0.4, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rElbowData = this.createPartMaterial('arms', 128, 128);
    const rElbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), rElbowData.material);
    this.rightForearmGroup.add(rElbowMesh);
    this.registerPaintableMesh(rElbowMesh, 'arms', rElbowData);

    const rForearmData = this.createPartMaterial('arms', 128, 256);
    const rForearmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 16, 20), rForearmData.material);
    rForearmMesh.position.y = -0.18;
    this.rightForearmGroup.add(rForearmMesh);
    this.registerPaintableMesh(rForearmMesh, 'arms', rForearmData);

    const rHandData = this.createPartMaterial('arms', 128, 128);
    const rHandMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.12, 16, 16), rHandData.material);
    rHandMesh.position.y = -0.36;
    this.rightForearmGroup.add(rHandMesh);
    this.registerPaintableMesh(rHandMesh, 'arms', rHandData);

    // 7. Left Leg (Hip sphere, Thigh capsule, Knee sphere, Shin capsule, Rounded foot)
    this.leftLegGroup.position.set(0.18, 0.84, 0);
    this.mannequinRoot.add(this.leftLegGroup);

    const lHipData = this.createPartMaterial('legs', 128, 128);
    const lHipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), lHipData.material);
    this.leftLegGroup.add(lHipMesh);
    this.registerPaintableMesh(lHipMesh, 'legs', lHipData);

    const lThighData = this.createPartMaterial('legs', 128, 256);
    const lThighMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 16, 20), lThighData.material);
    lThighMesh.position.y = -0.24;
    this.leftLegGroup.add(lThighMesh);
    this.registerPaintableMesh(lThighMesh, 'legs', lThighData);

    this.leftShinGroup.position.set(0, -0.48, 0);
    this.leftLegGroup.add(this.leftShinGroup);

    const lKneeData = this.createPartMaterial('legs', 128, 128);
    const lKneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), lKneeData.material);
    this.leftShinGroup.add(lKneeMesh);
    this.registerPaintableMesh(lKneeMesh, 'legs', lKneeData);

    const lShinData = this.createPartMaterial('legs', 128, 256);
    const lShinMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.3, 16, 20), lShinData.material);
    lShinMesh.position.y = -0.22;
    this.leftShinGroup.add(lShinMesh);
    this.registerPaintableMesh(lShinMesh, 'legs', lShinData);

    // Foot: Smooth rounded capsule aligned with walking direction (no blocky box!)
    const lFootData = this.createPartMaterial('legs', 128, 128);
    const lFootMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.16, 16, 16), lFootData.material);
    lFootMesh.rotation.x = Math.PI / 2;
    lFootMesh.position.set(0, -0.42, 0.07);
    this.leftShinGroup.add(lFootMesh);
    this.registerPaintableMesh(lFootMesh, 'legs', lFootData);

    // 8. Right Leg (Mirror of Left Leg)
    this.rightLegGroup.position.set(-0.18, 0.84, 0);
    this.mannequinRoot.add(this.rightLegGroup);

    const rHipData = this.createPartMaterial('legs', 128, 128);
    const rHipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), rHipData.material);
    this.rightLegGroup.add(rHipMesh);
    this.registerPaintableMesh(rHipMesh, 'legs', rHipData);

    const rThighData = this.createPartMaterial('legs', 128, 256);
    const rThighMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 16, 20), rThighData.material);
    rThighMesh.position.y = -0.24;
    this.rightLegGroup.add(rThighMesh);
    this.registerPaintableMesh(rThighMesh, 'legs', rThighData);

    this.rightShinGroup.position.set(0, -0.48, 0);
    this.rightLegGroup.add(this.rightShinGroup);

    const rKneeData = this.createPartMaterial('legs', 128, 128);
    const rKneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), rKneeData.material);
    this.rightShinGroup.add(rKneeMesh);
    this.registerPaintableMesh(rKneeMesh, 'legs', rKneeData);

    const rShinData = this.createPartMaterial('legs', 128, 256);
    const rShinMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.3, 16, 20), rShinData.material);
    rShinMesh.position.y = -0.22;
    this.rightShinGroup.add(rShinMesh);
    this.registerPaintableMesh(rShinMesh, 'legs', rShinData);

    const rFootData = this.createPartMaterial('legs', 128, 128);
    const rFootMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.16, 16, 16), rFootData.material);
    rFootMesh.rotation.x = Math.PI / 2;
    rFootMesh.position.set(0, -0.42, 0.07);
    this.rightShinGroup.add(rFootMesh);
    this.registerPaintableMesh(rFootMesh, 'legs', rFootData);
  }

  /**
   * EXACT, PRECISE 3D DIRECT PAINTING:
   * Paints ONLY on the exact mesh and UV coordinate touched!
   * ZERO blotches appearing on other body parts!
   */
  public paintAtExactUV(
    mesh: THREE.Mesh,
    uv: THREE.Vector2,
    color: string,
    brushRadius: number = 18,
    tool: PaintTool = 'brush'
  ) {
    const partData = this.paintableParts.get(mesh);
    if (!partData) return;

    const ctx = partData.ctx;
    const w = partData.canvas.width;
    const h = partData.canvas.height;

    // Save snapshot for undo (limit to 30 history states)
    this.historyStack.push({
      part: mesh,
      data: ctx.getImageData(0, 0, w, h),
    });
    if (this.historyStack.length > 30) this.historyStack.shift();

    if (tool === 'bucket') {
      // Paint bucket fills this clicked part completely
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      partData.texture.needsUpdate = true;
      soundEngine.playSpray();
      return;
    }

    const drawColor = tool === 'eraser' ? '#f8fafc' : color;

    // Map UV (0..1) to canvas coordinates
    const cx = uv.x * w;
    const cy = (1 - uv.y) * h;

    ctx.save();

    // If continuing stroke on the same mesh, draw an interpolated line to prevent dotted gaps
    if (this.lastPaintedMesh === mesh && this.lastPaintedUV) {
      const px = this.lastPaintedUV.x * w;
      const py = (1 - this.lastPaintedUV.y) * h;

      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushRadius * 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    // Soft-edged circular dab
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, brushRadius);
    radGrad.addColorStop(0, drawColor);
    radGrad.addColorStop(0.75, drawColor);
    radGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, brushRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    partData.texture.needsUpdate = true;

    this.lastPaintedMesh = mesh;
    this.lastPaintedUV = uv.clone();

    if (Math.random() < 0.3) {
      soundEngine.playSpray();
    }
  }

  public endPaintStroke() {
    this.lastPaintedMesh = null;
    this.lastPaintedUV = null;
  }

  /**
   * Fill the entire character in a solid chosen color
   */
  public fillAllParts(color: string, playSound: boolean = true) {
    this.paintableParts.forEach(p => {
      p.ctx.fillStyle = color;
      p.ctx.fillRect(0, 0, p.canvas.width, p.canvas.height);
      p.texture.needsUpdate = true;
    });
    if (playSound) soundEngine.playSpray();
  }

  /**
   * Fill a specific body part category (Head, Torso, Arms, or Legs)
   */
  public fillSpecificPart(targetPart: BodyPart, color: string) {
    this.paintableParts.forEach(p => {
      if (p.part === targetPart || targetPart === 'all') {
        p.ctx.fillStyle = color;
        p.ctx.fillRect(0, 0, p.canvas.width, p.canvas.height);
        p.texture.needsUpdate = true;
      }
    });
    soundEngine.playSpray();
  }

  public getMainColor(): string {
    const firstPart = this.paintableParts.values().next().value;
    if (firstPart) {
      const pix = firstPart.ctx.getImageData(64, 64, 1, 1).data;
      return `#${((1 << 24) + (pix[0] << 16) + (pix[1] << 8) + pix[2]).toString(16).slice(1)}`;
    }
    return '#f8fafc';
  }

  /**
   * Undo last paint stroke
   */
  public undoLastStroke(): boolean {
    if (this.historyStack.length === 0) return false;
    const last = this.historyStack.pop()!;
    const pData = this.paintableParts.get(last.part);
    if (pData) {
      pData.ctx.putImageData(last.data, 0, 0);
      pData.texture.needsUpdate = true;
      return true;
    }
    return false;
  }

  public setFreeze(frozen: boolean, pose?: PoseType) {
    this.isFrozen = frozen;
    if (pose) {
      this.currentPose = pose;
    }
    if (frozen) {
      this.velocity.set(0, 0, 0);
      this.isMoving = false;
      this.applyPose(this.currentPose);
      (this.freezeRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
    } else {
      (this.freezeRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      this.resetPoseToStanding();
    }
  }

  public applyPose(pose: PoseType) {
    this.currentPose = pose;
    this.resetRotations();

    switch (pose) {
      case 'statue_classical':
        this.chestGroup.rotation.y = 0.2;
        this.headGroup.rotation.set(0.1, -0.3, 0.1);
        this.rightArmGroup.rotation.set(-1.6, 0.4, -0.8);
        this.rightForearmGroup.rotation.set(-1.2, 0, 0.6);
        this.leftArmGroup.rotation.set(0.3, 0, 0.5);
        this.leftForearmGroup.rotation.set(0.8, 0, 0.6);
        this.rightLegGroup.rotation.set(0.1, 0, -0.1);
        this.leftLegGroup.rotation.set(-0.2, 0, 0.15);
        this.leftShinGroup.rotation.set(0.3, 0, 0);
        break;

      case 'wall_hug':
        this.mannequinRoot.rotation.x = -0.05;
        this.chestGroup.position.z = -0.08;
        this.headGroup.rotation.set(0, 1.4, 0);
        this.leftArmGroup.rotation.set(0, 0, 1.45);
        this.rightArmGroup.rotation.set(0, 0, -1.45);
        this.leftForearmGroup.rotation.set(0, 0, 0.1);
        this.rightForearmGroup.rotation.set(0, 0, -0.1);
        this.leftLegGroup.rotation.set(0, 0, 0.18);
        this.rightLegGroup.rotation.set(0, 0, -0.18);
        break;

      case 'thinker':
        this.torsoGroup.rotation.set(0.7, 0.2, 0);
        this.chestGroup.rotation.set(0.2, 0, 0);
        this.headGroup.rotation.set(0.4, -0.1, 0);
        this.rightArmGroup.rotation.set(-1.4, 0.3, -0.4);
        this.rightForearmGroup.rotation.set(-1.3, 0, 0.8);
        this.leftArmGroup.rotation.set(0.3, 0, 0.4);
        this.leftForearmGroup.rotation.set(0.9, 0, 0);
        this.leftLegGroup.rotation.set(-1.1, 0, 0);
        this.leftShinGroup.rotation.set(1.4, 0, 0);
        this.rightLegGroup.rotation.set(-0.6, 0, -0.2);
        this.rightShinGroup.rotation.set(0.9, 0, 0);
        this.mannequinRoot.position.y = -0.28;
        break;

      case 'crouch_bush':
        this.torsoGroup.rotation.set(0.9, 0, 0);
        this.headGroup.rotation.set(0.8, 0, 0);
        this.leftLegGroup.rotation.set(-1.45, 0, 0.25);
        this.leftShinGroup.rotation.set(1.7, 0, 0);
        this.rightLegGroup.rotation.set(-1.45, 0, -0.25);
        this.rightShinGroup.rotation.set(1.7, 0, 0);
        this.leftArmGroup.rotation.set(-0.6, 0, 0.5);
        this.leftForearmGroup.rotation.set(1.4, 0, -0.6);
        this.rightArmGroup.rotation.set(-0.6, 0, -0.5);
        this.rightForearmGroup.rotation.set(1.4, 0, 0.6);
        this.mannequinRoot.position.y = -0.52;
        break;

      case 'standing':
      default:
        this.resetPoseToStanding();
        break;
    }
  }

  private resetRotations() {
    this.mannequinRoot.position.set(0, 0, 0);
    this.mannequinRoot.rotation.set(0, 0, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.chestGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.leftForearmGroup.rotation.set(0, 0, 0);
    this.rightForearmGroup.rotation.set(0, 0, 0);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.leftShinGroup.rotation.set(0, 0, 0);
    this.rightShinGroup.rotation.set(0, 0, 0);
  }

  public resetPoseToStanding() {
    this.resetRotations();
    this.mannequinRoot.position.set(0, 0, 0);
  }

  public update(delta: number) {
    if (this.isFrozen) {
      const mat = this.freezeRingMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(Date.now() * 0.005) * 0.2;
      return;
    }

    if (this.isMoving) {
      this.walkTime += delta * 11;
      const armSwing = Math.sin(this.walkTime) * 0.55;
      this.leftArmGroup.rotation.x = armSwing;
      this.rightArmGroup.rotation.x = -armSwing;
      this.leftForearmGroup.rotation.x = Math.max(0, -armSwing * 0.5);
      this.rightForearmGroup.rotation.x = Math.max(0, armSwing * 0.5);

      const legSwing = Math.sin(this.walkTime) * 0.6;
      this.leftLegGroup.rotation.x = -legSwing;
      this.rightLegGroup.rotation.x = legSwing;
      this.leftShinGroup.rotation.x = Math.max(0, -legSwing * 0.8);
      this.rightShinGroup.rotation.x = Math.max(0, legSwing * 0.8);

      this.torsoGroup.position.y = 0.96 + Math.abs(Math.sin(this.walkTime)) * 0.04;
    } else {
      this.walkTime += delta * 1.5;
      this.resetRotations();
      this.chestGroup.position.y = 0.2 + Math.sin(this.walkTime) * 0.012;
      this.leftArmGroup.rotation.z = 0.08 + Math.sin(this.walkTime) * 0.02;
      this.rightArmGroup.rotation.z = -0.08 - Math.sin(this.walkTime) * 0.02;
    }

    this.group.rotation.y = this.rotationY;
  }
}
