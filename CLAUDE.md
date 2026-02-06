# CLAUDE.md - Star Wing Development Guide

## Project Overview

**Star Wing** is a web-based 3D space shooter game built with Three.js, TypeScript, and Vite. Features roguelike progression mechanics with classic arcade gameplay, procedurally generated music, and retro terminal UI aesthetics.

## Tech Stack

- **Three.js** (v0.162.0) - 3D graphics rendering
- **TypeScript** (v5.2.2) - Type-safe development
- **Vite** (v5.1.0) - Build tool and dev server
- **Howler.js** (v2.2.4) - Cross-browser audio
- **GSAP** (v3.12.5) - Animations
- **Jest** (v29.7.0) - Testing framework

## Build & Test Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Building
npm run build            # Compile TypeScript and build with Vite
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:functional  # Feature tests only
npm run test:performance # Performance benchmarks
npm run test:visual      # Visual regression tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Project Structure

```
src/
├── main.ts              # Entry point
├── core/                # Game loop, systems, initialization
│   ├── Game.ts          # Main game controller
│   ├── GameLoop.ts      # Frame timing and update cycle
│   ├── GameSystem.ts    # Interface for all subsystems
│   ├── Scene.ts         # Three.js scene management
│   ├── Input.ts         # Input processing
│   └── systems/         # System adapters
├── entities/            # Game objects (Ship, Asteroid, Entity)
├── weapons/             # Combat system (Weapon, WeaponSystem, Projectile)
├── audio/               # Audio engine (AudioManager, MusicPlayer, etc.)
├── ui/                  # UI components (Menu, GameHUD, Settings, etc.)
└── utils/               # Utilities (Logger, UIUtils)

test/
├── unit/                # Unit tests
├── integration/         # Integration tests
├── functional/          # End-to-end tests
├── performance/         # Performance benchmarks
├── visual/              # Visual regression tests
├── mocks/               # Mock implementations
└── setup.js             # Global test setup
```

## Code Conventions

### Naming
- **Classes**: PascalCase (`Game`, `Ship`, `AudioManager`)
- **Methods/Properties**: camelCase (`init()`, `isRunning`)
- **Constants**: UPPER_SNAKE_CASE (`ENTRY_DURATION`)
- **Files**: Match class name (`Game.ts` for `Game` class)

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to `src/*`
- Explicit type annotations for parameters and returns
- Prefer `const` over `let`, never use `var`
- Avoid `any` type

### Architecture Patterns
- **GameSystem Interface**: All systems implement `init()`, `update(deltaTime)`, `dispose()`
- **Facade Pattern**: `Game` and `AudioManager` provide simplified APIs
- **Singleton Pattern**: `Logger`, `AudioManager`
- **Adapter Pattern**: System wrappers in `core/systems/`

### Documentation
- JSDoc comments on public methods and classes
- Inline comments for complex logic

## Development Mode

- `?dev` URL parameter - Skips intro, bypasses menu, mutes audio, enables god mode
- `?dev&enableDevAudio` - Dev mode with audio enabled
- Console: `game.toggleDevModeAudio()` - Toggle audio in dev mode
- Console: `game.toggleGodMode()` - Toggle god mode (invulnerable + 10x damage); auto-enabled in dev mode
- Tests are currently skipped / known-broken — ignore test failures during development

## Important Notes

1. **Async Initialization**: Most systems use async init; use `await`
2. **Delta Time**: Update methods receive deltaTime in seconds
3. **Resource Cleanup**: Always call `dispose()` to prevent memory leaks
4. **Error Handling**: Use `UIUtils.showErrorMessage()` for user-facing errors
5. **Logging**: Use `Logger.getInstance()` throughout the codebase
6. **Audio Context**: May be suspended on mobile; use `ensureAudioCanPlay()`

## Testing Patterns

```typescript
describe("ClassName", () => {
  let instance: ClassName;

  beforeEach(() => {
    instance = new ClassName();
  });

  afterEach(() => {
    // Cleanup
  });

  test("should behave correctly", () => {
    expect(instance.method()).toBe(expected);
  });
});
```

Test files use `.test.ts` extension. Mocks provided for WebGL, Audio API, and Canvas.
