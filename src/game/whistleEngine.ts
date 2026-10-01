import * as THREE from 'three';
import { soundEngine } from './audio';
import { SeekerHunter } from './seeker';

export class WhistleEngine {
  private intervalSeconds: number = 22;
  private timeUntilNextWhistle: number = 22;
  private scene: THREE.Scene;
  private rippleMeshes: { mesh: THREE.Mesh; life: number; maxLife: number; maxRadius: number }[] = [];

  constructor(scene: THREE.Scene, intervalSeconds: number = 22) {
    this.scene = scene;
    this.intervalSeconds = intervalSeconds;
    this.timeUntilNextWhistle = intervalSeconds;
  }

  public setInterval(sec: number) {
    this.intervalSeconds = sec;
    this.timeUntilNextWhistle = Math.min(this.timeUntilNextWhistle, sec);
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.timeUntilNextWhistle);
  }

  public getProgress(): number {
    return 1 - this.timeUntilNextWhistle / this.intervalSeconds;
  }

  /**
   * Update whistle countdown timer & visual wave ripples
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    seekers: SeekerHunter[],
    onWhistleFired: () => void
  ) {
    this.timeUntilNextWhistle -= delta;

    if (this.timeUntilNextWhistle <= 0) {
      // TRIGGER WHISTLE!
      this.timeUntilNextWhistle = this.intervalSeconds;
      this.triggerWhistle(playerPos, seekers);
      onWhistleFired();
    }

    // Animate expanding 3D soundwave ripple rings on the ground
    for (let i = this.rippleMeshes.length - 1; i >= 0; i--) {
      const r = this.rippleMeshes[i];
      r.life += delta;

      const progress = r.life / r.maxLife;
      if (progress >= 1.0) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        this.rippleMeshes.splice(i, 1);
      } else {
        const currentScale = 0.5 + progress * r.maxRadius;
        r.mesh.scale.set(currentScale, currentScale, currentScale);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.7;
      }
    }
  }

  /**
   * Manually or automatically trigger whistle
   */
  public triggerWhistle(origin: THREE.Vector3, seekers: SeekerHunter[]) {
    soundEngine.playWhistle();

    // Spawn 2-3 expanding soundwave rings in 3D
    this.createSoundwaveRing(origin, 0);
    setTimeout(() => this.createSoundwaveRing(origin, 0.1), 180);
    setTimeout(() => this.createSoundwaveRing(origin, 0.2), 360);

    // Alert all seekers within hearing range
    seekers.forEach(s => s.onHearWhistle(origin));
  }

  private createSoundwaveRing(pos: THREE.Vector3, _delay: number) {
    const ringGeo = new THREE.RingGeometry(0.9, 1.05, 48);
    ringGeo.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.position.set(pos.x, 0.08, pos.z);
    this.scene.add(mesh);

    this.rippleMeshes.push({
      mesh,
      life: 0,
      maxLife: 1.8,
      maxRadius: 18,
    });
  }

  public reset() {
    this.timeUntilNextWhistle = this.intervalSeconds;
    this.rippleMeshes.forEach(r => {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
    this.rippleMeshes = [];
  }
}
