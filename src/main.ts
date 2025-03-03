import { Game } from "./core/Game";

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

  // Create the game with the canvas ID
  const game = new Game("gameCanvas");

  // Game initialization now happens through the loading screen
  // The init() and start() are called after the user clicks "execute program"
});
