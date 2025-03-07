# Layered Music System

The Star Wing audio system now supports layered music, which allows multiple music tracks to play simultaneously in perfect synchronization. This enables dynamic soundtrack changes during gameplay by adding or removing layers, or adjusting their relative volumes.

## Overview

The layered music system allows:

1. Playing multiple synchronized audio tracks
2. Adding or removing layers during gameplay
3. Adjusting the volume of individual layers
4. Creating dynamic soundtracks that respond to game events

## Required Audio Files

For the first level implementation, we use two audio tracks:

- `assets/audio/star-wing_game-loop.mp3` - The base game music track
- `assets/audio/star-wing_menu-loop.mp3` - The menu music (used as a layer in level 1)

**Important:** For proper synchronization, all music tracks must:

- Have the same duration
- Use the same tempo
- Be designed to loop seamlessly
- Be mixed to blend well together

## Basic Usage

```typescript
// Get the AudioManager instance
const audioManager = AudioManager.getInstance();

// Preload the music for a specific level
await audioManager.preloadLevelMusic("level1");

// Start playing the layered music for the level
audioManager.playLevelMusic("level1");
```

When playing level 1 music, the system will:

1. Start playing the base game track
2. Automatically add the menu music as a layer after 5 seconds

## Advanced Usage

### Manually Adding Layers

```typescript
// Add a music layer with 50% volume and 1-second fade-in
audioManager.addMusicLayer("trackId", 0.5, 1.0);
```

### Adjusting Layer Volume

```typescript
// Adjust a layer's volume to 30% with a 0.5-second fade
audioManager.setLayerVolume("trackId", 0.3, 0.5);
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

## Creating Custom Layered Music

To create additional layered music for other levels:

1. Create music tracks with the same tempo and duration
2. Add them to the assets folder
3. Update the `preloadLevelMusic` method in `AudioManager` to load your new tracks
4. Modify the `playLevelMusic` method to handle your new level

Example of adding music for a new level:

```typescript
// In AudioManager.ts, update preloadLevelMusic:
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

## Implementation Details

The layered music system works by:

1. Creating synchronized AudioBufferSourceNodes for each track
2. Calculating the exact position in the loop for new layers
3. Using GainNodes to control the volume of each layer individually
4. Managing smooth transitions with the Web Audio API's parameter automation

## Future Enhancements

The current implementation supports:

- Up to 5 simultaneous layers
- Volume control for each layer
- Adding and removing layers dynamically

Potential future enhancements:

- Spatial audio for layers (3D positioning)
- Audio effects per layer (reverb, filters)
- Automated layer management based on game state
- Beat-synchronized layer transitions

## Example Implementation

For a complete example showing how to use the layered music system, see:
`examples/LayeredMusicExample.ts`
