# Star Wing Audio System

This directory contains the audio engine components for the Star Wing game.

## AudioManager

The `AudioManager` class is the central component of the game's audio system. It handles all sound generation, audio playback, and related settings.

### Features

- **Procedural Synthesized Music**: Creates dynamic, 80s-style synth music in real-time using the Web Audio API
- **Volume Controls**: Manages global volume settings and mute functionality with persistence in local storage
- **Audio Sample Support**: Loads and plays external audio files with caching for better performance
- **Resource Management**: Optimizes audio performance by caching common nodes and buffers
- **Memory-Safe Cleanup**: Properly disposes of audio resources when no longer needed

### Usage

```typescript
// Create an instance of AudioManager
const audioManager = new AudioManager();

// Initialize (can be called multiple times safely)
audioManager.initialize();

// Play procedural synth music for the menu
audioManager.playMenuThump();

// Control volume (0-1 range)
audioManager.setVolume(0.5);

// Toggle mute state
audioManager.toggleMute();

// Load an external audio sample
await audioManager.loadAudioSample("explosion.mp3", "explosion");

// Play a previously loaded audio sample
const sourceNode = audioManager.playAudioSample("explosion", 0.7, false);

// Clean up all audio resources when done
audioManager.dispose();
```

## Implementation Details

### Web Audio API

The audio system is built entirely on the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), providing high-performance, low-latency audio processing capabilities.

### Development Mode Audio

In development mode, the audio is muted by default to avoid disruption during testing. However, there are ways to enable audio in dev mode:

1. **URL Parameter Method**:
   Add the `enableDevAudio` parameter when launching the game in dev mode:

   ```
   http://localhost:3000/?dev&enableDevAudio
   ```

2. **Console Command Method**:
   While in dev mode, open the browser console and type:
   ```javascript
   game.toggleDevModeAudio();
   ```
3. **Procedural Audio**:
   When using dev mode with audio enabled, the game will use the procedural audio system instead of the MP3 files. This allows for faster testing of audio features without waiting for asset loading.

### Procedural Music Generation

Rather than using pre-recorded music files, the game generates a synthesized soundtrack in real-time:

- **Bass Pattern**: Simple bass drum pattern for rhythm
- **Arpeggio Pattern**: D minor scale arpeggiation for melody
- **Synth Chords**: Rich synth pads with chorus effects

### Audio Scheduler

The music system uses a lookahead scheduler pattern to ensure precise timing:

1. Schedules several beats ahead of the current time
2. Uses `setTimeout` to regularly check and schedule more beats
3. Maintains tight synchronization even during heavy CPU load

### Performance Optimizations

- **Node Caching**: Reuses common filter nodes rather than recreating them
- **Audio Buffer Caching**: Stores loaded audio samples to avoid reloading
- **Efficient Cleanup**: Properly disconnects and disposes of all audio resources

### Volume Management

- Volume and mute settings are persisted in `localStorage`
- Uses smooth volume transitions to avoid audio pops
- Applies volume scaling to avoid clipping

## Browser Compatibility

The audio system includes fallbacks for different browser implementations:

- Uses standard `AudioContext` with fallback to `webkitAudioContext`
- Handles suspended audio context states (common in mobile browsers)
- Safely catches and logs any errors during audio operations

## Future Improvements

Potential enhancements for the audio system:

- Spatial audio for game effects
- Dynamic music system that responds to game state
- Additional procedural music patterns
- WebAudio Worklet support for more efficient audio processing
