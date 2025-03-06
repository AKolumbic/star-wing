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

// Clean up all audio resources when done
audioManager.dispose();
```

## Implementation Details

### Web Audio API

The audio system is built entirely on the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), providing high-performance, low-latency audio processing capabilities.

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

### Volume Management

- Volume and mute settings are persisted in `localStorage`
- Uses smooth volume transitions to avoid audio pops
- Applies volume scaling to avoid clipping

## Browser Compatibility

The audio system includes fallbacks for different browser implementations:

- Uses standard `AudioContext` with fallback to `webkitAudioContext`
- Handles suspended audio context states (common in mobile browsers)
- Safely catches and logs any errors during audio operations

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

## Future Improvements

Potential enhancements for the audio system:

- Spatial audio support for 3D sound positioning
- Audio visualization components
- Dynamic music system that responds to game state
- WebAudio Worklet support for more efficient audio processing
