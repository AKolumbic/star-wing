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

## Project Structure

```
star-wing/
├── src/
│   ├── core/           # Core game systems
│   │   ├── Game.ts     # Main game class
│   │   ├── Scene.ts    # Three.js scene management
│   │   └── Input.ts    # Input handling
│   ├── entities/       # Game entities
│   │   ├── Player.ts   # Player ship
│   │   ├── Enemy.ts    # Enemy ships
│   │   └── Projectile.ts # Weapons
│   ├── systems/        # Game systems
│   │   ├── Combat.ts   # Combat mechanics
│   │   ├── Upgrade.ts  # Upgrade system
│   │   └── Wave.ts     # Wave management
│   ├── ui/            # User interface
│   │   ├── HUD.ts     # Heads-up display
│   │   └── Menu.ts    # Game menus
│   ├── utils/         # Utility functions
│   └── main.ts        # Entry point
├── assets/           # Game assets
│   ├── models/       # 3D models
│   ├── textures/     # Textures
│   └── audio/        # Sound effects and music
├── public/          # Static files
├── index.html       # HTML entry point
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Vite configuration
```

## Controls

- **WASD**: Ship movement
- **Mouse**: Aim weapons
- **Left Click**: Fire primary weapon
- **Right Click**: Fire secondary weapon
- **Space**: Barrel roll/dodge
- **1-3**: Switch weapon modes
- **ESC/P**: Pause menu

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
