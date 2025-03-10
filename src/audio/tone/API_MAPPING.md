# Audio API Mapping: Web Audio API to Tone.js

This document maps the current Web Audio API implementation to equivalent Tone.js functionality to guide the refactoring effort.

## Core Components

### AudioContextManager

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

### BufferManager

| Current Implementation | Tone.js Equivalent               | Notes                             |
| ---------------------- | -------------------------------- | --------------------------------- |
| `audioBufferCache`     | `Tone.ToneAudioBuffers`          | Buffer management                 |
| `loadAudioSample()`    | `Tone.ToneAudioBuffer.load()`    | Load audio buffers                |
| `analyzeLoopPoints()`  | `Tone.Player` with loop points   | Player has built-in loop handling |
| `cleanupUnused()`      | `Tone.ToneAudioBuffer.dispose()` | Must manually dispose             |

## Sound Effects

### SoundEffectPlayer

| Current Implementation | Tone.js Equivalent                     | Notes                        |
| ---------------------- | -------------------------------------- | ---------------------------- |
| `playTestTone()`       | `new Tone.Oscillator().start().stop()` | Simple oscillator control    |
| `playAudioSample()`    | `new Tone.Player().start()`            | Player can play a buffer     |
| `playLaserSound()`     | Custom synth with Tone.js              | Can use more advanced synths |
| `playCollisionSound()` | Custom effect chain                    | More flexible effect routing |

## Music

### MusicPlayer

| Current Implementation | Tone.js Equivalent                     | Notes                                    |
| ---------------------- | -------------------------------------- | ---------------------------------------- |
| `playMenuMusic()`      | `Tone.Player` with looping             | Player with loop enabled                 |
| `startLayeredMusic()`  | `Tone.Transport` with multiple players | Transport for synchronization            |
| `addMusicLayer()`      | Add synchronized track                 | Transport can schedule multiple patterns |
| `setLayerVolume()`     | `Tone.Gain` control                    | Volume automation                        |
| `removeMusicLayer()`   | Remove player or fade out              | Clean up resources                       |
| `stopLayeredMusic()`   | Stop all players                       | Clean up resources                       |

### ProceduralMusicGenerator

| Current Implementation | Tone.js Equivalent                | Notes                     |
| ---------------------- | --------------------------------- | ------------------------- |
| `startMenuMusic()`     | `Tone.Sequence`                   | Easier pattern sequencing |
| `scheduleBeats()`      | `Tone.Transport.schedule()`       | Transport handles timing  |
| `playBass()`           | `Tone.MembraneSynth`              | Better drum sounds        |
| `playNoiseHihat()`     | `Tone.NoiseSynth`                 | Dedicated noise generator |
| `playArpeggio()`       | `Tone.Sequence` with `Tone.Synth` | More accurate timing      |
| `playBassArpeggio()`   | `Tone.MonoSynth`                  | Better bass sounds        |

## Main AudioManager Facade

| Current Implementation | Tone.js Equivalent                   | Notes                              |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| `initialize()`         | `Tone.start()`                       | Start audio context                |
| `playMenuMusic()`      | Delegate to Tone.js player           | Same API, different implementation |
| `setVolume()`          | `Tone.getDestination().volume.value` | Set master volume                  |
| `toggleMute()`         | `Tone.getDestination().mute`         | Mute functionality                 |
| `loadAudioSample()`    | `Tone.ToneAudioBuffer.load()`        | Buffer loading                     |
| `playAudioSample()`    | `Tone.Player().start()`              | Sample playback                    |
| `playLaserSound()`     | Custom Tone.js synth                 | Implement with synths              |
| `cleanupUnusedAudio()` | Dispose unused buffers               | Clean up resources                 |

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

3. **Sound Effects**

   - Play test tone
   - Play audio sample
   - Play specialized sound effects (laser, collision)

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
