import { Logger } from "../utils/Logger";
import { Game } from "../core/Game";

/**
 * Debug utility for diagnosing ship-related issues.
 * Adds keyboard shortcuts for common debug operations.
 */
export class ShipDebugger {
  private game: Game;
  private logger: Logger;
  private isActive: boolean = false;
  private keyHandler: (e: KeyboardEvent) => void;

  /**
   * Creates a new ShipDebugger instance.
   * @param game The Game instance
   */
  constructor(game: Game) {
    this.game = game;
    this.logger = Logger.getInstance();
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  /**
   * Activates the ship debugger.
   */
  activate(): void {
    if (this.isActive) return;

    this.logger.info("🐞 ShipDebugger: Activated");
    document.addEventListener("keydown", this.keyHandler);
    this.isActive = true;
  }

  /**
   * Deactivates the ship debugger.
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.logger.info("🐞 ShipDebugger: Deactivated");
    document.removeEventListener("keydown", this.keyHandler);
    this.isActive = false;
  }

  /**
   * Handles key down events for debug functions.
   * @param e KeyboardEvent
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Only handle keys when Alt is pressed (to avoid conflicts)
    if (!e.altKey) return;

    switch (e.key) {
      case "v": // Alt+V - Force ship visible
        this.forceShipVisible();
        break;
      case "r": // Alt+R - Reset ship
        this.resetShip();
        break;
      case "d": // Alt+D - Show ship debug info
        this.showShipDebugInfo();
        break;
    }
  }

  /**
   * Forces the ship to be visible.
   */
  private forceShipVisible(): void {
    this.logger.info("🐞 ShipDebugger: Forcing ship visible");
    const scene = this.game.getSceneSystem().getScene();
    scene.debugForceShipVisible();
  }

  /**
   * Resets the ship to initial state.
   */
  private resetShip(): void {
    this.logger.info("🐞 ShipDebugger: Resetting ship");
    const scene = this.game.getSceneSystem().getScene();
    const ship = scene.getPlayerShip();

    if (ship) {
      ship.resetPosition();
      this.logger.info("🐞 ShipDebugger: Ship reset to initial position");
    } else {
      this.logger.error("🐞 ShipDebugger: No ship available to reset");
    }
  }

  /**
   * Shows debug information about the ship.
   */
  private showShipDebugInfo(): void {
    const scene = this.game.getSceneSystem().getScene();
    const ship = scene.getPlayerShip();

    if (ship) {
      const position = ship.getPosition();
      this.logger.info("🐞 ShipDebugger: Ship debug info:");
      this.logger.info(
        `🐞 Position: ${position.x.toFixed(2)}, ${position.y.toFixed(
          2
        )}, ${position.z.toFixed(2)}`
      );
      this.logger.info(`🐞 In entry animation: ${ship.isInEntryAnimation()}`);
    } else {
      this.logger.error("🐞 ShipDebugger: No ship available for debug info");
    }
  }
}
