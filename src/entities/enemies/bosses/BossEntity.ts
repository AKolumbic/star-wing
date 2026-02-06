import * as THREE from 'three';
import { EnemyEntity } from '../EnemyEntity';
import { EnemyType } from '../EnemyTypes';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';

/**
 * Abstract base class for boss enemies.
 * Bosses have multiple phases, higher HP, and special attack patterns.
 */
export abstract class BossEntity extends EnemyEntity {
  /** Current phase (0-based) */
  protected currentPhase: number = 0;

  /** Total number of phases */
  protected totalPhases: number;

  /** HP thresholds at which phases change (descending) */
  protected phaseThresholds: number[];

  /** Boss display name */
  protected bossName: string;

  /** Boss unique identifier */
  protected bossId: string;

  /** Whether the boss has entered the arena (finished approach) */
  protected engaged: boolean = false;

  /** Approach position (boss flies to this point before engaging) */
  protected engagePosition: THREE.Vector3;

  /** Approach speed */
  protected approachSpeed: number = 150;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    health: number,
    scoreValue: number,
    contactDamage: number,
    bossName: string,
    bossId: string,
    totalPhases: number
  ) {
    // Use RAIDER as a placeholder enemy type — bosses are unique
    super(scene, position, health, scoreValue, contactDamage, EnemyType.RAIDER);
    this.bossName = bossName;
    this.bossId = bossId;
    this.totalPhases = totalPhases;

    // Default phase thresholds: evenly spaced HP percentages
    this.phaseThresholds = [];
    for (let i = 1; i < totalPhases; i++) {
      this.phaseThresholds.push(health * (1 - i / totalPhases));
    }

    // Default engage position (center, somewhat ahead)
    this.engagePosition = new THREE.Vector3(0, 0, -500);
  }

  /**
   * Override takeDamage to check for phase transitions.
   */
  takeDamage(amount: number): boolean {
    const killed = super.takeDamage(amount);

    // Check for phase transition
    if (!killed && this.currentPhase < this.phaseThresholds.length) {
      if (this.health <= this.phaseThresholds[this.currentPhase]) {
        this.currentPhase++;
        this.onPhaseChange(this.currentPhase);
      }
    }

    return killed;
  }

  /**
   * Called when the boss transitions to a new phase.
   * Subclasses override this to change attack patterns.
   */
  protected abstract onPhaseChange(newPhase: number): void;

  /**
   * Subclasses implement phase-specific AI here.
   */
  protected abstract updateBossAI(deltaTime: number): void;

  /**
   * Default AI: approach engage point, then delegate to updateBossAI.
   */
  protected updateAI(deltaTime: number): void {
    if (!this.engaged) {
      // Move toward engage position
      const toEngage = new THREE.Vector3()
        .subVectors(this.engagePosition, this.position);
      const dist = toEngage.length();

      if (dist < 20) {
        this.engaged = true;
      } else {
        toEngage.normalize().multiplyScalar(this.approachSpeed * deltaTime);
        this.position.add(toEngage);
      }

      if (this.model) {
        this.model.position.copy(this.position);
      }
      return;
    }

    this.updateBossAI(deltaTime);
  }

  getBossName(): string {
    return this.bossName;
  }

  getBossId(): string {
    return this.bossId;
  }

  getCurrentPhase(): number {
    return this.currentPhase;
  }

  getTotalPhases(): number {
    return this.totalPhases;
  }
}
