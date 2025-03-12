/**
 * Advanced Tone.js Features Example
 *
 * This file demonstrates how to use the advanced features implemented in Phase 6:
 * - Enhanced procedural music generation
 * - Spatial audio
 * - Effect presets and blending
 * - Game state reactive audio
 */

import { ToneAudioManager } from "../tone/ToneAudioManager";
import { Position3D, SpatialSoundConfig } from "../tone/ToneSpatialAudio";

// Create a shorthand reference to the audio manager
const audio = ToneAudioManager.getInstance();

/**
 * Example 1: Enhanced Procedural Music
 * Shows how to use the procedural music generator with game state parameters
 */
async function demoProceduralMusic(): Promise<void> {
  // Initialize the audio system
  await audio.initialize();

  console.log("Starting procedural music demo...");

  // Start gameplay music with default parameters
  audio.startGameplayMusic(0.5, 0.2, 0.5, "space");

  // After 5 seconds, increase intensity for more dramatic music
  setTimeout(() => {
    console.log("Increasing intensity...");
    audio.updateGameState(0.8, 0.6);
  }, 5000);

  // After 10 seconds, change to major scale for triumphant feeling
  setTimeout(() => {
    console.log("Increasing success parameter (changes to major scale)...");
    audio.updateGameState(0.8, 0.6, 0.9);
  }, 10000);

  // After 15 seconds, change environment to cave
  setTimeout(() => {
    console.log("Changing environment to cave...");
    audio.updateGameState(0.5, 0.4, 0.5, "cave");
  }, 15000);

  // After 20 seconds, stop the music
  setTimeout(() => {
    console.log("Stopping procedural music");
    audio.stopMenuMusic();
  }, 20000);
}

/**
 * Example 2: Spatial Audio
 * Demonstrates 3D positioned audio with movement
 */
async function demoSpatialAudio(): Promise<void> {
  // Initialize the audio system
  await audio.initialize();

  // Load some sound effects if not already loaded
  await audio.loadAudioSample("assets/audio/sfx/engine.wav", "engine");
  await audio.loadAudioSample("assets/audio/sfx/alert.wav", "alert");
  await audio.loadAudioSample("assets/audio/sfx/ambient.wav", "ambient");

  console.log("Starting spatial audio demo...");

  // Create a spatial sound source for an engine sound
  const engineConfig: SpatialSoundConfig = {
    id: "ship_engine",
    bufferId: "engine",
    loop: true,
    volume: 0.7,
    position: { x: -10, y: 0, z: 0 },
    rolloffFactor: 1,
    refDistance: 5,
    maxDistance: 100,
  };

  // Create a spatial sound source for an alert
  const alertConfig: SpatialSoundConfig = {
    id: "alert_beacon",
    bufferId: "alert",
    loop: true,
    volume: 0.5,
    position: { x: 10, y: 5, z: -10 },
    rolloffFactor: 1.5,
    refDistance: 3,
    maxDistance: 50,
  };

  // Create a spatial sound source for ambient noise
  const ambientConfig: SpatialSoundConfig = {
    id: "ambient_source",
    bufferId: "ambient",
    loop: true,
    volume: 0.3,
    position: { x: 0, y: -5, z: -20 },
    rolloffFactor: 0.5,
    refDistance: 10,
    maxDistance: 200,
  };

  // Set environment with reverb
  audio.setEnvironmentEffects("space");

  // Create and play the sounds
  audio.createSpatialSound(engineConfig);
  audio.createSpatialSound(alertConfig);
  audio.createSpatialSound(ambientConfig);

  // Position the listener at the center initially
  audio.updateListenerPosition({ x: 0, y: 0, z: 0 });

  // Point the listener forward
  audio.updateListenerOrientation(
    { x: 0, y: 0, z: -1 }, // forward
    { x: 0, y: 1, z: 0 } // up
  );

  // Play the spatial sounds
  audio.playSpatialSound("ship_engine");
  audio.playSpatialSound("alert_beacon");
  audio.playSpatialSound("ambient_source");

  // Move the listener in a circle around the scene
  let angle = 0;
  const moveInterval = setInterval(() => {
    // Calculate new position in a circle
    const radius = 8;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Update listener position
    audio.updateListenerPosition({ x, y: 0, z });

    // Calculate forward direction (always looking at the center)
    const forward: Position3D = {
      x: -x,
      y: 0,
      z: -z,
    };

    // Normalize the forward vector
    const length = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
    forward.x /= length;
    forward.z /= length;

    // Update listener orientation
    audio.updateListenerOrientation(forward, { x: 0, y: 1, z: 0 });

    // Increase angle for next frame
    angle += 0.05;

    console.log(`Listener moved to (${x.toFixed(2)}, 0, ${z.toFixed(2)})`);
  }, 100);

  // Stop the demo after 20 seconds
  setTimeout(() => {
    clearInterval(moveInterval);
    audio.stopSpatialSound("ship_engine", 1);
    audio.stopSpatialSound("alert_beacon", 1);
    audio.stopSpatialSound("ambient_source", 1);
    console.log("Spatial audio demo complete");
  }, 20000);
}

/**
 * Example 3: Effect Presets and Blending
 * Shows how to use audio effect presets for different game situations
 */
