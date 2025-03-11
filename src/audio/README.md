# Star Wing Audio System

This directory contains the audio engine components for the Star Wing game.

## Architecture Overview

The audio system follows a modular architecture with dedicated components for different aspects of audio functionality:

```
src/audio/
├── core/                    # Core audio infrastructure
│   ├── AudioContextManager.ts  # Manages Web Audio context and master volume
│   └── BufferManager.ts     # Handles audio buffer loading and caching
├── effects/                 # Sound effect components
│   └── SoundEffectPlayer.ts # Manages all sound effect playback
├── music/                   # Music components
│   ├── MusicPlayer.ts       # Handles music playback and transitions
│   └── ProceduralMusicGenerator.ts # Generates procedural music
├── howler/                  # Howler.js integration components
│   └── HowlerManager.ts     # Wrapper for Howler.js functionality
├── AudioManager.ts          # Main facade for the audio system
└── README.md                # This documentation file
```

### Component Responsibilities

#### AudioManager

The `AudioManager` acts as a facade for the entire audio system, providing a simplified API for other game components. It delegates specific responsibilities to specialized modules.

#### Core Components

- **AudioContextManager**: Manages the Web Audio context, master volume, and mute state. Handles local storage persistence for audio settings.
- **BufferManager**: Loads, analyzes, and caches audio buffers. Optimizes buffers for looping and manages memory usage.

#### Music Components

- **MusicPlayer**: Specializes in playing background music with smooth transitions and proper loop point handling.
- **ProceduralMusicGenerator**: Creates dynamic, 80s-style synth music in real-time using the Web Audio API.

#### Effect Components

- **SoundEffectPlayer**: Handles all one-shot sound effects, including laser sounds, collisions, and other game events.

#### Howler Integration

- **HowlerManager**: Provides integration with Howler.js for complex spatial audio and advanced sound capabilities that complement the Web Audio API implementation.

## Usage

```typescript
// Create an instance of AudioManager
const audioManager = new AudioManager();

// Initialize (can be called multiple times safely)
audioManager.initialize();

// Play music (falls back to procedural if files not loaded)
audioManager.playMenuThump();

// Play procedural music explicitly
audioManager.playMenuThump(true);

// Control volume (0-1 range)
audioManager.setVolume(0.5);

// Toggle mute state
audioManager.toggleMute();

// Load an external audio sample
await audioManager.loadAudioSample("explosion.mp3", "explosion");

// Play a previously loaded audio sample
const sourceNode = audioManager.playAudioSample("explosion", 0.7, false);

// Preload essential audio assets
await audioManager.preloadEssentialAudio();

// Clean up unused audio buffers to free memory
audioManager.cleanupUnusedAudio();

// Play game sound effects
audioManager.playLaserSound("energy");
audioManager.playAsteroidCollisionSound("medium");

// Play spatial audio with Howler.js
audioManager.playSpatialSound("explosion", { x: 10, y: 0, z: -5 });

// Clean up all audio resources when done
audioManager.dispose();
```

## Implementation Details

### Web Audio API

The audio system is built primarily on the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), providing high-performance, low-latency audio processing capabilities.

### Howler.js Integration

Howler.js is used as a complementary library for:

- Simplified spatial audio positioning
- Cross-browser audio compatibility
- More complex sound controls when needed
- Efficient audio sprites for grouped sound effects

### Procedural Music Generation

The `ProceduralMusicGenerator` creates synthesized soundtrack in real-time:

- **Bass Pattern**: Simple bass drum pattern for rhythm
- **Arpeggio Pattern**: D minor scale arpeggiation for melody
- **Hi-hat Pattern**: Noise-based hi-hat sounds on main beats
- **Bass Arpeggio**: Lower octave accompaniment for richer sound

### Audio Scheduler

The procedural music system uses a lookahead scheduler pattern to ensure precise timing:

1. Schedules several beats ahead of the current time
2. Uses `setTimeout` to regularly check and schedule more beats
3. Maintains tight synchronization even during heavy CPU load

### Performance Optimizations

- **Modular Design**: Each component focuses on specific functionality, improving code organization and maintainability
- **Buffer Management**: Efficient loading and caching of audio files with memory cleanup
- **Loop Point Optimization**: Analyzes audio files to find optimal loop points for seamless playback
- **Smooth Transitions**: Implements fade-in and fade-out for all audio to avoid clicks and pops
- **Node Reuse**: Creates audio nodes only when needed and reuses them when possible
- **Audio Sprites**: Groups similar sound effects for reduced HTTP requests and better memory usage

### Volume Management

- Volume and mute settings are persisted in `localStorage`
- Uses smooth volume transitions to avoid audio pops
- Applies volume scaling to avoid clipping
- Provides independent control for music, effects, and master volume

## Browser Compatibility

The audio system includes fallbacks for different browser implementations:

- Uses standard `AudioContext` with fallback to `webkitAudioContext`
- Handles suspended audio context states (common in mobile browsers)
- Safely catches and logs any errors during audio operations
- Leverages Howler.js for additional cross-browser support

## Error Handling

Each component includes comprehensive error handling:

- Graceful fallbacks when audio operations fail
- Detailed logging with component-specific prefixes
- Auto-recovery mechanisms for many common issues

## Extending the System

To add new audio functionality:

