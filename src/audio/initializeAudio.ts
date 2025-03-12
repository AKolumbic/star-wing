/**
 * Audio System Initialization
 * This file ensures that the audio system is properly initialized with Tone.js
 */

import { AudioManagerFactory } from "./AudioManagerFactory";
import { Logger } from "../utils/Logger";

// Flag to track if the audio system has been initialized
let audioSystemInitialized = false;

/**
 * Initializes the audio system for the game.
 */
export async function initializeAudioSystem(): Promise<void> {
  const logger = Logger.getInstance();

  // Skip if already initialized
  if (audioSystemInitialized) {
    logger.debug("Audio system already initialized, skipping");
    return Promise.resolve();
  }

  const audioManager = AudioManagerFactory.getAudioManager();

  try {
    // Initialize audio - this now includes preloading essential audio internally
    await audioManager.initialize();

    // No need to call preloadEssentialAudio separately - it's handled in initialize()

    logger.info("Audio system initialized successfully with Tone.js");

    // Mark as initialized
    audioSystemInitialized = true;
  } catch (error) {
    logger.error("Failed to initialize audio system:", error);
    throw error;
  }
}

/**
 * Gets the instance of the audio manager
 * This will always return the Tone.js implementation
 */
export function getAudioManager() {
  return AudioManagerFactory.getAudioManager();
}