async function demoEffectPresets(): Promise<void> {
  // Initialize the audio system
  await audio.initialize();

  // Load some music if not already loaded
  await audio.loadAudioSample("assets/audio/music/gameplay.mp3", "gameplay");

  console.log("Starting effect presets demo...");

  // Play background music
  audio.playAudioSample("gameplay", 0.7, true);

  // Start with normal space environment
  audio.setEnvironmentEffects("space");
  console.log("Applied space environment preset");

  // After 5 seconds, add slow motion effect
  setTimeout(() => {
    audio.addGameplayEffect("slowMotion");
    console.log("Added slow motion effect");
  }, 5000);

  // After 10 seconds, change to underwater environment with slow motion
  setTimeout(() => {
    audio.setEnvironmentEffects("underwater");
    console.log("Changed to underwater environment");
  }, 10000);

  // After 15 seconds, clear all effects and apply the damaged effect
  setTimeout(() => {
    audio.clearGameplayEffects();
    audio.addGameplayEffect("damaged");
    console.log("Applied damaged effect");
  }, 15000);

  // After 20 seconds, add the boss battle effect blended with damage
  setTimeout(() => {
    audio.addGameplayEffect("bossBattle");
    audio.setEffectBlendAmount(0.7); // Boss effect is dominant
    console.log("Added boss battle effect with blend");
  }, 20000);

  // After 25 seconds, return to normal
  setTimeout(() => {
    audio.clearGameplayEffects();
    audio.setEnvironmentEffects("space");
    console.log("Cleared all effects and returned to space");
  }, 25000);
}

/**
 * Example 4: Combined Demo
 * Shows how all features can work together for immersive audio
 */
async function demoAllFeatures(): Promise<void> {
  // Initialize the audio system
  await audio.initialize();

  console.log("Starting comprehensive audio demo...");

  // Start with ambient procedural music
  audio.startGameplayMusic(0.3, 0.1, 0.6, "space");

  // Set up spatial sounds
  await audio.loadAudioSample("assets/audio/sfx/enemy.wav", "enemy");
  const enemyConfig: SpatialSoundConfig = {
    id: "enemy_ship",
    bufferId: "enemy",
    loop: true,
    volume: 0.6,
    position: { x: -20, y: 0, z: -20 },
    rolloffFactor: 1.2,
    refDistance: 5,
    maxDistance: 100,
  };

  audio.createSpatialSound(enemyConfig);
  audio.playSpatialSound("enemy_ship");

  // Position listener
  audio.updateListenerPosition({ x: 0, y: 0, z: 0 });
  audio.updateListenerOrientation({ x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });

  // Enemy approaches scenario:
  let enemyDistance = 20;
  const enemyInterval = setInterval(() => {
    // Move enemy closer
    enemyDistance -= 0.5;
    const enemyX = -enemyDistance * 0.5;
    const enemyZ = -enemyDistance;

    // Update enemy position
    audio.updateSpatialSoundPosition("enemy_ship", {
      x: enemyX,
      y: 0,
      z: enemyZ,
    });

    // Adjust danger and intensity based on distance
    const normalizedDistance = Math.min(1, Math.max(0, enemyDistance / 20));
    const danger = 1 - normalizedDistance;
    const intensity = 0.3 + 0.7 * danger;

    // Update the procedural music based on enemy proximity
    audio.updateGameState(intensity, danger);

    // When enemy gets too close, add the battle effect
    if (enemyDistance < 8 && enemyDistance > 7.5) {
      console.log("Enemy closing in - battle effects activated");
      audio.addGameplayEffect("bossBattle");
    }

    // When enemy gets extremely close, add damage effect
    if (enemyDistance < 3 && enemyDistance > 2.5) {
      console.log("Taking damage - damage effects activated");
      audio.addGameplayEffect("damaged");
    }

    console.log(
      `Enemy at distance ${enemyDistance.toFixed(2)}, danger: ${danger.toFixed(
        2
      )}`
    );
  }, 200);

  // Stop the demo after 30 seconds
  setTimeout(() => {
    clearInterval(enemyInterval);
    audio.stopSpatialSound("enemy_ship", 2);
    audio.clearGameplayEffects();
    audio.stopMenuMusic();
    console.log("Comprehensive demo complete");
  }, 30000);
}

// Function to run the demos
export async function runToneJsDemos(): Promise<void> {
  console.log("Tone.js Advanced Features Demo");
  console.log("------------------------------");

  // Uncomment the demo you want to run:

  // await demoProceduralMusic();
  // await demoSpatialAudio();
  // await demoEffectPresets();
  // await demoAllFeatures();

  console.log(
    "Demo complete. Use ToneAudioManager.getInstance().dispose() to clean up when done."
  );
}

// Auto-run the demo if this file is executed directly
if (typeof window !== "undefined" && window.document) {
  window.addEventListener("DOMContentLoaded", () => {
    const startButton = document.createElement("button");
    startButton.textContent = "Start Audio Demo";
    startButton.style.padding = "10px 20px";
    startButton.style.fontSize = "16px";
    startButton.style.margin = "20px";

    startButton.addEventListener("click", async () => {
      startButton.disabled = true;
      startButton.textContent = "Demo Running...";

      try {
        await runToneJsDemos();
        startButton.textContent = "Demo Complete";
      } catch (error) {
        console.error("Error running demo:", error);
        startButton.textContent = "Error Running Demo";
      }
    });

    document.body.appendChild(startButton);
  });
}