1. **New Sound Effect Types**: Extend the `SoundEffectPlayer` class with new methods
2. **New Music Features**: Add methods to the `MusicPlayer` or `ProceduralMusicGenerator`
3. **New Audio Sources**: Use the `BufferManager` to load and cache new audio files
4. **Exposing New Functionality**: Update the `AudioManager` facade to expose new features
5. **Custom Howler.js Features**: Extend the `HowlerManager` with specialized methods

## Future Improvements

Potential enhancements for the audio system:

- Enhanced spatial audio support for more immersive 3D sound positioning
- Audio visualization components for spectrum analysis display
- Fully dynamic music system that responds to game state and player actions
- WebAudio Worklet support for more efficient audio processing
- Adaptive volume based on game context and environmental factors

# Migration to Tone.js

The audio system has been successfully migrated from the Web Audio API to Tone.js to improve audio quality, performance, and maintainability. The migration is now complete.

## Migration Status

The audio system now exclusively uses Tone.js for all audio functionality:

1. ~~**Legacy mode**: Uses the original Web Audio API implementation~~ (Deprecated)
2. ~~**Hybrid mode**: Uses a mix of Web Audio API and Tone.js features for incremental migration~~ (Deprecated)
3. **Full Tone.js mode**: Uses the Tone.js implementation for all audio features (Active)

All features have been successfully migrated:

- ✅ Core audio infrastructure
- ✅ Basic sound effects
- ✅ UI sounds
- ✅ Procedural music
- ✅ Layered music
- ✅ Game sound effects
- ✅ Spatial audio (NEW)
- ✅ Effect presets (NEW)
- ✅ Dynamic music system (NEW)

## Advanced Features Added in Phase 6

The migration to Tone.js has enabled several new advanced features:

### Enhanced Procedural Music

- **Dynamic Scales**: Music can now use multiple musical scales (minor, major, pentatonic, dorian, etc.)
- **Chord Progressions**: Dynamic chord progression system for richer harmonic content
- **Game State Reactive**: Music now responds to game state parameters:
  - Intensity: Affects tempo and complexity
  - Danger: Affects harmonic content and filtering
  - Success: Changes between major/minor scales
  - Environment: Affects musical patterns and texture

### Spatial Audio

- **3D Positioning**: Full 3D audio with distance attenuation
- **Environment Simulation**: Different acoustic spaces (cave, underwater, space, etc.)
- **Listener Orientation**: Directional hearing based on listener orientation
- **Air Absorption**: Simulates high-frequency loss over distance

### Audio Effects System

- **Environment Presets**: Pre-defined effect chains for different game environments
- **Gameplay Effects**: Situational effects like slow-motion, damaged state, etc.
- **Effect Blending**: Dynamic blending between multiple effect presets
- **Master Effects Chain**: Global effects processing for all audio

## Architecture

The current architecture focuses on the Tone.js implementation:

```
src/audio/
├── tone/                       # Tone.js implementations
│   ├── ToneContextManager.ts   # Manages Tone.js context and volume
│   ├── ToneBufferManager.ts    # Handles audio buffer loading with Tone.js
│   ├── ToneMusicPlayer.ts      # Music playback with Tone.js
│   ├── ToneSoundEffectPlayer.ts # Sound effects with Tone.js
│   ├── ToneProceduralGenerator.ts # Procedural music with Tone.js
│   ├── ToneSpatialAudio.ts     # 3D spatial audio capabilities
│   ├── ToneEffectsChain.ts     # Audio effects processing chain
│   ├── ToneEffectPresets.ts    # Predefined effect presets
│   └── ToneAudioManager.ts     # Facade for Tone.js implementation
├── examples/                   # Example usage of advanced features
├── docs/                       # Documentation including feature matrix
├── AudioManagerFactory.ts      # Factory (now always returns Tone.js)
├── config.ts                   # Configuration (now set to use Tone.js)
└── initializeAudio.ts          # Simplified audio initialization
```

## Migration Plan Completion

The migration has been completed through all planned phases:

1. **Phase 1**: Analysis and Test Creation ✅
2. **Phase 2**: Implementation of Tone.js Components ✅
3. **Phase 3**: Integration and Toggle System ✅
4. **Phase 4**: Testing and Validation ✅
5. **Phase 5**: Gradual Migration ✅
6. **Phase 6**: Advanced Features with Tone.js ✅

## Using the New System

The API remains backward compatible while exposing new capabilities:

```typescript
// Core functionality works the same
const audioManager = AudioManagerFactory.getAudioManager();
await audioManager.initialize();
audioManager.setVolume(0.7);

// New advanced features
// Procedural music with game state parameters
audioManager.startGameplayMusic(0.6, 0.3, 0.8, "space");

// Update the game state dynamically
audioManager.updateGameState(0.8, 0.5, 0.2, "cave");

// Create and control spatial audio
const config = {
  id: "enemy_ship",
  bufferId: "engine",
  loop: true,
  position: { x: -10, y: 0, z: -5 },
};
audioManager.createSpatialSound(config);
audioManager.playSpatialSound("enemy_ship");

// Update listener and sound positions
audioManager.updateListenerPosition({ x: 0, y: 0, z: 0 });
audioManager.updateSpatialSoundPosition("enemy_ship", { x: -5, y: 0, z: -2 });

// Apply audio effect presets
audioManager.setEnvironmentEffects("underwater");
audioManager.addGameplayEffect("damaged");

// Blend effects together
audioManager.setEffectBlendAmount(0.7);
```

For detailed examples of the new advanced features, see the files in the `examples/` directory.
