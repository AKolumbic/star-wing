import { Game } from "../core/Game";
import { Scene } from "../core/Scene";

/**
 * GameHUD class for displaying in-game heads-up display elements.
 * Implements a minimalist retro-style HUD with health/shields, weapons, radar, and score.
 */
export class GameHUD {
  // DOM elements
  private container: HTMLDivElement;
  private healthBarContainer: HTMLDivElement;
  private healthBar: HTMLDivElement;
  private shieldBarContainer: HTMLDivElement;
  private shieldBar: HTMLDivElement;
  private weaponStatusContainer: HTMLDivElement;
  private radarContainer: HTMLDivElement;
  private radarCanvas: HTMLCanvasElement;
  private radarContext: CanvasRenderingContext2D | null;
  private infoContainer: HTMLDivElement;
  private warningContainer: HTMLDivElement;

  // Game references
  private game: Game;
  private isVisible: boolean = false;

  // Game state for HUD
  private currentHealth: number = 100;
  private maxHealth: number = 100;
  private currentShield: number = 100;
  private maxShield: number = 100;
  private currentScore: number = 0;
  private currentZone: number = 1;
  private currentWave: number = 1;
  private totalWaves: number = 8;
  private weaponCooldown: number = 0;
  private specialCooldown: number = 0;

  /**
   * Creates a new GameHUD instance.
   * @param game Reference to the Game instance for accessing game state
   */
  constructor(game: Game) {
    this.game = game;

    // Create main container
    this.container = document.createElement("div");
    this.container.className = "game-hud-container";

    // Create health bar
    this.healthBarContainer = document.createElement("div");
    this.healthBarContainer.className =
      "hud-bar-container health-bar-container";
    this.healthBar = document.createElement("div");
    this.healthBar.className = "hud-bar health-bar";
    this.healthBarContainer.appendChild(this.healthBar);

    // Create shield bar
    this.shieldBarContainer = document.createElement("div");
    this.shieldBarContainer.className =
      "hud-bar-container shield-bar-container";
    this.shieldBar = document.createElement("div");
    this.shieldBar.className = "hud-bar shield-bar";
    this.shieldBarContainer.appendChild(this.shieldBar);

    // Create weapon status
    this.weaponStatusContainer = document.createElement("div");
    this.weaponStatusContainer.className = "weapon-status-container";

    // Create radar
    this.radarContainer = document.createElement("div");
    this.radarContainer.className = "radar-container";
    this.radarCanvas = document.createElement("canvas");
    this.radarCanvas.width = 150;
    this.radarCanvas.height = 150;
    this.radarContext = this.radarCanvas.getContext("2d");
    this.radarContainer.appendChild(this.radarCanvas);

    // Create info container (score, zone/wave)
    this.infoContainer = document.createElement("div");
    this.infoContainer.className = "info-container";

    // Create warning container
    this.warningContainer = document.createElement("div");
    this.warningContainer.className = "warning-container";

    // Add all elements to container
    this.container.appendChild(this.healthBarContainer);
    this.container.appendChild(this.shieldBarContainer);
    this.container.appendChild(this.weaponStatusContainer);
    this.container.appendChild(this.radarContainer);
    this.container.appendChild(this.infoContainer);
    this.container.appendChild(this.warningContainer);

    // Add to document
    document.body.appendChild(this.container);

    // Initialize styles
    this.setupStyles();

    // Initially hide the HUD
    this.hide();
  }

