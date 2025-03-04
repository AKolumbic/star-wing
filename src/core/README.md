# Star Wing Core Systems

This directory contains the fundamental core systems that power the Star Wing game engine.

## Overview

The `core` directory houses the essential components that form the backbone of the game architecture. These systems handle the game loop, rendering, input management, and coordination between different game subsystems.

## Key Components

### Game.ts

The central controller for the entire game.

- Manages the primary game loop and frame timing
- Orchestrates communication between subsystems
- Handles initialization and cleanup of all game resources
- Implements error handling and performance monitoring
- Controls game state transitions (menu, gameplay, pausing)

```typescript
// Basic usage
const game = new Game();
await game.init();
game.start();
```

### Scene.ts

3D rendering and scene management using Three.js.

- Creates and manages the WebGL renderer
- Sets up camera, lighting, and the 3D environment
- Generates the starfield background
- Provides methods for adding game objects to the scene
- Handles rendering optimizations

```typescript
// Basic usage
const scene = new Scene();
scene.init();
scene.addObject(gameObject);
```

### Input.ts

Handles all user interactions with the game.

- Processes keyboard input for player controls
- Manages mouse position and button states
- Provides a clean API for querying input states
- Properly cleans up event listeners when disposed

```typescript
// Basic usage
const input = new Input();
input.init();

// In update loop
if (input.isKeyPressed("w")) {
  // Move player forward
}
```

## Design Patterns

The core systems implement several key design patterns:

1. **Game Loop Pattern**: Fixed timestep update and render cycle ensuring consistent gameplay regardless of device performance
2. **Component Pattern**: Modular design with clear separation of concerns between rendering, input, and game logic
3. **Observer Pattern**: Event-based communication between systems without tight coupling
4. **Factory Pattern**: Centralized creation of complex objects

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

## Extension Points

The core systems are designed for extensibility:

- Clear interfaces between components
- Event-based architecture for adding new features
- Protected access to key subsystems
- Proper resource management for adding and removing game objects

## Dependencies

- **Three.js**: For 3D rendering (Scene.ts)
- **Browser DOM API**: For input handling (Input.ts)
- **Web Audio API**: Through AudioManager for sound (referenced in Game.ts)
- **UI Components**: Through Menu, LoadingScreen, etc. (referenced in Game.ts)
