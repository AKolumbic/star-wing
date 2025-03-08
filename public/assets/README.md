# Public Assets Directory

This directory contains static assets that are served directly by the web server in production builds.

## File Structure

- `/assets/audio/` - Audio files used in the game
  - `/assets/audio/music/` - Background music tracks
  - `/assets/audio/sfx/` - Sound effects organized by category
  - `/assets/audio/voice/` - Voice lines and dialogue
- `/assets/img/` - Image files, icons, and UI elements
  - `/assets/img/ui/` - User interface graphics
  - `/assets/img/sprites/` - 2D sprites and textures
  - `/assets/img/icons/` - Game icons and symbols
- `/assets/models/` - 3D models for game entities
  - `/assets/models/ships/` - Player and enemy ship models
  - `/assets/models/weapons/` - Weapon and projectile models
  - `/assets/models/environment/` - Environmental objects
- `/assets/fonts/` - Custom fonts used in the game interface
- `/assets/shaders/` - GLSL shader code for special effects

## Important Note

When adding new static assets, make sure to place them in this `public` directory. Files in this location will be:

1. Copied directly to the root of the built site
2. Accessible at their relative paths (e.g., `/assets/audio/music/theme.mp3`)
3. Not processed by the bundler (unlike files imported directly in code)

Assets placed in the `src` or project root directories will **not** be available in production builds on platforms like Vercel unless they are properly imported and processed by the bundler.

## Asset Guidelines

### Audio Files

- **Format**: Use MP3 (general compatibility) or OGG (better compression)
- **Sample Rate**: 44.1kHz for music, 22.05kHz for sound effects
- **Bit Rate**: 128kbps for music, 96kbps for sound effects
- **Naming Convention**: Use lowercase with underscores (e.g., `laser_shot.mp3`)

### Images and Textures

- **Format**: PNG for UI and sprites, JPEG for background images
- **Size**: Keep power-of-two dimensions when possible (256x256, 512x512, etc.)
- **Compression**: Optimize all images for web delivery
- **Naming Convention**: Use lowercase with underscores (e.g., `ship_texture.png`)

### 3D Models

- **Format**: GLTF/GLB format for Three.js compatibility
- **Poly Count**: Optimize for mobile performance (< 10k triangles per model)
- **Textures**: Use texture atlases where possible
- **Naming Convention**: Use lowercase with underscores (e.g., `player_ship.glb`)

### Shaders

- **Format**: .frag and .vert files for fragment and vertex shaders
- **Compatibility**: Write GLSL 3.0 with WebGL 2.0 compatibility in mind
- **Performance**: Optimize for mobile GPU performance
- **Naming Convention**: Use lowercase with underscores (e.g., `hyperspace_effect.frag`)

## Loading Assets

Asset loading is handled by the respective systems:

```typescript
// Loading audio
await audioManager.loadAudioSample(
  "assets/audio/sfx/explosion.mp3",
  "explosion"
);

// Loading 3D models
const loader = new GLTFLoader();
const model = await loader.loadAsync("assets/models/ships/fighter.glb");

// Loading textures
const textureLoader = new THREE.TextureLoader();
const texture = await textureLoader.loadAsync(
  "assets/img/sprites/asteroid.png"
);

// Loading shaders
const shader = await fetch("assets/shaders/hyperspace.frag").then((r) =>
  r.text()
);
```

## Asset Preloading

Critical assets are preloaded during the game initialization phase. To add new assets to the preload list, modify the appropriate manager class:

- Audio files: Update `AudioManager.preloadEssentialAudio()`
- 3D models: Update `ModelManager.preloadEssentialModels()`
- Textures: Update `TextureManager.preloadEssentialTextures()`
