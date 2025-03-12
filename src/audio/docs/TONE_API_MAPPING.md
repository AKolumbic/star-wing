# Audio API Mapping: Web Audio API to Tone.js

This document maps the current Web Audio API implementation to equivalent Tone.js functionality to guide the refactoring effort.

## Core Components

### AudioContextManager → ToneContextManager

| Current Implementation              | Tone.js Equivalent                   | Notes                                     |
| ----------------------------------- | ------------------------------------ | ----------------------------------------- |
| `new AudioContext()`                | `Tone.getContext()`                  | Tone.js provides a global context manager |
| `audioContext.createGain()`         | `new Tone.Gain()`                    | Tone.js has a Gain class                  |
| `mainGainNode.gain.value`           | `Tone.getDestination().volume.value` | Set in dB in Tone.js                      |
| `mainGainNode.connect(destination)` | `toneNode.toDestination()`           | Different connection pattern              |
| `audioContext.currentTime`          | `Tone.now()`                         | Get current time                          |
| `tryResume()`                       | `Tone.start()`                       | Resume audio context                      |
| `createGainNode()`                  | `new Tone.Gain()`                    | Create gain node                          |
| `createOscillator()`                | `new Tone.Oscillator()`              | Create oscillator                         |
| `createBiquadFilter()`              | `new Tone.Filter()`                  | Create filter                             |
| `setVolume(volume)`                 | `linearToDb()` and volume setting    | Linear to dB conversion                   |
| `toggleMute()`                      | `rampTo(-Infinity)` for mute         | Smooth fade to silence                    |

### BufferManager → ToneBufferManager

| Current Implementation | Tone.js Equivalent                  | Notes                             |
| ---------------------- | ----------------------------------- | --------------------------------- |
| `audioBufferCache`     | `Tone.ToneAudioBuffers`             | Buffer management                 |
| `loadAudioSample()`    | `new Tone.ToneAudioBuffer().load()` | Load individual audio buffers     |
| `analyzeLoopPoints()`  | `Tone.Player` with loop property    | Player has built-in loop handling |
| `cleanupUnused()`      | `buffer.dispose()`                  | Must manually dispose buffers     |
| `preloadEssentials()`  | Custom implementation with promises | Preloads essential game audio     |
| `getBuffer()`          | Access buffer from cache            | Buffer retrieval                  |

## Sound Effects

### SoundEffectPlayer → ToneSoundEffectPlayer

| Current Implementation         | Tone.js Equivalent                     | Notes                             |
| ------------------------------ | -------------------------------------- | --------------------------------- |
| `playTestTone()`               | `new Tone.Oscillator().start().stop()` | Simple oscillator control         |
| `playAudioSample()`            | `new Tone.Player().start()`            | Player can play a buffer          |
| `playLaserSound()`             | Custom `Tone.Synth` configuration      | More flexible synth configuration |
| `playCollisionSound()`         | `Tone.NoiseSynth` with effects         | More flexible effect routing      |
| `playAsteroidCollision()`      | Custom effect chain                    | Specialized sound effects         |
| `playLaserAsteroidExplosion()` | Complex Tone.js synthesis              | Multi-layered sound design        |
| `stopAllEffects()`             | Cleanup for all active players         | Resource management               |

## Music

### MusicPlayer → ToneMusicPlayer

| Current Implementation    | Tone.js Equivalent                   | Notes                     |
| ------------------------- | ------------------------------------ | ------------------------- |
| `playMenuMusic()`         | `Tone.Player` with looping           | Player with loop enabled  |
| `startLayeredMusic()`     | Managed players with synchronization | Custom layer management   |
| `addMusicLayer()`         | Add synchronized track               | Multi-track music system  |
| `setLayerVolume()`        | `Tone.Gain` control with ramping     | Smooth volume transitions |
| `removeMusicLayer()`      | Remove player with fade out          | Clean up resources        |
| `stopLayeredMusic()`      | Stop all players                     | Resource cleanup          |
| `createMenuMusicPlayer()` | Pre-create player to reduce latency  | Performance optimization  |

### ProceduralMusicGenerator → ToneProceduralGenerator

| Current Implementation | Tone.js Equivalent                | Notes                              |
| ---------------------- | --------------------------------- | ---------------------------------- |
| `startMenuMusic()`     | `Tone.Sequence`                   | Pattern-based sequencing           |
| `scheduleBeats()`      | `Tone.Transport.schedule()`       | Transport handles timing           |
| `playBass()`           | `Tone.MembraneSynth`              | Better drum sounds                 |
| `playNoiseHihat()`     | `Tone.NoiseSynth`                 | Dedicated noise generator          |
| `playArpeggio()`       | `Tone.Sequence` with `Tone.Synth` | More accurate timing               |
| `playBassArpeggio()`   | `Tone.MonoSynth`                  | Better bass sounds                 |
| `startGameplayMusic()` | Dynamic pattern generation        | Reactive music system              |
| `updateParameters()`   | Runtime pattern modification      | Adaptive music based on game state |

