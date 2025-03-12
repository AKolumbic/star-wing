// Activate ship debugger
// Copy and paste this code into your browser console to activate the ship debugger
// when experiencing issues with the ship entry animation

(function () {
  const game = window.starWingGame; // Access the global game instance

  if (!game) {
    console.error("Game instance not found. Make sure the game is running.");
    return;
  }

  if (typeof game.initDebugTools !== "function") {
    console.error(
      "Debug tools method not found. This version may not support debugging."
    );
    return;
  }

  console.log("Activating ship debugger...");
  game.initDebugTools();

  console.log("Ship debugger activated! Use the following shortcuts:");
  console.log("- Alt+V: Force ship visibility");
  console.log("- Alt+R: Reset ship position");
  console.log("- Alt+D: Show ship debug info");

  // Direct access to force ship visibility
  window.forceShipVisible = function () {
    const scene = game.getSceneSystem().getScene();
    scene.debugForceShipVisible();
    console.log("Forced ship visibility - ship should now be visible");
  };

  console.log("You can also call window.forceShipVisible() directly");
})();