  /**
   * Set up CSS styles for the HUD
   */
  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      /* Main HUD container */
      .game-hud-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        font-family: 'PressStart2P', monospace;
        color: #fff;
        text-shadow: 0 0 5px #0ff, 0 0 10px #0af;
        /* Add padding to account for terminal border */
        box-sizing: border-box;
        padding: 35px;
      }
      
      /* Health and shield bars */
      .hud-bar-container {
        position: absolute;
        left: 40px; /* Increased from 20px to account for terminal border */
        height: 15px;
        width: 200px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 2px solid #fff;
        box-shadow: 0 0 5px #0ff, inset 0 0 5px rgba(0, 0, 0, 0.8);
        overflow: hidden;
      }
      
      .health-bar-container {
        bottom: 70px; /* Increased from 50px to account for terminal border */
      }
      
      .shield-bar-container {
        bottom: 95px; /* Increased from 75px to account for terminal border */
      }
      
      .hud-bar {
        height: 100%;
        width: 100%;
        transform-origin: left;
      }
      
      .health-bar {
        background: linear-gradient(to right, #22ff22, #44ff44);
        box-shadow: 0 0 10px #0f0 inset;
      }
      
      .shield-bar {
        background: linear-gradient(to right, #2288ff, #44aaff);
        box-shadow: 0 0 10px #0af inset;
      }
      
      /* Weapon status */
      .weapon-status-container {
        position: absolute;
        right: 40px; /* Increased from 20px to account for terminal border */
        bottom: 40px; /* Increased from 20px to account for terminal border */
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px; /* Add spacing between weapon items */
      }
      
      .weapon-item {
        background-color: rgba(0, 0, 0, 0.5);
        border: 2px solid #fff;
        border-radius: 5px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 0 5px #0ff;
        min-width: 160px;
      }
      
      .weapon-label {
        font-size: 10px;
        color: #0ff;
        letter-spacing: 1px;
        font-weight: bold;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      
      .weapon-icon {
        width: 30px;
        height: 30px;
        border: 1px solid #0ff;
        margin-right: 5px;
        background-color: rgba(0, 150, 255, 0.3);
        /* Center the text */
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }
      
      .weapon-cooldown {
        width: 70px;
        height: 12px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #fff;
        position: relative;
        margin-left: 10px;
      }
      
      .cooldown-bar {
        height: 100%;
        background-color: #0ff;
        width: 100%;
        box-shadow: 0 0 5px #0ff;
      }
      
      /* Radar */
      .radar-container {
        position: absolute;
        right: 40px; /* Increased from 20px to account for terminal border */
        top: 40px; /* Increased from 20px to account for terminal border */
        width: 150px;
        height: 150px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 2px solid #fff;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 0 10px #0ff;
      }
      
      /* Info container */
      .info-container {
        position: absolute;
        top: 40px; /* Increased from 20px to account for terminal border */
        left: 40px; /* Increased from 20px to account for terminal border */
        background-color: rgba(0, 0, 0, 0.5);
        border: 2px solid #fff;
        padding: 5px 10px;
        font-size: 12px;
        box-shadow: 0 0 5px #0ff;
      }
      
      /* Warning container */
      .warning-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: #ff0022;
        text-shadow: 0 0 10px #f00;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .warning-visible {
        opacity: 1;
        animation: warning-pulse 1s infinite;
      }
      
      @keyframes warning-pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Updates HUD elements with current game state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(_deltaTime: number): void {
    if (!this.isVisible) return;

    // Get the scene from the game
    const scene = this.game.getSceneSystem().getScene();
    if (!scene) return;

    // Get player ship
    const playerShip = scene.getPlayerShip();
    if (!playerShip) return;

    // Update health and shield from player ship
    this.currentHealth = playerShip.getHealth();
    this.maxHealth = playerShip.getMaxHealth();
    this.currentShield = playerShip.getShield();
    this.maxShield = playerShip.getMaxShield();

    // Update score and wave info from scene
    this.currentScore = scene.getScore();
    this.currentZone = scene.getCurrentZone();
    this.currentWave = scene.getCurrentWave();
    this.totalWaves = scene.getTotalWaves();

    // Update weapon cooldowns
    // In a full implementation, these would come from the ship's weapon systems
    // For now, we'll just use sample values or could be updated from elsewhere

    // Update the HUD elements
    this.updateHealthBar();
    this.updateShieldBar();
    this.updateWeaponStatus();
    this.updateRadar(scene);
    this.updateInfo();
    this.updateWarnings();
  }

  /**
   * Update health bar display
   */
  private updateHealthBar(): void {
    const healthPercent = (this.currentHealth / this.maxHealth) * 100;
    this.healthBar.style.transform = `scaleX(${healthPercent / 100})`;

    // Add health value text
    this.healthBarContainer.setAttribute(
      "data-value",
      `HULL: ${this.currentHealth}/${this.maxHealth}`
    );

    // Change color based on health
    if (healthPercent < 25) {
      this.healthBar.style.backgroundColor = "#ff2222";
      this.healthBar.style.boxShadow = "0 0 10px #f00 inset";
    }
  }

  /**
   * Update shield bar display
   */
  private updateShieldBar(): void {
    const shieldPercent = (this.currentShield / this.maxShield) * 100;
    this.shieldBar.style.transform = `scaleX(${shieldPercent / 100})`;

    // Add shield value text
    this.shieldBarContainer.setAttribute(
      "data-value",
      `SHIELD: ${this.currentShield}/${this.maxShield}`
    );
  }

  /**
   * Update weapon status display (cooldowns)
   * @private
   */
  private updateWeaponStatus(): void {
    // Clear existing weapon displays
    this.weaponStatusContainer.innerHTML = "";

    // Create primary weapon display
    const primaryWeapon = document.createElement("div");
    primaryWeapon.className = "weapon-item";

    // Primary weapon label
    const primaryLabel = document.createElement("div");
    primaryLabel.className = "weapon-label";
    primaryLabel.textContent = "PRIMARY";

    const primaryCooldown = document.createElement("div");
    primaryCooldown.className = "weapon-cooldown";

    const primaryCooldownBar = document.createElement("div");
    primaryCooldownBar.className = "cooldown-bar";
    primaryCooldownBar.style.transform = `scaleX(${1 - this.weaponCooldown})`;

    primaryCooldown.appendChild(primaryCooldownBar);
    primaryWeapon.appendChild(primaryLabel);
    primaryWeapon.appendChild(primaryCooldown);

    // Create special weapon display
    const specialWeapon = document.createElement("div");
    specialWeapon.className = "weapon-item";

    // Special weapon label
    const specialLabel = document.createElement("div");
    specialLabel.className = "weapon-label";
    specialLabel.textContent = "SPECIAL";

    const specialCooldown = document.createElement("div");
    specialCooldown.className = "weapon-cooldown";

    const specialCooldownBar = document.createElement("div");
    specialCooldownBar.className = "cooldown-bar";
    specialCooldownBar.style.transform = `scaleX(${1 - this.specialCooldown})`;

    specialCooldown.appendChild(specialCooldownBar);
    specialWeapon.appendChild(specialLabel);
    specialWeapon.appendChild(specialCooldown);

    // Add to container
    this.weaponStatusContainer.appendChild(primaryWeapon);
    this.weaponStatusContainer.appendChild(specialWeapon);
  }

  /**
   * Update radar display
   * @param scene The current game scene
   */
  private updateRadar(scene: Scene): void {
    if (!this.radarContext) return;

    // Store radarContext in a local variable after the null check
    const ctx = this.radarContext;

    // Clear radar
    ctx.clearRect(0, 0, this.radarCanvas.width, this.radarCanvas.height);

    // Draw radar background
    ctx.fillStyle = "rgba(0, 30, 60, 0.7)";
    ctx.beginPath();
    ctx.arc(
      this.radarCanvas.width / 2,
      this.radarCanvas.height / 2,
      this.radarCanvas.width / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw radar rings
    ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
    ctx.lineWidth = 1;

    // Draw 3 concentric circles
    for (let i = 1; i <= 3; i++) {
      const radius = (this.radarCanvas.width / 2 - 2) * (i / 3);
      ctx.beginPath();
      ctx.arc(
        this.radarCanvas.width / 2,
        this.radarCanvas.height / 2,
        radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Draw radar cross
    ctx.beginPath();
    ctx.moveTo(this.radarCanvas.width / 2, 2);
    ctx.lineTo(this.radarCanvas.width / 2, this.radarCanvas.height - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, this.radarCanvas.height / 2);
    ctx.lineTo(this.radarCanvas.width - 2, this.radarCanvas.height / 2);
    ctx.stroke();

    // Get player position
    const playerShip = scene.getPlayerShip();
    if (!playerShip) return;

    const playerPosition = playerShip.getPosition();
    if (!playerPosition) return;

    // Draw player blip in the center
    ctx.fillStyle = "#0ff";
    ctx.beginPath();
    ctx.arc(
      this.radarCanvas.width / 2,
      this.radarCanvas.height / 2,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw enemy blips
    ctx.fillStyle = "#f55";

    // In a full implementation, we would iterate through actual enemies
    // For example: scene.getEnemies().forEach(enemy => {...})

    // Get the maximum radar range (arbitrary value representing how far the radar can "see")
    const radarRange = 1000;

    // For now, we'll simulate some enemies
    const simulatedEnemies = [
      {
        x: playerPosition.x + 300,
        y: playerPosition.y - 200,
        z: playerPosition.z - 300,
      },
      {
        x: playerPosition.x - 400,
        y: playerPosition.y + 100,
        z: playerPosition.z - 200,
      },
      {
        x: playerPosition.x + 100,
        y: playerPosition.y + 300,
        z: playerPosition.z + 100,
      },
    ].filter(
      () =>
        playerPosition.x !== undefined &&
        playerPosition.y !== undefined &&
        playerPosition.z !== undefined
    );

    // Draw each enemy blip
    simulatedEnemies.forEach((enemy) => {
      // Calculate relative position
      const relX = enemy.x - playerPosition.x;
      const relY = enemy.y - playerPosition.y;

      // Calculate distance (squared for performance)
      const distSquared = relX * relX + relY * relY;

      // Only show enemies within radar range
      if (distSquared <= radarRange * radarRange) {
        // Calculate radar coordinates (scale from world space to radar space)
        const radarX =
          this.radarCanvas.width / 2 +
          (relX / radarRange) * (this.radarCanvas.width / 2);
        const radarY =
          this.radarCanvas.height / 2 +
          (relY / radarRange) * (this.radarCanvas.height / 2);

        // Draw the blip
        ctx.beginPath();
        ctx.arc(radarX, radarY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Add radar sweep effect
    const now = Date.now();
    const angle = ((now % 2000) / 2000) * Math.PI * 2;

    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(this.radarCanvas.width / 2, this.radarCanvas.height / 2);
    ctx.arc(
      this.radarCanvas.width / 2,
      this.radarCanvas.height / 2,
      this.radarCanvas.width / 2 - 2,
      angle - 0.1,
      angle,
      false
    );
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Update score and wave info
   */
  private updateInfo(): void {
    this.infoContainer.innerHTML = `
      <div>SCORE: ${this.currentScore}</div>
      <div>ZONE ${this.currentZone} - WAVE ${this.currentWave}/${this.totalWaves}</div>
    `;
  }

  /**
   * Update warning messages
   */
  private updateWarnings(): void {
    // Check if health is low
    if (this.currentHealth < 25) {
      this.showWarning("LOW HULL INTEGRITY!");
    } else {
      this.hideWarning();
    }

    // Here we could also check for other warnings like incoming boss, etc.
  }

  /**
   * Show a warning message
   * @param message The warning message to display
   */
  showWarning(message: string): void {
    this.warningContainer.textContent = message;
    this.warningContainer.classList.add("warning-visible");
  }

  /**
   * Hide the warning message
   */
  hideWarning(): void {
    this.warningContainer.classList.remove("warning-visible");
  }

  /**
   * Set current health value
   * @param health Current health value
   * @param maxHealth Maximum health value
   */
  setHealth(health: number, maxHealth: number = this.maxHealth): void {
    this.currentHealth = health;
    this.maxHealth = maxHealth;
  }

  /**
   * Set current shield value
   * @param shield Current shield value
   * @param maxShield Maximum shield value
   */
  setShield(shield: number, maxShield: number = this.maxShield): void {
    this.currentShield = shield;
    this.maxShield = maxShield;
  }

  /**
   * Set current score
   * @param score Current score
   */
  setScore(score: number): void {
    this.currentScore = score;
  }

  /**
   * Set current zone and wave info
   * @param zone Current zone number
   * @param wave Current wave number
   * @param totalWaves Total waves in the zone
   */
  setZoneInfo(zone: number, wave: number, totalWaves: number): void {
    this.currentZone = zone;
    this.currentWave = wave;
    this.totalWaves = totalWaves;
  }

  /**
   * Set weapon cooldown values
   * @param primary Primary weapon cooldown (0-1)
   * @param special Special weapon cooldown (0-1)
   */
  setWeaponCooldowns(primary: number, special: number): void {
    this.weaponCooldown = Math.max(0, Math.min(1, primary));
    this.specialCooldown = Math.max(0, Math.min(1, special));
  }

  /**
   * Show the HUD
   */
  show(): void {
    this.container.style.display = "block";
    this.isVisible = true;
  }

  /**
   * Hide the HUD
   */
  hide(): void {
    this.container.style.display = "none";
    this.isVisible = false;
  }

  /**
   * Clean up HUD resources
   */
  dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
