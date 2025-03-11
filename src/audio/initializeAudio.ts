/**
 * Audio System Initialization
 * This file ensures that the audio system is properly initialized with Tone.js
 */

import { AudioManagerFactory } from "./AudioManagerFactory";
import { Logger } from "../utils/Logger";

/**
 * Initializes the audio system with Tone.js
 * Call this early in your application startup
 */
export async function initializeAudioSystem(): Promise<void> {
  const logger = Logger.getInstance();
  logger.info("Initializing audio system with Tone.js");

  // Get the audio manager (which will be the Tone.js implementation)
  const audioManager = AudioManagerFactory.getAudioManager();

  try {
    // Initialize the audio system
    await audioManager.initialize();
    logger.info("Audio system initialized successfully with Tone.js");

    return Promise.resolve();
  } catch (error) {
    logger.error("Failed to initialize audio system", error);
    return Promise.reject(error);
  }
}

/**
 * Gets the instance of the audio manager
 * This will always return the Tone.js implementation
 */
export function getAudioManager() {
  return AudioManagerFactory.getAudioManager();
}
