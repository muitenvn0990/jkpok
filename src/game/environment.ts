import * as THREE from 'three';
import { createParquetFloorTexture } from './textures';
import { createPersianRugTexture, getPaintingTexture, MASTERPIECES, MasterpieceInfo } from './famousPaintings';

export interface MuseumExhibit {
  id: string;
  name: string;
  nameVi: string;
  artist: string;
  dominantColors: string[];
  mesh: THREE.Mesh;
  worldPosition: THREE.Vector3;
}

export class ArtGalleryEnvironment {
  public scene: THREE.Group;
  public exhibits: MuseumExhibit[] = [];
  public interactiveMeshes: THREE.Mesh[] = [];

  // Analytical obstacle definitions for 100% reliable collision
  private pedestals = [
    { x: -6, z: -6, radius: 0.9 },
    { x: 6, z: -6, radius: 0.9 },
    { x: -6, z: 6, radius: 0.9 },
    { x: 6, z: 6, radius: 0.9 },
  ];

  private benches = [
    { minX: -2.3, maxX: 2.3, minZ: -8.8, maxZ: -7.2 },
    { minX: -2.3, maxX: 2.3, minZ: 7.2, maxZ: 8.8 },
  ];

  constructor() {
    this.scene = new THREE.Group();
    this.scene.name = 'art_gallery';
    this.buildGallery();
  }

