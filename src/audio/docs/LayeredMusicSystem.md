# Layered Music System

The Star Wing audio system supports layered music through Tone.js, which allows multiple music tracks to play simultaneously in perfect synchronization. This enables dynamic soundtrack changes during gameplay by adding or removing layers, or adjusting their relative volumes.

## Overview

The layered music system allows:

1. Playing multiple synchronized audio tracks
2. Adding or removing layers during gameplay
3. Adjusting the volume of individual layers
4. Creating dynamic soundtracks that respond to game events
5. Applying per-layer effects processing
6. Beat-synchronized transitions between layers

## Required Audio Files

For the first level implementation, we use two audio tracks:

- `assets/audio/star-wing_game-loop.mp3` - The base game music track (plays at full volume)
- `assets/audio/star-wing_menu-loop.mp3` - The menu music (used as a subtle background layer at 5-10% volume)

**Important:** For proper synchronization, all music tracks must:

- Have the same duration
- Use the same tempo
- Be designed to loop seamlessly
- Be mixed to blend well together

## Basic Usage

```typescript
// Get the ToneAudioManager instance
const audioManager = ToneAudioManager.getInstance();

// Preload the music for a specific level
await audioManager.preloadLevelMusic("level1");

// Start playing the layered music for the level
audioManager.playLevelMusic("level1");
```

When playing level 1 music, the system will:

1. Start playing the base game track at full volume
2. Automatically add the menu music as a subtle background layer (5-10% volume)

## Advanced Usage

### Manually Adding Layers

```typescript
// Add a music layer with specified volume and 1-second fade-in
// For menu music during gameplay, use low volume (0.07 = 7%)
audioManager.addMusicLayer("menuMusic", 0.07, 1.0);

// For game music, use full volume
audioManager.addMusicLayer("gameMusic", 1.0, 1.0);
```

### Adjusting Layer Volume

```typescript
// Adjust menu music layer to low volume with a 0.5-second fade
audioManager.setLayerVolume("menuMusic", 0.07, 0.5);

// Ensure game music is at full volume
audioManager.setLayerVolume("gameMusic", 1.0, 0.5);
```

### Removing Layers

```typescript
// Remove a layer with a 2-second fade-out
audioManager.removeMusicLayer("trackId", 2.0);
```

### Stopping All Music

```typescript
// Stop all music with a 1-second fade-out
audioManager.stopMusic(1.0);
```

### Applying Effects to Layers

```typescript
// Apply reverb to a specific layer
audioManager.applyLayerEffect("ambientLayer", "reverb", 0.3);

// Apply filter to a layer
audioManager.applyLayerEffect("bassLayer", "lowpass", { frequency: 800 });

// Remove effect from a layer
audioManager.removeLayerEffect("ambientLayer", "reverb");
```

## Creating Custom Layered Music

To create additional layered music for other levels:

1. Create music tracks with the same tempo and duration
2. Add them to the assets folder
3. Update the `preloadLevelMusic` method in `ToneAudioManager` to load your new tracks
4. Modify the `playLevelMusic` method to handle your new level

Example of adding music for a new level:

```typescript
// In ToneAudioManager.ts, update preloadLevelMusic:
if (levelId === "level2") {
  await this.bufferManager.loadAudioSample(
    "assets/audio/level2-base.mp3",
    "level2Base",
    true
  );
  await this.bufferManager.loadAudioSample(
    "assets/audio/level2-layer1.mp3",
    "level2Layer1",
    true
  );
  await this.bufferManager.loadAudioSample(
    "assets/audio/level2-layer2.mp3",
    "level2Layer2",
    true
  );
}

// Then update playLevelMusic:
if (levelId === "level2") {
  this.musicPlayer.startLayeredMusic("level2Base", 1.0);
  // Add initial layers or schedule them to be added later
  setTimeout(() => {
    this.musicPlayer.addMusicLayer("level2Layer1", 0.4, 2.0);
  }, 10000); // Add after 10 seconds
}
```

## Dynamic Music Based on Gameplay

You can create a dynamic soundtrack by adjusting layers based on gameplay events:

```typescript
// When player enters combat
function onCombatStart() {
  audioManager.addMusicLayer("combatLayer", 0.6, 1.0);
}

// When combat intensity increases
function onCombatIntensify() {
  audioManager.setLayerVolume("combatLayer", 0.8, 0.5);
  audioManager.addMusicLayer("intenseCombatLayer", 0.5, 1.0);
}

// When player leaves combat
function onCombatEnd() {
  audioManager.removeMusicLayer("intenseCombatLayer", 2.0);
  audioManager.removeMusicLayer("combatLayer", 3.0);
}
```

## Beat-Synced Layer Changes

Tone.js allows for precise rhythmic synchronization:

```typescript
// Add a layer on the next bar boundary (typically 4 beats)
audioManager.addMusicLayerOnNextBar("rhythmLayer", 0.6);

// Remove a layer at a specific time in the musical structure
audioManager.removeMusicLayerAtTime("rhythmLayer", "4n"); // Remove after a quarter note
```

## Implementation Details

The layered music system works by:

1. Using Tone.js `Player` objects for each track in perfect synchronization
2. Calculating the exact position in the loop for new layers using `Tone.Transport`
3. Using `Tone.Gain` nodes to control the volume of each layer individually
4. Managing smooth transitions with Tone.js parameter scheduling
5. Applying Tone.js effects to individual layers or the master output
6. Synchronizing with Tone.js Transport for beat-accurate timing

## Current Capabilities

The current implementation supports:

- Up to 8 simultaneous layers
- Volume control for each layer with smooth transitions
- Adding and removing layers dynamically
- Beat-synchronized layer transitions
- Per-layer audio effects
- Environment-based effects presets
- Spatial positioning for selected layers

## Example Implementation

For a complete example showing how to use the layered music system, see:
`docs/examples/LayeredMusicExample.ts`
