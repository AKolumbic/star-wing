import { Game } from "./core/Game";

// Initialize the game when the DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.add("visible");
  }

  // Create and start the game
  const game = new Game();
  game
    .init()
    .then(() => {
      if (loadingElement) {
        loadingElement.classList.remove("visible");
      }
      game.start();
    })
    .catch((error) => {
      console.error("Failed to initialize game:", error);
      if (loadingElement) {
        loadingElement.textContent =
          "Failed to load game. Please refresh the page.";
      }
    });
});