  private buildGallery() {
    // 1. Hardwood Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(44, 44);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createParquetFloorTexture(),
      roughness: 0.45,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Persian Rug
    const rugGeo = new THREE.PlaneGeometry(18, 24);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: createPersianRugTexture(),
      roughness: 0.85,
      metalness: 0.02,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.y = 0.02;
    rug.receiveShadow = true;
    this.scene.add(rug);
    this.interactiveMeshes.push(rug);

    // 3. Perimeter Walls
    const wallH = 6.5;
    const roomSize = 40;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep gallery slate
      roughness: 0.85,
      metalness: 0.05,
    });

    const wallSpecs = [
      { size: [roomSize, wallH, 1], pos: [0, wallH / 2, -roomSize / 2] }, // North
      { size: [roomSize, wallH, 1], pos: [0, wallH / 2, roomSize / 2] },  // South
      { size: [1, wallH, roomSize], pos: [roomSize / 2, wallH / 2, 0] },  // East
      { size: [1, wallH, roomSize], pos: [-roomSize / 2, wallH / 2, 0] }, // West
    ];

    wallSpecs.forEach(w => {
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]), wallMat);
      wallMesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
      wallMesh.receiveShadow = true;
      this.scene.add(wallMesh);
      this.interactiveMeshes.push(wallMesh);
    });

    // 4. Wooden Wainscoting
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
    const baseboards = [
      { size: [roomSize, 1.4, 0.4], pos: [0, 0.7, -roomSize / 2 + 0.5] },
      { size: [roomSize, 1.4, 0.4], pos: [0, 0.7, roomSize / 2 - 0.5] },
      { size: [0.4, 1.4, roomSize], pos: [roomSize / 2 - 0.5, 0.7, 0] },
      { size: [0.4, 1.4, roomSize], pos: [-roomSize / 2 + 0.5, 0.7, 0] },
    ];
    baseboards.forEach(b => {
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]), baseboardMat);
      baseMesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
      this.scene.add(baseMesh);
      this.interactiveMeshes.push(baseMesh);
    });

    // 5. Mount the 5 Famous Masterpieces on the walls
    this.mountMasterpieces();

    // 6. Central Statues & Pedestals
    this.buildSculpturePedestals();

    // 7. Leather Viewing Benches
    this.buildViewingBenches();

    // Update entire scene matrix world once
    this.scene.updateMatrixWorld(true);
  }

  private mountMasterpieces() {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Gilded gold frame
      roughness: 0.28,
      metalness: 0.82,
    });

    const displays = [
      {
        info: MASTERPIECES[0], // Starry Night (North-East)
        pos: new THREE.Vector3(7, 3.4, -19.2),
        rotY: 0,
        scale: [5.4, 4.4, 0.3],
      },
      {
        info: MASTERPIECES[1], // Mona Lisa (North-West)
        pos: new THREE.Vector3(-7, 3.4, -19.2),
        rotY: 0,
        scale: [4.4, 5.4, 0.3],
      },
      {
        info: MASTERPIECES[2], // The Scream (East Wall)
        pos: new THREE.Vector3(19.2, 3.4, 0),
        rotY: -Math.PI / 2,
        scale: [4.4, 5.4, 0.3],
      },
      {
        info: MASTERPIECES[3], // The Great Wave (West Wall)
        pos: new THREE.Vector3(-19.2, 3.4, 0),
        rotY: Math.PI / 2,
        scale: [5.6, 4.4, 0.3],
      },
      {
        info: MASTERPIECES[4], // The Kiss (South Wall)
        pos: new THREE.Vector3(0, 3.4, 19.2),
        rotY: Math.PI,
        scale: [4.6, 5.6, 0.3],
      },
    ];

    displays.forEach(d => {
      const group = new THREE.Group();
      group.position.copy(d.pos);
      group.rotation.y = d.rotY;

      // Ornate frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(d.scale[0] + 0.6, d.scale[1] + 0.6, d.scale[2]),
        frameMat
      );
      frame.castShadow = true;
      group.add(frame);

      // Painting canvas
      const paintingTex = getPaintingTexture(d.info.id);
      const canvasMat = new THREE.MeshStandardMaterial({
        map: paintingTex,
        roughness: 0.65,
        metalness: 0.05,
      });

      const canvasMesh = new THREE.Mesh(
        new THREE.BoxGeometry(d.scale[0], d.scale[1], d.scale[2] + 0.04),
        canvasMat
      );
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      group.add(canvasMesh);

      // Dedicated gallery spotlight
      const spot = new THREE.SpotLight(0xfffbeb, 12, 10, Math.PI / 4, 0.4, 1.2);
      spot.position.set(0, 3.2, 2.5);
      spot.target = canvasMesh;
      group.add(spot);

      this.scene.add(group);

      this.exhibits.push({
        id: d.info.id,
        name: d.info.title,
        nameVi: d.info.title,
        artist: d.info.artist,
        dominantColors: d.info.dominantColors,
        mesh: canvasMesh,
        worldPosition: d.pos.clone(),
      });

      this.interactiveMeshes.push(canvasMesh);
    });
  }

  private buildSculpturePedestals() {
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.22, metalness: 0.85 });

    this.pedestals.forEach((pos, idx) => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), marbleMat);
      pedestal.position.set(pos.x, 0.55, pos.z);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      this.scene.add(pedestal);
      this.interactiveMeshes.push(pedestal);

      if (idx !== 1) {
        const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 1.2, 16), goldMat);
        statue.position.set(pos.x, 1.7, pos.z);
        statue.castShadow = true;
        this.scene.add(statue);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), goldMat);
        head.position.set(pos.x, 2.45, pos.z);
        head.castShadow = true;
        this.scene.add(head);

        this.exhibits.push({
          id: `statue_${idx}`,
          name: 'Pho Tượng Vàng Cổ Điển',
          nameVi: 'Pho Tượng Vàng Cổ Điển',
          artist: 'Tác phẩm Điêu Khắc',
          dominantColors: ['#d97706', '#fef08a', '#b45309'],
          mesh: statue,
          worldPosition: new THREE.Vector3(pos.x, 1.7, pos.z),
        });

        this.interactiveMeshes.push(statue);
      }
    });
  }

  private buildViewingBenches() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.85 });

    const benchPositions = [
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(0, 0, 8),
    ];

    benchPositions.forEach(p => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 1.4), woodMat);
      bench.position.set(p.x, 0.25, p.z);
      bench.castShadow = true;
      this.scene.add(bench);

      const cushion = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 1.2), cushionMat);
      cushion.position.set(p.x, 0.55, p.z);
      cushion.castShadow = true;
      this.scene.add(cushion);

      this.interactiveMeshes.push(cushion);
    });
  }

  /**
   * Fast, 100% reliable analytical collision check!
   * Checks walls, pedestals, and benches without any matrix un-updated bugs.
   */
  public checkCollision(pos: THREE.Vector3, radius: number = 0.45): boolean {
    // 1. Arena Outer Wall Boundary (-18.2 to +18.2)
    const bound = 18.2;
    if (Math.abs(pos.x) > bound || Math.abs(pos.z) > bound) {
      return true;
    }

    // 2. Pedestals
    for (const ped of this.pedestals) {
      const dx = pos.x - ped.x;
      const dz = pos.z - ped.z;
      const minDist = ped.radius + radius;
      if (dx * dx + dz * dz < minDist * minDist) {
        return true;
      }
    }

    // 3. Benches
    for (const b of this.benches) {
      if (
        pos.x >= b.minX - radius &&
        pos.x <= b.maxX + radius &&
        pos.z >= b.minZ - radius &&
        pos.z <= b.maxZ + radius
      ) {
        return true;
      }
    }

    return false;
  }
}
