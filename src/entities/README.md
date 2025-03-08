# Entities Directory

## Overview

The `entities` directory contains the core game entities for Star Wing, a 3D spaceship shooter built with Three.js. These classes represent the physical objects within the game world that players interact with, such as the player's ship and environmental obstacles.

## Contents

This directory includes:

- `Ship.ts` - The player-controlled spacecraft with weapons, movement, and health systems
- `Asteroid.ts` - Environmental hazards that move through space and can damage the player's ship
- `Entity.ts` - Base class that defines common functionality for all game entities
- `PowerUp.ts` - Collectible items that provide temporary or permanent bonuses
- `EnemyShip.ts` - AI-controlled hostile spacecraft with various behaviors

## Entity Design

Each entity in Star Wing follows similar patterns:

- They extend the base `Entity` class for common functionality
- They interact with the Three.js scene
- They have 3D models and hitboxes for collision detection
- They manage their own state (position, velocity, health, etc.)
- They provide update methods that handle movement, collisions, and other per-frame behaviors
- They implement the object pooling pattern for performance optimization

## Entity Class

The `Entity` abstract base class provides shared functionality:

- **3D Representation**: Manages the Three.js mesh and model
- **Collision Detection**: Provides hitbox and collision testing methods
- **Lifecycle Management**: Standard methods for initialization and disposal
- **Event System**: Allows entities to fire and respond to events
- **Performance Optimization**: Object pooling implementation for entity reuse

## Ship Class

The `Ship` class represents the player's vessel and is the primary interactive entity in the game. Key features include:

- **Movement and Controls**: Handles player input for ship navigation through 3D space
- **Combat Systems**: Integrates with the WeaponSystem for firing primary and secondary weapons
- **Health and Shields**: Manages the ship's durability with separate health and shield systems
- **Visual Effects**: Includes engine glow, trails, and other visual enhancements
- **Entry Animation**: Handles the cinematic entrance of the ship into the scene
- **Boundary Management**: Prevents the ship from flying outside the playable area
- **Upgrade System**: Manages ship improvements and modifications

## Asteroid Class

The `Asteroid` class represents space debris that poses a hazard to the player. Key features include:

- **Procedural Generation**: Creates varied asteroid models with randomized shapes
- **Physics**: Manages movement, rotation, and collision behaviors
- **Damage System**: Applies damage to the player's ship on collision
- **Lifecycle Management**: Handles asteroid creation, destruction, and cleanup
- **Resource Management**: Implements object pooling for performance

## PowerUp Class

The `PowerUp` class represents collectible items that enhance the player's ship:

- **Effect Types**: Various bonuses including shield, weapons, and speed
- **Visual Indicator**: Distinct visual appearance for each power-up type
- **Collection Logic**: Detects when player collects the power-up
- **Timed Effects**: Manages duration for temporary power-ups
- **Attraction Behavior**: Optional magnetic pull toward the player when nearby

## EnemyShip Class

The `EnemyShip` class represents AI-controlled hostile spacecraft:

- **AI Behavior**: Different movement and attack patterns
- **Difficulty Scaling**: Adjustable parameters based on game difficulty
- **Weapon Systems**: Custom weapons and firing patterns
- **Formation Logic**: Ability to coordinate with other enemy ships
- **Reward System**: Drops resources or power-ups when destroyed

## Usage

Entities are typically instantiated and managed by the game's core systems. For example:

```typescript
// Creating a new ship
const ship = new Ship(scene, input, devMode);
await ship.load();
await ship.initialize();

// Creating an asteroid
const asteroid = new Asteroid(
  scene,
  new THREE.Vector3(x, y, z), // position
  new THREE.Vector3(dx, dy, dz), // direction
  speed, // speed
  size, // size
  damage // damage amount
);

// Getting a pooled asteroid (performance optimized)
const asteroid = EntityPool.getInstance().get(EntityType.ASTEROID);
asteroid.initialize(position, direction, speed, size);

// Creating a power-up
const powerUp = new PowerUp(
  scene,
  PowerUpType.SHIELD_BOOST,
  position,
  duration
);

// Creating an enemy ship
const enemy = new EnemyShip(scene, EnemyType.FIGHTER, position, difficulty);
```

## Entity Pooling

For performance optimization, frequently created and destroyed entities use object pooling:

```typescript
// Getting a pooled entity
const asteroid = EntityPool.getInstance().get(EntityType.ASTEROID);

// When entity is no longer needed
EntityPool.getInstance().release(asteroid);
```

## Extending the Entities System

When adding new entity types:

1. Extend the `Entity` base class or another appropriate entity class
2. Follow the existing pattern of private properties with public accessors
3. Implement lifecycle methods (creation, update, destruction)
4. Add appropriate collision detection and physics
5. Ensure proper resource cleanup when entities are removed
6. Consider implementing object pooling for frequently created entities

Future entity types might include:

- Space stations and orbital structures
- Environmental effects (nebulae, wormholes)
- Interactive terrain (destructible asteroids, resource nodes)
- Specialized boss enemies with unique mechanics

## Architecture Notes

Entities communicate with other systems through well-defined interfaces rather than direct dependencies. This promotes modularity and makes it easier to add new entities or modify existing ones without changing the core game logic.
