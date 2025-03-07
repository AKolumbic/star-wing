# Utils Directory

## Overview

The `utils` directory contains utility classes and helper functions used throughout the Star Wing game. These utilities provide common functionality that can be reused across different parts of the application, promoting code reuse and consistency.

## Contents

This directory includes:

- `Logger.ts` - A centralized logging utility with different log levels
- `UIUtils.ts` - Helper functions for creating and manipulating UI elements
- `MathUtils.ts` - Common mathematical operations for game mechanics
- `StorageUtils.ts` - Local storage management for settings and game state
- `ObjectPool.ts` - Generic object pooling implementation for performance optimization
- `Debug.ts` - Debugging utilities for development and testing

## Logger

The `Logger` class provides a consistent logging interface throughout the application. It follows the singleton pattern, ensuring that all parts of the game use the same logging instance.

### Features

- **Multiple Log Levels**: Supports info, debug, warn, and error levels
- **Production Mode**: Automatically filters out non-critical logs in production builds
- **Log Grouping**: Groups related log messages for better organization
- **Context Support**: Includes additional context objects with log messages
- **Performance Tracking**: Optional timing information for performance-sensitive operations

### Usage

```typescript
import { Logger } from "../utils/Logger";

// Get the logger instance
const logger = Logger.getInstance();

// Basic logging
logger.info("Player ship initialized");
logger.debug("Ship position:", shipPosition);
logger.warn("Low shield warning");
logger.error("Collision detection failed", errorDetails);

// Group related logs
logger.group("Weapon System Initialization", () => {
  logger.info("Primary weapon loaded");
  logger.info("Secondary weapon loaded");
  logger.debug("Weapon system details", weaponSystemState);
});

// Performance tracking
logger.time("Entity Update");
updateEntities();
logger.timeEnd("Entity Update"); // Logs the time taken to update entities
```

## UIUtils

The `UIUtils` class provides helper methods for creating and manipulating UI elements in the game.

### Features

- **Error Messages**: Creates user-friendly error overlays
- **Ship Controls**: Generates UI controls for ship boundary visualization
- **Consistent Styling**: Applies consistent styling to UI elements
- **Responsive Helpers**: Utilities for adapting UI to different screen sizes
- **Animation Utilities**: Helpers for creating consistent UI animations

### Usage

```typescript
import { UIUtils } from "../utils/UIUtils";

// Display an error message to the user
UIUtils.showErrorMessage(
  "Connection Error",
  "Failed to connect to game server. Please try again."
);

// Create ship boundary controls (for development)
const boundaryControls = UIUtils.createShipBoundaryControls(playerShip);
document.body.appendChild(boundaryControls);

// Create responsive UI element
const menu = UIUtils.createResponsiveElement("div", {
  className: "game-menu",
  adaptToScreen: true,
});

// Apply terminal text effect
UIUtils.applyTerminalTextEffect(element, "Welcome to Star Wing", {
  speed: 50,
  glitchProbability: 0.1,
});
```

## MathUtils

The `MathUtils` class provides mathematical functions commonly used in game development.

### Features

- **Vector Operations**: Extending Three.js vector capabilities
- **Random Functions**: Advanced randomization with different distributions
- **Interpolation**: Linear, quadratic, and cubic interpolation functions
- **Collision Detection**: Helper methods for various collision tests

### Usage

```typescript
import { MathUtils } from "../utils/MathUtils";

// Get a random position within bounds
const randomPosition = MathUtils.randomPositionInBounds(minBounds, maxBounds);

// Smooth movement interpolation
const newPosition = MathUtils.smoothStep(currentPosition, targetPosition, 0.1);

// Check if point is in frustum (optimized)
const isVisible = MathUtils.isPointInFrustum(point, camera);
```

## StorageUtils

The `StorageUtils` class provides a consistent interface for persisting data locally.

### Features

- **Settings Management**: Saves and loads game settings
- **Game State**: Persists game progress between sessions
- **Error Handling**: Graceful fallbacks when storage is unavailable
- **Data Compression**: Optional compression for larger data sets

### Usage

```typescript
import { StorageUtils } from "../utils/StorageUtils";

// Save settings
StorageUtils.saveSettings({
  volume: 0.8,
  graphicsQuality: "high",
  controlScheme: "advanced",
});

// Load settings (with defaults)
const settings = StorageUtils.loadSettings({
  volume: 0.5,
  graphicsQuality: "medium",
  controlScheme: "standard",
});

// Save game progress
StorageUtils.saveGameProgress({
  level: 5,
  score: 10500,
  unlockedWeapons: ["laser", "missile"],
});
```

## ObjectPool

The `ObjectPool` class implements the object pooling pattern for performance optimization.

### Features

- **Generic Implementation**: Can be used with any reusable object type
- **Dynamic Resizing**: Grows and shrinks the pool as needed
- **Initialization**: Handles object initialization and reset
- **Memory Management**: Reduces garbage collection pauses

### Usage

```typescript
import { ObjectPool } from "../utils/ObjectPool";

// Create a pool of projectiles
const projectilePool = new ObjectPool({
  create: () => new Projectile(),
  reset: (projectile) => projectile.reset(),
  initialSize: 100,
});

// Get an object from the pool
const projectile = projectilePool.get();

// Return the object to the pool when done
projectilePool.release(projectile);
```

## Debug

The `Debug` class provides utilities for development and testing.

### Features

- **Performance Monitoring**: FPS counter and memory usage tracking
- **Visual Debug Helpers**: Hitbox visualization, path rendering
- **State Inspection**: Game state visualization tools
- **System Testing**: Helpers for testing game systems in isolation

### Usage

```typescript
import { Debug } from "../utils/Debug";

// Show FPS counter
Debug.showFpsCounter();

// Visualize hitboxes
Debug.showHitboxes(entities);

// Log memory usage
Debug.logMemoryUsage();

// Test a specific system
Debug.testSystem("weapons", {
  fireRate: 5,
  damage: 100,
});
```

## Best Practices

When using or extending the utils directory:

1. Keep utility functions **stateless** whenever possible
2. Ensure utilities are truly **reusable** across different parts of the application
3. Write **comprehensive documentation** for each utility function
4. Include **examples** that show how to use each utility
5. Follow the established **patterns** for consistency (e.g., singleton pattern for Logger)
6. Add new utility classes only when the functionality is needed by multiple components
7. Write **unit tests** for utility functions to ensure reliability

## Future Improvements

As the game evolves, the following utility classes might be added:

- `PhysicsUtils` - Additional physics calculation helpers
- `NetworkUtils` - Utilities for potential multiplayer features
- `AIUtils` - Helper functions for enemy AI behavior
- `ShaderUtils` - Common shader functions and utilities
