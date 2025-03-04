import { Game } from "./core/Game";

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

  // Check if dev mode is enabled via URL parameter (?dev=true)
  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.get("dev") === "true";

  if (devMode) {
    console.log("DEV MODE ENABLED: Skipping intro, muting audio");
  }

  // Create the game with the canvas ID and store in global variable
  window.gameInstance = new Game("gameCanvas", devMode);

  // Game initialization happens automatically:
  // - In normal mode: through the loading screen after user clicks "execute program"
  // - In dev mode: immediately, bypassing the loading screen
});
