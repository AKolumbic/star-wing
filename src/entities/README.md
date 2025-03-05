# Entities Directory

## Overview

The `entities` directory contains the core game entities for Star Wing, a 3D spaceship shooter built with Three.js. These classes represent the physical objects within the game world that players interact with, such as the player's ship and environmental obstacles.

## Contents

Currently, this directory includes:

- `Ship.ts` - The player-controlled spacecraft with weapons, movement, and health systems
- `Asteroid.ts` - Environmental hazards that move through space and can damage the player's ship

## Entity Design

Each entity in Star Wing follows similar patterns:

- They interact with the Three.js scene
- They have 3D models and hitboxes for collision detection
- They manage their own state (position, velocity, health, etc.)
- They provide update methods that handle movement, collisions, and other per-frame behaviors

## Ship Class

The `Ship` class represents the player's vessel and is the primary interactive entity in the game. Key features include:

- **Movement and Controls**: Handles player input for ship navigation through 3D space
- **Combat Systems**: Integrates with the WeaponSystem for firing primary and secondary weapons
- **Health and Shields**: Manages the ship's durability with separate health and shield systems
- **Visual Effects**: Includes engine glow, trails, and other visual enhancements
- **Entry Animation**: Handles the cinematic entrance of the ship into the scene
- **Boundary Management**: Prevents the ship from flying outside the playable area

## Asteroid Class

The `Asteroid` class represents space debris that poses a hazard to the player. Key features include:

- **Procedural Generation**: Creates varied asteroid models with randomized shapes
- **Physics**: Manages movement, rotation, and collision behaviors
- **Damage System**: Applies damage to the player's ship on collision
- **Lifecycle Management**: Handles asteroid creation, destruction, and cleanup

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
```

## Extending the Entities System

When adding new entity types:

1. Follow the existing pattern of private properties with public accessors
2. Implement lifecycle methods (creation, update, destruction)
3. Add appropriate collision detection and physics
4. Ensure proper resource cleanup when entities are removed

Future entity types might include:

- Enemy fighters
- Capital ships/bosses
- Power-ups and collectibles
- Environmental hazards (mines, space debris, etc.)

## Architecture Notes

Entities communicate with other systems through well-defined interfaces rather than direct dependencies. This promotes modularity and makes it easier to add new entities or modify existing ones without changing the core game logic.
