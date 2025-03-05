import { Game } from "./core/Game";
import { Logger } from "./utils/Logger";

// Initialize the logger
const logger = Logger.getInstance();

// Create a global reference to the game instance
declare global {
  interface Window {
    gameInstance: Game;
  }
}

// Initialize the game when the DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Create a canvas element for the game
  const canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  document.body.appendChild(canvas);

  // Check for dev mode flag in URL
  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.has("dev");
  const enableDevAudio = urlParams.has("enableDevAudio");

  // Log dev mode status
  if (devMode) {
    logger.info("DEV MODE ENABLED: Skipping intro, muting audio");

    if (enableDevAudio) {
      logger.info("DEV AUDIO ENABLED: Audio will be unmuted in dev mode");
    }
  }

  // Create the game with the canvas ID and store in global variable
  window.gameInstance = new Game("gameCanvas", devMode, enableDevAudio);

  // Initialize the game
  window.gameInstance.init().catch((error) => {
    logger.error("Failed to initialize game:", error);
  });

  // Export game instance for debugging
  (window as any).game = window.gameInstance;
});
