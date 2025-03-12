/**
 * Audio System Initialization
 * This file ensures that the audio system is properly initialized with Tone.js
 */

import { AudioManagerFactory } from "./AudioManagerFactory";
import { Logger } from "../utils/Logger";

/**
 * Initializes the audio system for the game.
 */
export async function initializeAudioSystem(): Promise<void> {
  const logger = Logger.getInstance();
  const audioManager = AudioManagerFactory.getAudioManager();

  try {
    // Initialize audio - this now includes preloading essential audio internally
    await audioManager.initialize();

    // No need to call preloadEssentialAudio separately - it's handled in initialize()

    logger.info("Audio system initialized successfully with Tone.js");
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
