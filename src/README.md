# Star Wing Source Code

This directory contains the complete source code for the Star Wing game, a 3D space shooter built with Three.js and TypeScript. The codebase follows a modular architecture with clear separation of concerns to promote maintainability and scalability.

## Directory Structure

```
src/
├── audio/           # Audio system with modular architecture
├── core/            # Core game systems (game loop, scene, input)
├── entities/        # Game entities (player ship, asteroids)
├── ui/              # User interface components
├── utils/           # Utility functions and helpers
├── weapons/         # Weapon systems and projectiles
├── main.ts          # Entry point for the application
└── env.d.ts         # TypeScript environment declarations
```

## Entry Point

`main.ts` serves as the application entry point, handling:

- Creation of the game canvas
- Parsing URL parameters for dev mode settings
- Initializing the game instance
- Error handling for initialization
- Global exports for debugging

## Core Systems (`/core`)

The core systems form the backbone of the game architecture:

- **Game.ts**: Central controller that coordinates all systems and provides the main API
- **GameLoop.ts**: Manages the game loop timing and delta calculations
- **GameSystem.ts**: Interface for all game subsystems
- **PerformanceMonitor.ts**: Tracks and reports performance metrics
- **Scene.ts**: Handles Three.js scene management
- **Input.ts**: Processes raw input events

The core directory also includes specialized systems:

- **backgrounds/**: Modular starfield and hyperspace effects
- **systems/**: Implementation of the GameSystem interface including:
  - **SceneSystem**: Wraps the Scene for 3D rendering
  - **InputSystem**: Manages game input
  - **AudioSystem**: Interfaces with the audio management
  - **UISystem**: Coordinates UI components

See [Core Systems README](./core/README.md) for detailed documentation.

## Audio System (`/audio`)

A sophisticated modular audio system that handles:

- Background music playback with smooth transitions
- Procedurally generated synthesized music
- Sound effect playback with spatial positioning
- Volume controls and settings persistence
- Optimized buffer management and memory usage

The audio system follows a modular architecture with specialized components for different audio functions.

See [Audio System README](./audio/README.md) for detailed documentation.

## Entities (`/entities`)

Game objects that exist in the 3D world:

- **Ship.ts**: The player-controlled spacecraft
- **Asteroid.ts**: Environmental hazards
- **Entity.ts**: Base entity class with common functionality

The entity system handles:

- 3D models and hitboxes
- Movement and physics
- Health and damage systems
- Visual effects

See [Entities README](./entities/README.md) for detailed documentation.

## Weapons (`/weapons`)

The weapon system provides combat mechanics:

- **Weapon.ts**: Abstract base class for all weapons
- **Projectile.ts**: Handles fired projectiles
- **WeaponSystem.ts**: Manages weapon inventory and firing
- **types/**: Specific weapon implementations (lasers, missiles, etc.)

The weapon system implements:

- Different weapon categories (ballistic, energy, explosive, special)
- Firing mechanics and cooldowns
- Projectile physics and collisions
- Visual effects for weapons

See [Weapons README](./weapons/README.md) for detailed documentation.

## User Interface (`/ui`)

UI components creating the game's distinctive retro terminal aesthetic:

- **LoadingScreen.ts**: Initial loading screen
- **Menu.ts**: Game menus and settings
- **TerminalBorder.ts**: Decorative terminal border
- **GameHUD.ts**: In-game heads-up display

The UI system implements:

- Retro terminal styling with scan lines and glitch effects
- Menu navigation and settings controls
- In-game status displays
- Responsive design for different screen sizes

See [UI README](./ui/README.md) for detailed documentation.

## Utilities (`/utils`)

Helper utilities for common operations:

- **Logger.ts**: Standardized logging system
- **UIUtils.ts**: Helper functions for UI operations

## Component Interactions

The Star Wing architecture follows these communication patterns:

1. **Core Game Coordination**:

   - `Game` class initializes and coordinates all systems
   - `GameLoop` manages frame updates for all components
   - All major systems implement the `GameSystem` interface

2. **Entity-System Communication**:

   - Entities update based on the game loop's delta time
   - Entities interact with systems through well-defined interfaces
   - Entity positions affect rendering, audio positioning, and collision detection

3. **Audio-Game Integration**:

   - `AudioSystem` provides a bridge between the game and audio components
   - Game events trigger appropriate audio responses
   - Audio settings are persisted across game sessions

4. **UI-Game Communication**:

   - UI components respond to game state changes
   - User interactions with UI affect game systems
   - UI updates display game metrics and player status

5. **Weapon-Entity Interaction**:
   - Weapons are attached to entities (primarily the player ship)
   - Projectiles interact with entities through collision detection
   - Weapon systems communicate with audio systems for sound effects

## Development Workflow

The Star Wing codebase supports efficient development through:

- **Dev Mode**: URL parameters that skip intros and enable quick testing
- **Performance Monitoring**: Built-in metrics for optimization
- **Logging System**: Comprehensive logging for debugging
- **Component Isolation**: Systems can be tested independently

## Extending the Codebase

To add new features to Star Wing:

1. **New Entities**: Add new classes to the entities directory
2. **New Weapons**: Create new weapon types in the weapons/types directory
3. **UI Components**: Add new UI elements to the UI directory
4. **Audio Assets**: Add new audio files and update the audio management system
5. **Background Effects**: Create new background types in the core/backgrounds directory
