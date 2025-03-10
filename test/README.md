# Star-Wing Testing Framework

This directory contains the testing framework for the Star-Wing game. This document outlines our approach to testing, best practices, and provides guidance for implementing and running tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Testing Tools](#testing-tools)
4. [Running Tests](#running-tests)
5. [Test Mocks](#test-mocks)
6. [Testing Patterns](#testing-patterns)
7. [Writing Tests by Component](#writing-tests-by-component)
8. [Performance Testing](#performance-testing)
9. [Visual Regression Testing](#visual-regression-testing)
10. [Continuous Integration](#continuous-integration)
11. [AudioManager Testing](#audiomanager-testing)

## Testing Philosophy

Our testing approach for Star-Wing follows these principles:

- **Coverage First**: We aim for high test coverage of core game mechanics
- **Isolation**: Tests should be independent and not rely on the state of other tests
- **Fast Execution**: Tests should run quickly to enable rapid development cycles
- **Readable Tests**: Test cases should be clear and serve as documentation
- **Test Real Behavior**: Focus on testing behaviors that users experience
- **Risk-Based Testing**: More critical systems get more thorough testing

## Test Structure

The test suite is organized into the following categories:

```
test/
├── unit/              # Unit tests for individual functions and classes
│   ├── math/          # Tests for math utilities
│   ├── entities/      # Tests for entity components
│   ├── systems/       # Tests for game systems
│   └── utils/         # Tests for utility functions
├── integration/       # Tests for interaction between components
│   ├── physics/       # Tests for physics and collision detection
│   ├── input/         # Tests for input handling
│   ├── audio/         # Tests for audio system
│   └── ui/            # Tests for UI components
├── functional/        # End-to-end tests for game features
│   ├── gameplay/      # Tests for core gameplay functionality
│   ├── menu/          # Tests for menu navigation
│   └── progression/   # Tests for game progression
├── performance/       # Tests for game performance
├── visual/           # Visual regression tests
├── mocks/            # Mock implementations for testing
└── helpers/          # Test helper functions
```

## Testing Tools

We use the following tools for testing Star-Wing:

1. **Jest**: Primary testing framework for unit and integration tests
2. **Testing Library**: For testing UI components
3. **Playwright/Puppeteer**: For end-to-end testing and visual regression tests
4. **Jest Image Snapshot**: For visual comparison testing
5. **Sinon.js**: For spies, stubs, and mocks

## Running Tests

Tests are run using npm scripts defined in the project's package.json file. Here's a comprehensive guide to running different types of tests and analyzing test coverage.

### Basic Test Commands

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run functional tests
npm run test:functional

# Run performance tests
npm run test:performance

# Run visual tests
npm run test:visual
```

### Running Specific Tests

```bash
# Run a specific test file
npm test path/to/test-file.js

# Run tests matching a specific pattern
npm test -- -t "pattern to match"

# Example: Run all tests related to audio
npm test -- -t "audio"

# Run tests in a specific directory
npm test test/unit/audio/

# Run a specific test within a file
npm test path/to/test-file.js -- -t "specific test name"
```

### Watch Mode for Development

```bash
# Run tests in watch mode (re-runs when files change)
npm run test:watch

# Watch a specific test file
npm run test:watch -- path/to/test-file.js

# Watch tests matching a pattern
npm run test:watch -- -t "pattern to match"
```

### Test Coverage

```bash
# Generate coverage report for all tests
npx jest --coverage

# Generate coverage for specific tests
npm test path/to/test-file.js -- --coverage

# Generate coverage report for unit tests only
npm run test:unit -- --coverage

# Set minimum coverage thresholds
npm test -- --coverage --coverageThreshold='{"global":{"statements":80,"branches":80,"functions":80,"lines":80}}'
```

### Viewing Coverage Reports

After running tests with coverage, you can view the reports:

```bash
# The coverage report is saved in the coverage/ directory
# Open the HTML report in your browser
open coverage/lcov-report/index.html
```

### Debugging Tests

```bash
# Run tests with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test-file.js

# Output more detailed information
npm test -- --verbose

# Display individual test results
npm test -- --verbose=true
```

### Test Configuration

You can pass additional Jest configuration options:

```bash
# Run tests with a custom timeout (in milliseconds)
npm test -- --testTimeout=10000

# Bail after a certain number of failures
npm test -- --bail=3

# Use a specific configuration file
npm test -- --config=custom-jest-config.js
```

## Test Mocks

### 1. WebGL Context Mocking

The WebGL context is mocked to enable testing without a real browser rendering context:

```javascript
// mocks/webgl.js
export class WebGLRenderingContextMock {
  constructor() {
    this.canvas = { width: 800, height: 600 };
    this.drawingBufferWidth = 800;
    this.drawingBufferHeight = 600;

    // Track calls for assertions
    this.calls = [];
  }

  // WebGL API methods
  viewport(x, y, width, height) {
    this.calls.push({ method: "viewport", args: [x, y, width, height] });
  }

  clearColor(r, g, b, a) {
    this.calls.push({ method: "clearColor", args: [r, g, b, a] });
  }

  clear(mask) {
    this.calls.push({ method: "clear", args: [mask] });
  }

  // Add other WebGL methods as needed...
}
```

### 2. Game Asset Mocking

Assets like textures, models, and sounds are mocked:

```javascript
// mocks/assets.js
export const TextureMock = {
  id: "texture-1",
  width: 256,
  height: 256,
  bind: jest.fn(),
  loadFromUrl: jest.fn().mockResolvedValue(true),
};

export const AudioMock = {
  id: "audio-1",
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn(),
  isPlaying: jest.fn().mockReturnValue(false),
  loadFromUrl: jest.fn().mockResolvedValue(true),
};

export const ModelMock = {
  id: "model-1",
  vertexCount: 1024,
  render: jest.fn(),
  loadFromUrl: jest.fn().mockResolvedValue(true),
};
```

### 3. Input Device Mocking

Keyboard and mouse input devices are mocked:

```javascript
// mocks/input.js
export class KeyboardMock {
  constructor() {
    this.pressedKeys = new Set();
    this.eventListeners = {
      keydown: [],
      keyup: [],
    };
  }

  pressKey(key) {
    this.pressedKeys.add(key);
    const event = new KeyboardEvent("keydown", { key });
    this.eventListeners.keydown.forEach((listener) => listener(event));
  }

  releaseKey(key) {
    this.pressedKeys.delete(key);
    const event = new KeyboardEvent("keyup", { key });
    this.eventListeners.keyup.forEach((listener) => listener(event));
  }

  isKeyPressed(key) {
    return this.pressedKeys.has(key);
  }

  addEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].push(listener);
    }
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(
        (l) => l !== listener
      );
    }
  }
}

export class MouseMock {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.buttons = 0;
    this.eventListeners = {
      mousemove: [],
      mousedown: [],
      mouseup: [],
      click: [],
    };
  }

  move(x, y) {
    this.x = x;
    this.y = y;
    const event = new MouseEvent("mousemove", { clientX: x, clientY: y });
    this.eventListeners.mousemove.forEach((listener) => listener(event));
  }

  down(button = 0) {
    this.buttons |= 1 << button;
    const event = new MouseEvent("mousedown", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.mousedown.forEach((listener) => listener(event));
  }

  up(button = 0) {
    this.buttons &= ~(1 << button);
    const event = new MouseEvent("mouseup", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.mouseup.forEach((listener) => listener(event));

    // Also trigger click
    const clickEvent = new MouseEvent("click", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.click.forEach((listener) => listener(clickEvent));
  }

  click(button = 0) {
    this.down(button);
    this.up(button);
  }

  addEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].push(listener);
    }
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(
        (l) => l !== listener
      );
    }
  }
}
```

### 4. Animation Frame Timing Mock

For testing animations and game loops:

```javascript
// mocks/timing.js
export class AnimationFrameMock {
  constructor() {
    this.callbacks = new Map();
    this.nextId = 1;
    this.currentTime = 0;
  }

  // Mock requestAnimationFrame
  requestAnimationFrame(callback) {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  // Mock cancelAnimationFrame
  cancelAnimationFrame(id) {
    this.callbacks.delete(id);
  }

  // Advance time and trigger callbacks
  step(deltaTime = 16.667) {
    this.currentTime += deltaTime;
    const callbacksToRun = Array.from(this.callbacks.entries());

    // Clear callbacks before running them (in case they register new ones)
    this.callbacks.clear();

    for (const [id, callback] of callbacksToRun) {
      callback(this.currentTime);
    }
  }

  // Reset the mock
  reset() {
    this.callbacks.clear();
    this.nextId = 1;
    this.currentTime = 0;
  }
}
```

### 5. Audio Context Mock

For testing audio features:

```javascript
// mocks/audio.js
export class AudioContextMock {
  constructor() {
    this.state = "suspended";
    this.destination = {
      channelCount: 2,
    };
    this.currentTime = 0;
    this.sampleRate = 44100;
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };
  }

  createOscillator() {
    return {
      frequency: { value: 440, setValueAtTime: jest.fn() },
      type: "sine",
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }

  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}
```

## Testing Patterns

### Test Setup and Teardown

```javascript
// Example of test setup and teardown
describe("Ship Entity", () => {
  let world;
  let ship;

  beforeEach(() => {
    // Setup a fresh world for each test
    world = new World();
    ship = world.createShip({
      position: new Vector3(0, 0, 0),
      health: 100,
    });
  });

  afterEach(() => {
    // Clean up after each test
    world.destroy();
  });

  test("ship takes damage correctly", () => {
    ship.takeDamage(20);
    expect(ship.health).toBe(80);
  });
});
```

### Async Testing

```javascript
// Example of asynchronous test
test("loads assets before starting game", async () => {
  const loader = new AssetLoader();
  const loadSpy = jest.spyOn(loader, "loadAssets");

  // Start asset loading
  const promise = loader.loadAssets(["ship.model", "explosion.sound"]);

  // Should be loading state immediately
  expect(loader.isLoading()).toBe(true);

  // Wait for loading to complete
  await promise;

  // Check loading completed
  expect(loader.isLoading()).toBe(false);
  expect(loadSpy).toHaveBeenCalledWith(["ship.model", "explosion.sound"]);
});
```

### Snapshot Testing

```javascript
// Example of snapshot testing for UI component
test("radar component renders correctly", () => {
  const radar = new Radar();
  radar.setPlayerPosition(new Vector3(0, 0, 0));
  radar.addEntity({
    type: "asteroid",
    position: new Vector3(100, 0, 100),
  });

  // Get the HTML representation
  const html = radar.render().outerHTML;

  // Compare with saved snapshot
  expect(html).toMatchSnapshot();
});
```

## Writing Tests by Component

### 1. Physics and Collision Tests

```javascript
test("detects collision between ship and asteroid", () => {
  const world = new World();
  const ship = world.createShip({
    position: new Vector3(0, 0, 0),
    collision: {
      radius: 10,
    },
  });

  const asteroid = world.createAsteroid({
    position: new Vector3(5, 0, 0),
    collision: {
      radius: 10,
    },
  });

  const collisionSystem = new CollisionSystem(world);
  const collisions = collisionSystem.detectCollisions();

  expect(collisions).toContainEqual({
    entityA: ship.id,
    entityB: asteroid.id,
    point: expect.any(Vector3),
  });
});
```

### 2. Input System Tests

```javascript
test("WASD keys control ship movement", () => {
  const inputSystem = new InputSystem();
  const mockKeyboard = new KeyboardMock();
  inputSystem.setKeyboard(mockKeyboard);

  const ship = {
    moveForward: jest.fn(),
    moveBackward: jest.fn(),
    strafeLeft: jest.fn(),
    strafeRight: jest.fn(),
  };

  inputSystem.registerShip(ship);

  // Press W key
  mockKeyboard.pressKey("w");
  inputSystem.update(16);
  expect(ship.moveForward).toHaveBeenCalled();

  // Press S key
  mockKeyboard.pressKey("s");
  inputSystem.update(16);
  expect(ship.moveBackward).toHaveBeenCalled();

  // Release all keys
  mockKeyboard.releaseKey("w");
  mockKeyboard.releaseKey("s");
  ship.moveForward.mockClear();
  ship.moveBackward.mockClear();

  // Should not call movement after keys released
  inputSystem.update(16);
  expect(ship.moveForward).not.toHaveBeenCalled();
  expect(ship.moveBackward).not.toHaveBeenCalled();
});
```

### 3. Radar Component Tests

```javascript
test("radar displays entities at correct positions", () => {
  const radar = new Radar({
    width: 200,
    height: 200,
    range: 1000,
  });

  // Player at center position
  const playerPos = new Vector3(0, 0, 0);
  radar.setPlayerPosition(playerPos);

  // Add entities at various positions
  const entities = [
    { type: "asteroid", position: new Vector3(500, 0, 0) },
    { type: "asteroid", position: new Vector3(0, 0, 500) },
    { type: "asteroid", position: new Vector3(-500, 0, 0) },
    { type: "asteroid", position: new Vector3(0, 0, -500) },
    { type: "asteroid", position: new Vector3(2000, 0, 0) }, // Out of range
  ];

  radar.updateEntities(entities);

  // Get radar points
  const points = radar.getRadarPoints();

  // Should have 4 points (one out of range)
  expect(points.length).toBe(4);

  // Check positions are correct
  expect(points).toContainEqual(
    expect.objectContaining({
      x: 100, // 50% of radar width (500/1000 of range)
      y: 100, // Center Y
      type: "asteroid",
    })
  );

  expect(points).toContainEqual(
    expect.objectContaining({
      x: 100, // Center X
      y: 150, // 75% down (500/1000 of range, y-axis is inverted)
      type: "asteroid",
    })
  );
});
```

### 4. Game State Tests

```javascript
test("game transitions from playing to game over when player dies", () => {
  const game = new Game();
  game.init();

  // Start the game
  game.start();
  expect(game.getCurrentState()).toBe("playing");

  // Kill the player
  const player = game.getPlayer();
  player.health = 0;

  // Update the game
  game.update(16);

  // Game should now be in game over state
  expect(game.getCurrentState()).toBe("gameOver");

  // Game over screen should be visible
  const gameOverScreen = document.querySelector(".game-over-screen");
  expect(gameOverScreen).toBeTruthy();
  expect(gameOverScreen.style.display).not.toBe("none");
});
```

### 5. Audio System Tests

```javascript
test("plays explosion sound when asteroid is destroyed", () => {
  const audioSystem = new AudioSystem();
  const world = new World();

  // Mock the play method
  audioSystem.play = jest.fn();

  // Create and destroy an asteroid
  const asteroid = world.createAsteroid();
  world.emit("entityDestroyed", { entity: asteroid, type: "asteroid" });

  // Sound should be played
  expect(audioSystem.play).toHaveBeenCalledWith(
    "explosion",
    expect.any(Object)
  );
});
```

## Performance Testing

Performance tests ensure the game runs smoothly:

```javascript
test("maintains 60+ FPS with 100 asteroids", async () => {
  // Setup performance test environment
  const game = new Game();
  await game.init();

  // Create 100 asteroids
  for (let i = 0; i < 100; i++) {
    game.createAsteroid();
  }

  // Track frame times
  const frameTimes = [];
  const frameCallback = (dt) => frameTimes.push(dt);

  // Register callback and run for 5 seconds
  game.onFrameTime(frameCallback);
  game.start();

  // Wait for 5 seconds (or track X frames)
  await new Promise((resolve) => setTimeout(resolve, 5000));
  game.stop();

  // Calculate average FPS
  const avgFrameTime =
    frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
  const avgFPS = 1000 / avgFrameTime;

  // Expect at least 60 FPS average
  expect(avgFPS).toBeGreaterThanOrEqual(60);

  // Expect no severe frame time spikes
  const maxFrameTime = Math.max(...frameTimes);
  expect(maxFrameTime).toBeLessThanOrEqual(32); // No frames taking > 32ms (30 FPS minimum)
});
```

## Visual Regression Testing

For UI components that need to look consistent:

```javascript
test("game HUD renders correctly", async () => {
  // Setup the HUD with test data
  const hud = new GameHUD();
  hud.init();
  hud.updateHealth(75);
  hud.updateShield(50);
  hud.updateScore(12500);

  // Insert into DOM for capturing
  document.body.appendChild(hud.element);

  // Take screenshot and compare to baseline
  const screenshot = await takeScreenshot(hud.element);
  expect(screenshot).toMatchImageSnapshot();

  // Clean up
  document.body.removeChild(hud.element);
});
```

## Continuous Integration

Configure CI/CD to run tests automatically:

```yaml
# Example .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: "16.x"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run performance tests
        run: npm run test:performance

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./coverage/coverage-final.json
```

## AudioManager Testing

The AudioManager is a critical component of our game's audio system, responsible for all sound generation and playback. We've implemented comprehensive testing for this component with the following improvements:

### 1. Complete Method Coverage

Our test suite now covers all methods in the AudioManager class:

- Core functionality: `initialize()`, `dispose()`, etc.
- Volume control: `setVolume()`, `getVolume()`, `getMuteState()`, `toggleMute()`
- Audio playback: `playTestTone()`, `playMenuThump()`, etc.
- Music management: `preloadLevelMusic()`, `playLevelMusic()`, `addMusicLayer()`, etc.
- Resource management: `preloadEssentialAudio()`, `cleanupUnusedAudio()`, etc.
- Audio sample management: `playAudioSample()`, `loadAudioSample()`, etc.

### 2. Memory Optimization

We've optimized the tests to reduce memory consumption:

- Shared mock objects for dependencies
- Efficient test setup and teardown
- Immediate execution of timeouts to speed up tests
- Proper cleanup of resources after tests

### 3. TypeScript Support

We've added TypeScript support to our testing infrastructure:

- Updated Jest configuration to handle TypeScript files
- Added TypeScript type definitions for better code quality
- Created a dedicated tsconfig.json for tests

### 4. Test Organization

Tests are organized by functionality:

```javascript
describe("AudioManager - Comprehensive Tests", () => {
  // Singleton pattern tests
  describe("Singleton Pattern", () => {
    // Tests for getInstance()
  });

  // Initialization tests
  describe("Initialization", () => {
    // Tests for initialize()
  });

  // Volume control tests
  describe("Volume Control", () => {
    // Tests for volume-related methods
  });

  // ... and so on for each functional area
});
```

### 5. Edge Case Testing

We test various edge cases:

- Initialization state (already initialized, not initialized)
- Mute state transitions (muted to unmuted, unmuted to muted)
- Layer management (active/inactive layered music)
- Resource availability (assets loaded/not loaded)

### Running AudioManager Tests

To run the AudioManager tests specifically:

```bash
# Run all AudioManager tests
npm test test/unit/audio/AudioManager.test.js

# Run with coverage information
npm test test/unit/audio/AudioManager.test.js -- --coverage

# Run specific AudioManager tests
npm test test/unit/audio/AudioManager.test.js -- -t "toggleMute"

# Run in watch mode during development
npm run test:watch -- test/unit/audio/AudioManager.test.js

# Generate detailed coverage report
npm test test/unit/audio/AudioManager.test.js -- --coverage --coverageReporters=html
open coverage/lcov-report/src/audio/AudioManager.ts.html
```

---

By following the guidelines in this document, we can build a robust test suite that ensures Star-Wing maintains high quality as development progresses. These tests will serve as both verification and documentation for the game's behavior.
