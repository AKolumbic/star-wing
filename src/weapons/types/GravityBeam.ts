import * as THREE from "three";
import { Weapon, WeaponCategory, WeaponProps } from "../Weapon";

/**
 * Gravity Beam - special weapon that slows down enemies
 * Continuous effect rather than projectile-based
 */
export class GravityBeam extends Weapon {
  private beamMesh: THREE.Object3D | null = null;
  private isActive: boolean = false;
  private effectRadius: number = 80;
  private beamLength: number = 300;
  private origin: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);

  /**
   * Creates a new GravityBeam weapon
   * @param scene The scene to add beam to
   */
  constructor(scene: THREE.Scene) {
    const props: WeaponProps = {
      name: "Gravity Beam",
      description:
        "Experimental weapon that creates a field of distorted space-time, slowing enemies caught in its path.",
      damage: 2, // Low damage per tick
      fireRate: 0, // Continuous effect, not discrete shots
      cooldown: 5.0, // Long cooldown after use
      range: 300, // Medium range
      category: WeaponCategory.SPECIAL,
      energyCost: 20, // High energy cost
      projectileColor: new THREE.Color(0x9900ff), // Purple
    };

    super(props, scene);
  }

  /**
   * Updates the beam effect and damages enemies in its path
   * @param deltaTime Time elapsed since last update
   */
  protected onUpdate(deltaTime: number): void {
    if (!this.isActive || !this.beamMesh) return;

    // Update beam position based on origin and direction
    this.beamMesh.position.copy(this.origin);

    // Look in the beam direction
    if (this.direction.lengthSq() > 0) {
      this.beamMesh.lookAt(this.origin.clone().add(this.direction));
    }

    // Make beam visuals pulse slightly
    const time = Date.now() * 0.001; // Convert to seconds
    const pulseFactor = 0.8 + 0.2 * Math.sin(time * 5);

    // Apply pulse to beam size
    if (this.beamMesh.children.length > 0) {
      const mainBeam = this.beamMesh.children[0] as THREE.Mesh;
      if (mainBeam && mainBeam.scale) {
        mainBeam.scale.set(pulseFactor, pulseFactor, 1);
      }
    }

    // Effect continues for a short time
    this.currentCooldown -= deltaTime;
    if (this.currentCooldown <= 0) {
      this.deactivateBeam();
    }
  }

  /**
   * Activates the gravity beam in specified direction
   * @param position The position to fire from
   * @param direction The direction to fire in
   */
  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Store origin and direction
    this.origin = position.clone();
    this.direction = direction.clone().normalize();

    // Create beam effect if it doesn't exist
    if (!this.beamMesh) {
      this.createBeamEffect();
    }

    // Activate the beam effect
    this.activateBeam();

    // Set a shorter cooldown for the beam's active duration
    this.currentCooldown = 2.0; // 2 second active time

    // Play sound effect (to be implemented)
    // this.playFireSound();

    return true;
  }

  /**
   * Creates the visual beam effect
   */
  private createBeamEffect(): void {
    const upgradeLevel = this.props.upgradeLevel || 0;

    // Parent object for the beam
    this.beamMesh = new THREE.Object3D();

    // Calculate beam thickness based on upgrade level
    const baseThickness = 10;
    const thickness = baseThickness * (1 + upgradeLevel * 0.2);

    // Calculate beam length based on upgrade level
    this.beamLength = this.props.range * (1 + upgradeLevel * 0.15);

    // Main beam cylinder
    const beamGeometry = new THREE.CylinderGeometry(
      thickness, // Top radius
      thickness * 0.7, // Bottom radius (tapered)
      this.beamLength, // Length
      16, // Radial segments
      4, // Height segments
      false // Open-ended
    );

    // Rotate to align with Z axis
    beamGeometry.rotateX(Math.PI / 2);

    // Translate so base of cylinder is at origin
    beamGeometry.translate(0, 0, -this.beamLength / 2);

    // Create material with distortion effect
    const beamMaterial = new THREE.MeshPhongMaterial({
      color: this.props.projectileColor || new THREE.Color(0x9900ff),
      transparent: true,
      opacity: 0.7,
      emissive: this.props.projectileColor || new THREE.Color(0x9900ff),
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });

    // Create the main beam mesh
    const mainBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    this.beamMesh.add(mainBeam);

    // Add inner beam for more visual interest
    const innerBeamGeometry = new THREE.CylinderGeometry(
      thickness * 0.5,
      thickness * 0.3,
      this.beamLength,
      8,
      3,
      false
    );
    innerBeamGeometry.rotateX(Math.PI / 2);
    innerBeamGeometry.translate(0, 0, -this.beamLength / 2);

    const innerBeamMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.4,
    });

    const innerBeam = new THREE.Mesh(innerBeamGeometry, innerBeamMaterial);
    this.beamMesh.add(innerBeam);

    // Add distortion rings along the beam
    const ringCount = 4;
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < ringCount; i++) {
      const position = ((i + 1) / (ringCount + 1)) * this.beamLength;
      const ringGeometry = new THREE.TorusGeometry(
        thickness * 1.5,
        thickness * 0.2,
        8,
        16
      );

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -position;
      ring.rotation.x = Math.PI / 2;
      this.beamMesh.add(ring);
    }

    // Add a light source for glow effect
    const light = new THREE.PointLight(
      this.props.projectileColor || new THREE.Color(0x9900ff),
      1,
      this.beamLength
    );
    light.position.set(0, 0, -this.beamLength / 2);
    this.beamMesh.add(light);

    // Hide initially
    this.beamMesh.visible = false;

    // Add to scene
    this.scene.add(this.beamMesh);
  }

  /**
   * Activates the beam effect
   */
  private activateBeam(): void {
    if (!this.beamMesh) return;

    this.isActive = true;
    this.beamMesh.visible = true;
  }

  /**
   * Deactivates the beam effect
   */
  private deactivateBeam(): void {
    if (!this.beamMesh) return;

    this.isActive = false;
    this.beamMesh.visible = false;

    // Reset cooldown to the weapon's full cooldown period
    this.currentCooldown = this.props.cooldown;
    this.isReady = false;
  }

  /**
   * Gets whether the beam is currently active
   */
  isBeamActive(): boolean {
    return this.isActive;
  }

  /**
   * Gets the effect radius of the beam
   */
  getEffectRadius(): number {
    return this.effectRadius;
  }

  /**
   * Gets the beam's current direction
   */
  getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }

  /**
   * Gets the beam's length
   */
  getBeamLength(): number {
    return this.beamLength;
  }

  /**
   * Cleans up resources when the weapon is disposed
   */
  dispose(): void {
    if (this.beamMesh) {
      this.scene.remove(this.beamMesh);

      // Clean up geometries and materials
      this.beamMesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      this.beamMesh = null;
    }

    this.isActive = false;
  }
}
