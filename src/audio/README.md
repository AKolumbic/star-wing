# Star Wing Audio System

This directory contains the audio system for the Star Wing game. The system has been fully updated to use Tone.js, a modern and powerful audio library, for all audio functionalities.

## Overview

The audio system manages music, sound effects, and spatial audio. It is designed as a set of modular components that:

- Manage the audio context and volume
- Load and cache audio buffers
- Play music and procedural soundtracks
- Handle sound effects, including 3D spatial audio
- Apply audio effects and presets for immersive game environments

## Directory Structure

```
src/audio/
├── tone/                       # Tone.js-based implementations
│   ├── ToneContextManager.ts   # Manages the Tone.js audio context and volume controls
│   ├── ToneBufferManager.ts    # Loads and caches audio buffers
│   ├── ToneMusicPlayer.ts      # Handles music playback and transitions
│   ├── ToneSoundEffectPlayer.ts # Manages sound effect playback
│   ├── ToneProceduralGenerator.ts # Generates procedural music in real time
│   ├── ToneSpatialAudio.ts     # Provides 3D spatial audio capabilities
│   ├── ToneEffectsChain.ts     # Manages audio effects processing
│   ├── ToneEffectPresets.ts    # Offers predefined audio effect configurations
│   └── ToneAudioManager.ts     # Main façade for the Tone.js audio system
├── docs/                       # Documentation including examples of advanced audio features
├── AudioManagerFactory.ts      # Factory module to instantiate the audio manager
├── config.ts                   # Configuration settings for the audio system
└── initializeAudio.ts          # Simplified audio initialization script
```

## Getting Started

To use the audio system, import the AudioManager from the factory and initialize it:

```typescript
import { AudioManagerFactory } from "./AudioManagerFactory";

const audioManager = AudioManagerFactory.getAudioManager();

await audioManager.initialize();
audioManager.setVolume(0.7);
// Play sounds, music, and spatial audio as needed
```

## Advanced Features

- **Procedural Music:** Generate dynamic, real-time music that adapts to game state.
- **Spatial Audio:** Experience full 3D audio with real positional sound processing.
- **Audio Effects:** Use predefined and customizable effects to enhance game environments.
- **Unified API:** Enjoy a consistent interface for both music and sound effects.

## Notes

- The system now exclusively uses Tone.js for improved performance and flexibility.
- The API is backward compatible, so existing integrations require minimal changes.
- For detailed usage examples, refer to the examples directory.

## License

[Specify License Information Here]
