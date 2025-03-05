# Star Wing Core Systems

This directory contains the fundamental core systems that power the Star Wing game engine.

## Overview

The `core` directory houses the essential components that form the backbone of the game architecture. These systems handle the game loop, rendering, input management, and coordination between different game subsystems. The architecture follows a component-based design with a standardized system interface.

## Architecture

The core systems implement a modular architecture with the following structure:

1. **Main Game Controller** - `Game.ts` coordinates all systems and provides the central API
2. **System Interface** - `GameSystem.ts` defines the common interface for all subsystems
3. **Game Loop Manager** - `GameLoop.ts` manages the update/render cycle independently
4. **System Adapters** - Specialized adapters in the `systems/` directory wrap core functionality

## Key Components

### Game.ts

The central controller for the entire game.

- Manages the creation and coordination of all game systems
- Handles initialization and startup sequence
- Maintains references to all major system components
- Delegates game loop management to the GameLoop class
- Provides dev mode options including audio control

```typescript
// Basic usage
const game = new Game("gameCanvas");
await game.init();
game.start();

// With dev mode enabled
const game = new Game("gameCanvas", true);

// With dev mode and audio enabled
const game = new Game("gameCanvas", true, true);

// Toggle audio in dev mode via console
game.toggleDevModeAudio();
```

**Development Mode Parameters:**

- Dev mode can be enabled via URL: `http://localhost:3000/?dev`
- Dev mode with audio: `http://localhost:3000/?dev&enableDevAudio`

### GameSystem.ts

Interface that defines the standard lifecycle for all game systems.

- Provides consistent `init()`, `update()`, and `dispose()` methods
- Enables systems to be managed uniformly by the Game class
- Supports parallel asynchronous initialization

```typescript
// All systems implement this interface
export interface GameSystem {
  init(): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;
}
```

### GameLoop.ts

Dedicated class that manages the game loop timing and updates.

- Handles requestAnimationFrame and delta time calculations
- Updates all systems in sequence each frame
- Tracks performance metrics
- Supports pre-update and post-update hooks

### System Adapters

Specialized adapters that implement the GameSystem interface:

#### SceneSystem

- Wraps the Scene class for 3D rendering
- Manages Three.js integration
- Coordinates the modular background system
- Handles visual effects and scene composition

#### InputSystem

- Manages keyboard and mouse input
- Provides methods to query input state
- Handles event binding and cleanup

#### AudioSystem

- Controls game sound and music
- Manages volume settings
- Provides the interface to AudioManager

#### UISystem

- Coordinates UI components including menus and overlays
- Manages loading screen and terminal border
- Handles UI state and transitions

## Utility Classes

### PerformanceMonitor

Tracks performance metrics like FPS and frame timing.

### UIUtils

Provides utility methods for UI operations like error message display.

## Design Patterns

The core systems implement several key design patterns:

1. **Component Pattern**: Modular design with clear separation of concerns
2. **Adapter Pattern**: System adapters wrap existing classes with a consistent interface
3. **Observer Pattern**: Event-based communication between systems without tight coupling
4. **Facade Pattern**: Game class provides a simplified interface to complex subsystems

## Performance Considerations

The core systems are designed with performance as a priority:

- Efficient rendering with Three.js best practices
- Optimized input handling to avoid performance bottlenecks
- Frame timing and delta calculations for smooth animations
- Performance metrics tracking for debugging

## Error Handling

Robust error handling is implemented throughout the core systems:

- Graceful initialization failure with user-friendly error messages
- Comprehensive resource cleanup to prevent memory leaks
- Console logging for development debugging
- User-facing error displays for critical failures

## Dependencies

- **Three.js**: For 3D rendering (Scene.ts)
- **Browser DOM API**: For input handling (Input.ts)
- **Web Audio API**: Through AudioManager for sound (referenced in AudioSystem)
- **UI Components**: Through Menu, LoadingScreen, etc. (referenced in UISystem)

## Background System

The background system provides a modular and extensible framework for managing dynamic scene backgrounds:

### BackgroundManager

Central manager that handles background state and transitions:

- Manages multiple background types
- Handles smooth transitions between backgrounds
- Provides a unified update interface
- Supports dynamic background switching

### Background Types

1. **StarfieldBackground**

   - Dynamic star field simulation
   - Configurable star density and speed
   - Parallax scrolling effect
   - Optimized particle management

2. **HyperspaceBackground**
   - Hyperspace travel effect
   - Dynamic light streaks
   - Configurable speed and intensity
   - Smooth transition handling

### Design Features

- Modular architecture for easy addition of new background types
- Interface-based design for consistent implementation
- Performance-optimized rendering
- Seamless integration with Three.js scene graph
- Independent update cycles for each background type
