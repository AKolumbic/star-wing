# Star Wing

A 3D space shooter game built with Three.js, featuring roguelike progression and retro pixel art aesthetics.

## Overview

Star Wing is a web-based 3D space shooter that combines classic arcade gameplay with modern roguelike progression mechanics. Players control a starfighter through wave-based combat zones, upgrading their ship between battles to face increasingly challenging enemies.

## Tech Stack

- **Three.js**: 3D graphics and rendering (v0.162.0)
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **Web Audio API**: Audio management and synthesis
- **Howler.js**: Additional audio support for complex soundscapes
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

For MCP enabled dev tools, enter in a different terminal:

```bash
npx @agentdeskai/browser-tools-server
```

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

6. Run tests:

```bash
npm test
```

## Development Mode

Star Wing includes a developer mode for efficient workflow:

```bash
# Skip intro, bypass menu, mute audio
http://localhost:3000/?dev

# Skip intro, bypass menu, enable audio
http://localhost:3000/?dev&enableDevAudio
```

You can toggle audio during development using the browser console:

```javascript
game.toggleDevModeAudio();
```

## Controls

- **WASD**: Ship movement
- **Mouse**: Aim weapons
- **Left Click**: Fire primary weapon
- **Right Click**: Fire secondary weapon
- **Space**: Barrel roll/dodge
- **1-3**: Switch weapon modes
- **ESC**: Pause game/show in-game menu

## Features

- **Dynamic Weapon System**: Multiple weapon types with unique behaviors
- **Procedural Music**: Adaptive soundtrack generated in real-time
- **Hyperspace Travel**: Dynamic starfield effects and transitions
- **Retro Terminal UI**: CRT-inspired user interface with scan lines and glitch effects
- **Performance Optimization**: Object pooling, frustum culling, and advanced audio management

## Project Structure

The codebase follows a modular architecture with clear separation of concerns:

- **Core Systems**: Game loop, rendering, input management
- **Audio**: Modular audio system with procedural synthesis
- **Entities**: Player ship, enemies, and environmental objects
- **Weapons**: Weapon types, projectiles, and combat systems
- **UI**: Menu systems and in-game HUD
- **Utils**: Utility functions and helper classes

For detailed documentation on the architecture and implementation, see the [Source Code README](./src/README.md).

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
