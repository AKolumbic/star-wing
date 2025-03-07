# Weapons Directory

## Overview

The `weapons` directory contains all classes and components related to the weapon systems in Star Wing. This includes weapon base classes, projectile handling, and specific weapon type implementations. Weapons are a core gameplay mechanic, allowing the player's ship to combat enemies and obstacles in space.

## Contents

This directory includes:

- `Weapon.ts` - The abstract base class for all weapons in the game
- `Projectile.ts` - Implementation of projectiles fired by weapons
- `WeaponSystem.ts` - Management class that coordinates all weapon functionality
- `types/` - Directory containing specific weapon implementations:
  - `LaserCannon.ts` - Standard energy weapon with rapid fire rate
  - `RapidFireGun.ts` - Ballistic weapon with high fire rate
  - `MissileLauncher.ts` - Explosive weapon that fires homing missiles
  - `GravityBeam.ts` - Special weapon that affects enemy movement
  - `PlasmaCannon.ts` - Advanced energy weapon with damage over time

## Weapon Architecture

The weapon system is designed with flexibility and extensibility in mind, using an object-oriented approach with clear inheritance patterns:

### Weapon Base Class

The `Weapon` abstract class provides the foundation for all weapons with:

- **Common Properties**: Damage, fire rate, cooldown, range, category
- **State Management**: Tracking firing status, cooldown timers, and ammo
- **Lifecycle Methods**: Update, fire, and dispose functionality
- **Abstract Methods**: Requiring specific implementations to define firing behavior
- **Visual Effects**: Methods for generating appropriate weapon effects

### Projectile System

The `Projectile` class represents the bullets, lasers, or missiles fired by weapons:

- **Physics**: Handles movement, collision detection, and lifetime management
- **Visual Effects**: Renders the projectile with appropriate models and effects
- **Impact Logic**: Manages what happens when projectiles hit targets
- **Pool Management**: Efficient reuse of projectile objects for performance

### Weapon Categories

Weapons are divided into four categories as defined in `WeaponCategory`:

- **Ballistic**: Physical ammunition-based weapons (bullets, railguns)
- **Energy**: Beam and laser-based weapons that use ship energy
- **Explosive**: Weapons that cause area damage (missiles, bombs)
- **Special**: Unique weapons with alternative effects (tractor beams, EMP)

## Weapon Types

### LaserCannon

A standard energy weapon that fires rapid laser bolts:

- Medium damage with fast firing rate
- Uses ship energy instead of ammunition
- Accurate with long range
- Red laser bolts with instantaneous travel

### RapidFireGun

A ballistic weapon that fires a stream of bullets:

- Lower damage per shot but very high fire rate
- Requires ammunition that can be depleted
- Slight bullet spread for shorter effective range
- Yellow tracer rounds with visible travel time

### MissileLauncher

An explosive weapon that fires guided missiles:

- High damage with area of effect on impact
- Limited ammunition with slow reload
- Homing capability to track moving targets
- Visual smoke trail and explosion effects

### GravityBeam

A special weapon that manipulates enemy movement:

- Low direct damage but powerful utility
- High energy cost with moderate cooldown
- Ability to pull enemies towards the player or push them away
- Purple beam with distortion visual effects

### PlasmaCannon

An advanced energy weapon with unique properties:

- Medium-high damage with damage-over-time effect
- Moderate fire rate with high energy cost
- Teal-colored plasma projectiles with particle trails
- Ability to penetrate multiple targets

## WeaponSystem

The `WeaponSystem` class manages all aspects of weapons in the game:

- **Weapon Slots**: Handles primary and secondary weapon assignments
- **Inventory**: Tracks all available weapons the player has acquired
- **Firing Logic**: Processes player input to trigger appropriate weapons
- **Upgrade Path**: Manages weapon improvements and modifications
- **UI Integration**: Communicates with UI systems to display weapon status
- **Audio Integration**: Coordinates with the audio system for weapon sounds

## Usage

### Creating and Adding Weapons

```typescript
// In a game initialization function
import { WeaponSystem } from "../weapons/WeaponSystem";
import { LaserCannon } from "../weapons/types/LaserCannon";

// Create the weapon system
const weaponSystem = new WeaponSystem(scene);
await weaponSystem.init();

// Add a custom weapon
const customLaser = new LaserCannon(scene);
weaponSystem.addWeapon("customLaser", customLaser);
```

### Firing Weapons

```typescript
// In the ship's update loop
const shipPosition = new THREE.Vector3(0, 0, 0);
const aimDirection = new THREE.Vector3(0, 0, -1);

// Fire primary weapon
if (input.isPrimaryFiring()) {
  weaponSystem.firePrimary(shipPosition, aimDirection);
}

// Fire secondary weapon
if (input.isSecondaryFiring()) {
  weaponSystem.fireSecondary(shipPosition, aimDirection);
}

// Switch weapon type
if (input.isKeyJustPressed("1")) {
  weaponSystem.switchToWeaponSlot(0);
}
```

### Creating Custom Weapons

To create a new weapon type:

1. Create a new class in the `types/` directory
2. Extend the `Weapon` base class
3. Implement the required `onFire` method
4. Define weapon properties in the constructor

Example:

```typescript
export class PlasmaCannon extends Weapon {
  constructor(scene: THREE.Scene) {
    const props: WeaponProps = {
      name: "Plasma Cannon",
      description: "Superheated plasma that deals damage over time",
      damage: 15,
      fireRate: 1.5,
      cooldown: 0.67,
      range: 800,
      category: WeaponCategory.ENERGY,
      energyCost: 3,
      projectileColor: new THREE.Color(0x00ffaa),
      scale: 2.0,
    };
    super(props, scene);
  }

  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Create projectile
    const projectile = this.createProjectile(position, direction);

    // Add damage-over-time property
    projectile.setDamageOverTime(5, 3); // 5 damage per second for 3 seconds

    // Add penetration capability
    projectile.setPenetration(true, 3); // Can penetrate up to 3 targets

    // Play sound effect
    this.playFireSound();

    return true;
  }
}
```

## Audio Integration

The weapon system integrates closely with the audio system:

```typescript
// In a weapon class
protected playFireSound() {
  const audioManager = AudioManager.getInstance();

  switch (this.category) {
    case WeaponCategory.ENERGY:
      audioManager.playLaserSound("energy");
      break;
    case WeaponCategory.BALLISTIC:
      audioManager.playLaserSound("ballistic");
      break;
    // Other categories...
  }
}
```

## Future Improvements

Planned enhancements to the weapon system include:

- **Weapon Modification System**: Allow attachments and modifications
- **Environmental Interactions**: Weapons that interact with the environment
- **Charge Mechanics**: Implement charge-up weapons with variable power
- **Weapon Combinations**: Allow certain weapons to be combined for special effects
- **Heat Management**: More complex cooling and overheating mechanics
- **Elemental Effects**: Add elemental properties to weapons for different combat scenarios
