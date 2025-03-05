# Utils Directory

## Overview

The `utils` directory contains utility classes and helper functions used throughout the Star Wing game. These utilities provide common functionality that can be reused across different parts of the application, promoting code reuse and consistency.

## Contents

Currently, this directory includes:

- `Logger.ts` - A centralized logging utility with different log levels
- `LoggerExample.ts` - Examples showing how to use the Logger class
- `UIUtils.ts` - Helper functions for creating and manipulating UI elements

## Logger

The `Logger` class provides a consistent logging interface throughout the application. It follows the singleton pattern, ensuring that all parts of the game use the same logging instance.

### Features

- **Multiple Log Levels**: Supports info, debug, warn, and error levels
- **Production Mode**: Automatically filters out non-critical logs in production builds
- **Log Grouping**: Groups related log messages for better organization
- **Context Support**: Includes additional context objects with log messages

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
```

## UIUtils

The `UIUtils` class provides helper methods for creating and manipulating UI elements in the game.

### Features

- **Error Messages**: Creates user-friendly error overlays
- **Ship Controls**: Generates UI controls for ship boundary visualization
- **Consistent Styling**: Applies consistent styling to UI elements

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
```

## Best Practices

When using or extending the utils directory:

1. Keep utility functions **stateless** whenever possible
2. Ensure utilities are truly **reusable** across different parts of the application
3. Write **comprehensive documentation** for each utility function
4. Include **examples** that show how to use each utility
5. Follow the established **patterns** for consistency (e.g., singleton pattern for Logger)
6. Add new utility classes only when the functionality is needed by multiple components

## Future Improvements

As the game evolves, the following utility classes might be added:

- `MathUtils` - Helper functions for common game math operations
- `AudioUtils` - Audio management helpers
- `StorageUtils` - Local storage access and management
- `RandomUtils` - Advanced random generation functions specific to game needs