## Effects Processing

### (New) ToneEffectsChain

| Implementation          | Tone.js Equivalent                      | Notes                      |
| ----------------------- | --------------------------------------- | -------------------------- |
| `createMasterEffects()` | Tone.js effect chain                    | Master effects processing  |
| `createReverb()`        | `Tone.Reverb`                           | Spatial reverb processing  |
| `createFilter()`        | `Tone.Filter`                           | Frequency filtering        |
| `createDistortion()`    | `Tone.Distortion`                       | Audio distortion           |
| `createChorus()`        | `Tone.Chorus`                           | Chorus/modulation effects  |
| `createDelay()`         | `Tone.FeedbackDelay`                    | Delay with feedback        |
| `applyPreset()`         | Configure multiple effects with presets | Quick effect configuration |

### (New) ToneEffectPresets

| Implementation           | Tone.js Equivalent         | Notes                              |
| ------------------------ | -------------------------- | ---------------------------------- |
| `getEnvironmentPreset()` | Predefined effect settings | Presets for different environments |
| `getGameplayPreset()`    | Predefined effect settings | Presets for gameplay situations    |
| `blendPresets()`         | Mix multiple presets       | Crossfade between effect settings  |

## Spatial Audio

### (New) ToneSpatialAudio

| Implementation                 | Tone.js Equivalent                 | Notes                       |
| ------------------------------ | ---------------------------------- | --------------------------- |
| `createSpatialSound()`         | `Tone.Panner3D` with player        | 3D positioned audio sources |
| `updateListenerPosition()`     | `Tone.Listener` positioning        | 3D listener positioning     |
| `playSpatialSound()`           | Play with position                 | Positioned sound playback   |
| `updateSpatialSoundPosition()` | Update panner position             | Dynamic sound positioning   |
| `stopSpatialSound()`           | Stop with optional fade out        | Cleanup for spatial sounds  |
| `setEnvironmentSize()`         | Configure spatial audio properties | Room size and reverb        |

## Main AudioManager Facade → ToneAudioManager

| Current Implementation    | Tone.js Equivalent                   | Notes                              |
| ------------------------- | ------------------------------------ | ---------------------------------- |
| `initialize()`            | `Tone.start()`                       | Start audio context                |
| `playMenuMusic()`         | Delegate to ToneMusicPlayer          | Same API, different implementation |
| `setVolume()`             | `Tone.getDestination().volume.value` | Set master volume                  |
| `toggleMute()`            | `Tone.getDestination().mute`         | Mute functionality                 |
| `loadAudioSample()`       | `Tone.ToneAudioBuffer.load()`        | Buffer loading                     |
| `playAudioSample()`       | `Tone.Player().start()`              | Sample playback                    |
| `playLaserSound()`        | Custom Tone.js synth                 | Implement with synths              |
| `cleanupUnusedAudio()`    | Dispose unused buffers               | Clean up resources                 |
| `playGameLoopMusic()`     | Layered music playback               | Game music system                  |
| `startLayeredMusic()`     | Multi-track music playback           | Adaptive music system              |
| `updateGameState()`       | Update music parameters              | Reactive audio system              |
| `setEnvironmentEffects()` | Apply environment effect presets     | Audio environment configuration    |
| `addGameplayEffect()`     | Apply gameplay effect presets        | Dynamic audio effects              |
| `createSpatialSound()`    | Configure 3D audio                   | Spatial audio integration          |

## Test Cases Needed

1. **Context Management**

   - Initialize audio context
   - Resume suspended context
   - Set/get volume
   - Toggle mute/unmute

2. **Buffer Management**

   - Load audio buffer
   - Cache and retrieve buffer
   - Clean up unused buffers
   - Preload essential sounds

3. **Sound Effects**

   - Play test tone
   - Play audio sample
   - Play specialized sound effects (laser, collision)
   - Test different sound variations

4. **Music Playback**

   - Play menu music
   - Start layered music
   - Add/remove music layers
   - Control layer volumes
   - Stop music playback

5. **Procedural Music**

   - Generate procedural music
   - Stop procedural music
   - Modify procedural patterns at runtime
   - Test adaptive music based on game parameters

6. **Effects Processing**

   - Apply different environment presets
   - Add/remove gameplay effects
   - Test effect blending
   - Verify audio quality with effects

7. **Spatial Audio**
   - Create spatial sound sources
   - Update listener and sound positions
   - Test distance attenuation
   - Verify 3D audio positioning
