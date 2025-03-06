# Star Wing

A 3D space shooter game built with Three.js, featuring roguelike progression and retro pixel art aesthetics.

## Overview

Star Wing is a web-based 3D space shooter that combines classic arcade gameplay with modern roguelike progression mechanics. Players control a starfighter through wave-based combat zones, upgrading their ship between battles to face increasingly challenging enemies.

## Tech Stack

- **Three.js**: 3D graphics and rendering
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **Howler.js**: Audio management
- **GSAP**: UI animations and transitions

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/akolumbic/star-wing.git
cd star-wing
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Development Mode

For more efficient development workflow, Star Wing includes a developer mode that:

- Skips the intro loading screen
- Bypasses the main menu
- Starts with audio muted by default
- Immediately initializes the ship and gameplay

To enable dev mode, simply add `?dev` to the URL:

```bash
http://localhost:3000/?dev
```

If you want to enable audio in dev mode (to hear the procedural music), you can add the `enableDevAudio` parameter:

```bash
http://localhost:3000/?dev&enableDevAudio
```

You can also toggle audio during development by using the browser console:

```javascript
game.toggleDevModeAudio();
```

These options are particularly useful during development to avoid repeatedly clicking through the intro sequence and for testing audio features while in development mode.

## Project Structure

```bash
star-wing/
├── src/
│   ├── core/                  # Core game systems
│   │   ├── Game.ts            # Main game class (includes dev mode)
│   │   ├── GameLoop.ts        # Main game loop
│   │   ├── GameSystem.ts      # Interface for all game systems
│   │   ├── PerformanceMonitor.ts # Performance monitoring utilities
│   │   ├── Scene.ts           # Three.js scene management
│   │   ├── Input.ts           # Core input handling
│   │   ├── backgrounds/       # Modular background system
│   │   │   ├── Background.ts  # Base background interface
│   │   │   ├── BackgroundManager.ts # Background state management
│   │   │   ├── StarfieldBackground.ts # Dynamic star field effect
│   │   │   └── HyperspaceBackground.ts # Hyperspace travel effect
│   │   └── systems/           # Game subsystems
│   │       ├── SceneSystem.ts # Scene management system
│   │       ├── InputSystem.ts # Input processing system
│   │       ├── AudioSystem.ts # Audio management system
│   │       └── UISystem.ts    # UI management system
│   ├── entities/              # Game entities
│   │   ├── Ship.ts            # Player ship
│   │   ├── Enemy.ts           # Enemy ships
│   │   └── Entity.ts          # Base entity class
│   ├── weapons/               # Weapon systems
│   │   ├── Weapon.ts          # Base weapon class
│   │   ├── Projectile.ts      # Projectile base class
│   │   ├── WeaponSystem.ts    # Ship weapon management system
│   │   └── types/             # Weapon implementations
│   │       ├── LaserCannon.ts # Standard laser weapon
│   │       ├── RapidFireGun.ts # Fast-firing weapon
│   │       ├── MissileLauncher.ts # Homing missile weapon
│   │       └── GravityBeam.ts # Special weapon that affects enemy movement
│   ├── audio/                 # Audio management
│   │   └── AudioManager.ts    # Audio playback and synthesis
│   ├── ui/                    # User interface
│   │   ├── LoadingScreen.ts   # Intro loading screen
│   │   ├── Menu.ts            # Main and in-game menus
│   │   ├── GameHUD.ts         # In-game heads-up display
│   │   ├── TextCrawl.ts       # Intro text crawl effect
│   │   ├── TerminalBorder.ts  # Terminal-style UI border
│   │   ├── Settings.ts        # Game settings interface
│   │   └── HighScores.ts      # High score tracking
│   ├── utils/                 # Utility functions
│   │   ├── UIUtils.ts         # UI helper utilities
│   │   └── Logger.ts          # Logging system
│   └── main.ts                # Entry point (handles dev mode param)
├── assets/                    # Game assets
│   ├── models/                # 3D models
│   ├── textures/              # Textures
│   └── audio/                 # Sound effects and music
├── public/                    # Static files
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

## Features

- **Dynamic Weapon System**: Multiple weapon types with unique behaviors and effects
- **In-Game Menu**: Pause the game with ESC key during gameplay
- **Hyperspace Travel**: Dynamic starfield effects with hyperspace transitions
- **Music System**: Adaptive soundtrack that changes based on game state
- **Performance Monitoring**: Built-in metrics for development
- **Dev Mode**: Streamlined testing experience for faster development

## Controls

- **WASD**: Ship movement
- **Mouse**: Aim weapons
- **Left Click**: Fire primary weapon
- **Right Click**: Fire secondary weapon
- **Space**: Barrel roll/dodge
- **1-3**: Switch weapon modes
- **ESC**: Pause game/show in-game menu

## Development Guidelines

1. **Code Style**

   - Use TypeScript for type safety
   - Follow ESLint configuration
   - Write meaningful comments for complex logic

2. **Performance**

   - Use object pooling for frequently created objects
   - Implement frustum culling
   - Optimize particle effects
   - Profile regularly for bottlenecks

3. **Asset Management**

   - Keep 3D models low-poly
   - Use pixel art textures
   - Optimize audio files
   - Implement proper asset loading

4. **Testing**
   - Write unit tests for core systems
   - Test across different browsers
   - Verify performance on various hardware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for 3D graphics support
- Pixel art and synthwave communities for aesthetic inspiration
- Classic space shooters for gameplay inspiration
