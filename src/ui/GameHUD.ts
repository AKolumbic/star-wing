import { Game } from "../core/Game";
import { Scene } from "../core/Scene";
import { Logger } from "../utils/Logger";

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
  private combatLogContainer: HTMLDivElement;

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

  // Combat log messages
  private combatLogMessages: Array<{ message: string; timestamp: number }> = [];
  private readonly COMBAT_LOG_DISPLAY_TIME = 3000; // milliseconds

  private logger = Logger.getInstance();

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

    // Create combat log container
    this.combatLogContainer = document.createElement("div");
    this.combatLogContainer.className = "combat-log-container";

    // Create warning container
    this.warningContainer = document.createElement("div");
    this.warningContainer.className = "warning-container";

    // Add all elements to container
    this.container.appendChild(this.healthBarContainer);
    this.container.appendChild(this.shieldBarContainer);
    this.container.appendChild(this.weaponStatusContainer);
    this.container.appendChild(this.radarContainer);
    this.container.appendChild(this.infoContainer);
    this.container.appendChild(this.combatLogContainer);
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
      
      /* Combat Log container */
      .combat-log-container {
        position: absolute;
        top: 115px; /* Positioned below info container */
        left: 40px;
        width: 250px;
        min-height: 20px;
        max-height: 150px;
        overflow-y: hidden;
        font-size: 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .combat-log-message {
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #fff;
        padding: 4px 8px;
        border-radius: 3px;
        box-shadow: 0 0 5px #0ff;
        opacity: 1;
        transition: opacity 0.5s ease-out;
        animation: slide-in 0.3s ease-out;
      }
      
      .combat-log-message.fading {
        opacity: 0;
      }
      
      .combat-log-message.asteroid-destroyed {
        color: #ffcc00;
        text-shadow: 0 0 5px #ffa500;
      }
      
      .combat-log-message.damage-taken {
        color: #ff3333;
        text-shadow: 0 0 5px #ff0000;
        font-weight: bold;
      }
      
      .combat-log-message.zone-cleared {
        color: #33ff33;
        text-shadow: 0 0 10px #00ff00;
        font-size: 12px;
        font-weight: bold;
      }
      
      @keyframes slide-in {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
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
  update(deltaTime: number): void {
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
    this.updateCombatLog();
    this.updateWarnings();

    // Check for zone completion
    this.checkZoneCompletion(scene);
  }

  /**
   * Check if zone has been completed
   */
  private checkZoneCompletion(scene: Scene): void {
    if (this.currentScore >= 500 && scene.getCurrentZone() === 1) {
      // Zone 1 completed
      this.addCombatLogMessage(
        "ZONE 1 CLEARED! WELL DONE, PILOT!",
        "zone-cleared"
      );

      // Progress to next zone (handled by Scene)
      scene.completeCurrentZone();
    }
  }

  /**
   * Updates the combat log display
   */
  private updateCombatLog(): void {
    const currentTime = Date.now();
    let messagesRemoved = false;

    // Remove expired messages
    this.combatLogMessages = this.combatLogMessages.filter((msg) => {
      const age = currentTime - msg.timestamp;

      // If message is expiring soon, add the fading class
      if (age > this.COMBAT_LOG_DISPLAY_TIME - 500) {
        // Find the message element and add fading
        const selector = `[data-timestamp="${msg.timestamp}"]`;
        const element = document.querySelector(selector);
        if (element) {
          // Apply fading directly to the element
          element.classList.add("fading");
          (element as HTMLElement).style.opacity = "0";
        }
      }

      const shouldKeep = age < this.COMBAT_LOG_DISPLAY_TIME;
      if (!shouldKeep) {
        messagesRemoved = true;
      }
      return shouldKeep;
    });

    // Only re-render if messages were removed
    if (messagesRemoved) {
      this.renderCombatLog();
    }
  }

  /**
   * Renders the combat log messages to the DOM
   */
  private renderCombatLog(): void {
    // Only log when there are messages and not on every update
    if (this.combatLogMessages.length > 0) {
      console.log(
        `Combat log: ${this.combatLogMessages.length} messages to render`
      );
    }

    // Check if container exists
    if (!this.combatLogContainer) {
      console.error("Combat log container is undefined!");
      return;
    }

    // Ensure the container has the right styles
    this.combatLogContainer.style.position = "absolute";
    this.combatLogContainer.style.top = "115px";
    this.combatLogContainer.style.left = "40px";
    this.combatLogContainer.style.width = "250px";
    this.combatLogContainer.style.minHeight = "20px";
    this.combatLogContainer.style.maxHeight = "150px";
    this.combatLogContainer.style.overflow = "hidden";
    this.combatLogContainer.style.fontSize = "10px";
    this.combatLogContainer.style.display = "flex";
    this.combatLogContainer.style.flexDirection = "column";
    this.combatLogContainer.style.gap = "5px";
    this.combatLogContainer.style.zIndex = "1001"; // Ensure it's above other elements

    // Clear the current container
    this.combatLogContainer.innerHTML = "";

    // Add each message
    this.combatLogMessages.forEach((msg) => {
      const messageElement = document.createElement("div");
      messageElement.className = "combat-log-message";

      // Add explicit styling to each message element
      messageElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      messageElement.style.border = "1px solid #fff";
      messageElement.style.padding = "4px 8px";
      messageElement.style.borderRadius = "3px";
      messageElement.style.boxShadow = "0 0 5px #0ff";
      messageElement.style.opacity = "1";
      messageElement.style.transition = "opacity 0.5s ease-out";
      messageElement.style.animation = "slide-in 0.3s ease-out";

      if (msg.message.includes('class="')) {
        // If the message already has HTML, use it directly
        messageElement.innerHTML = msg.message;
      } else {
        messageElement.textContent = msg.message;

        // Add styling based on message content
        if (msg.message.includes("ASTEROID DESTROYED")) {
          messageElement.style.color = "#ffcc00";
          messageElement.style.textShadow = "0 0 5px #ffa500";
        } else if (msg.message.includes("DAMAGE")) {
          messageElement.style.color = "#ff3333";
          messageElement.style.textShadow = "0 0 5px #ff0000";
          messageElement.style.fontWeight = "bold";
        } else if (
          msg.message.includes("ZONE") &&
          msg.message.includes("CLEARED")
        ) {
          messageElement.style.color = "#33ff33";
          messageElement.style.textShadow = "0 0 10px #00ff00";
          messageElement.style.fontSize = "12px";
          messageElement.style.fontWeight = "bold";
        }
      }

      // Add data attribute for timestamp to help with finding elements
      messageElement.dataset.timestamp = msg.timestamp.toString();

      this.combatLogContainer.appendChild(messageElement);
    });
  }

  /**
   * Adds a new message to the combat log
   * @param message The message to display
   * @param className Optional CSS class to apply to the message
   */
  addCombatLogMessage(message: string, className?: string): void {
    // Log only if this is a new type of message (reduce console spam)
    if (
      !this.combatLogMessages.some((m) =>
        m.message.includes(message.substring(0, 10))
      )
    ) {
      console.log(
        `Combat log: Added "${message.substring(0, 30)}${
          message.length > 30 ? "..." : ""
        }"`
      );
    }

    // Create the message object
    const msgObj = {
      message: message,
      timestamp: Date.now(),
    };

    // If a class was specified, wrap in a span with the class
    if (className) {
      const messageElement = document.createElement("div");
      messageElement.className = `combat-log-message ${className}`;
      messageElement.textContent = message;

      // Store as HTML string
      msgObj.message = messageElement.outerHTML;
    }

    // Add to the beginning so newest messages are at the top
    this.combatLogMessages.unshift(msgObj);

    // Limit to maximum 5 messages at once
    if (this.combatLogMessages.length > 5) {
      this.combatLogMessages.pop();
    }

    // Update the display immediately
    this.renderCombatLog();
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

    // Add to container
    this.weaponStatusContainer.appendChild(primaryWeapon);

    /* Secondary weapon temporarily disabled until fully implemented
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
    this.weaponStatusContainer.appendChild(specialWeapon);
    */
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

    const radarWidth = this.radarCanvas.width;
    const radarHeight = this.radarCanvas.height;
    const radarCenterX = radarWidth / 2;
    const radarCenterY = radarHeight / 2;
    const radarRadius = radarWidth / 2 - 2;

    // Draw radar background
    ctx.fillStyle = "rgba(0, 30, 60, 0.7)";
    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw radar rings
    ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
    ctx.lineWidth = 1;

    // Draw 3 concentric circles
    for (let i = 1; i <= 3; i++) {
      const radius = radarRadius * (i / 3);
      ctx.beginPath();
      ctx.arc(radarCenterX, radarCenterY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw cardinal directions on radar using arrows instead of letters
    ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Forward direction (bottom of radar) - down arrow
    ctx.fillText("↓", radarCenterX, radarCenterY + radarRadius * 0.85);
    // Backward direction (top of radar) - up arrow
    ctx.fillText("↑", radarCenterX, radarCenterY - radarRadius * 0.85);
    // Right direction - right arrow
    ctx.fillText("→", radarCenterX + radarRadius * 0.85, radarCenterY);
    // Left direction - left arrow
    ctx.fillText("←", radarCenterX - radarRadius * 0.85, radarCenterY);

    // Draw radar cross
    ctx.beginPath();
    ctx.moveTo(radarCenterX, 2);
    ctx.lineTo(radarCenterX, radarHeight - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, radarCenterY);
    ctx.lineTo(radarWidth - 2, radarCenterY);
    ctx.stroke();

    // Get player position
    const playerShip = scene.getPlayerShip();
    if (!playerShip) return;

    const playerPosition = playerShip.getPosition();
    if (!playerPosition) return;

    // Draw player blip in the center with a directional indicator
    ctx.fillStyle = "#0ff"; // Cyan for player
    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw a small indicator showing the player's facing direction
    // Draw a triangle pointing in the direction of travel (from top-down view)
    ctx.beginPath();
    // Flip the triangle to point downward (toward "F" at the bottom)
    ctx.moveTo(radarCenterX, radarCenterY + 5); // Point facing "forward" on the radar (now down)
    ctx.lineTo(radarCenterX - 3, radarCenterY - 2);
    ctx.lineTo(radarCenterX + 3, radarCenterY - 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
    ctx.fill();

    // Get the maximum radar range (arbitrary value representing how far the radar can "see")
    const radarRange = 2000; // Detection range in game units

    // Get actual asteroids from scene
    const asteroids = scene.getAsteroids();

    // Draw asteroid blips
    if (asteroids && asteroids.length > 0) {
      ctx.fillStyle = "#f55"; // Red for asteroids

      asteroids.forEach((asteroid) => {
        if (!asteroid.isActive()) return;

        const asteroidPosition = asteroid.getPosition();

        // Calculate relative position to player using X and Z for top-down view
        // X remains the same (left-right)
        // Z is used for forward-backward (negative Z is forward, positive Z is backward)
        const relX = asteroidPosition.x - playerPosition.x;
        const relZ = asteroidPosition.z - playerPosition.z;

        // Calculate distance using top-down coordinates
        const distance = Math.sqrt(relX * relX + relZ * relZ);

        // Only show asteroids within radar range
        if (distance <= radarRange) {
          // Scale distance to radar size
          // Map X to radar X (left-right)
          // Map Z to radar Y (up-down) - FLIPPED: Positive Z is up, Negative Z is down
          const radarX = radarCenterX + (relX / radarRange) * radarRadius;
          const radarY = radarCenterY + (relZ / radarRange) * radarRadius; // Now positive Z maps upward on the radar

          // Size based on asteroid size and distance (closer = bigger blip)
          const size = asteroid.getSize();
          const blipSize = Math.max(2, Math.min(4, (size / 40) * 4));

          // Draw the blip with dynamic size and alpha based on distance
          const alpha = 1 - (distance / radarRange) * 0.7; // Fade with distance
          ctx.fillStyle = `rgba(255, 85, 85, ${alpha})`;

          ctx.beginPath();
          ctx.arc(radarX, radarY, blipSize, 0, Math.PI * 2);
          ctx.fill();

          // Add a pulsing effect to closer asteroids
          if (distance < radarRange * 0.3) {
            const pulseSize = blipSize + Math.sin(Date.now() / 200) * 2;
            ctx.strokeStyle = `rgba(255, 85, 85, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(radarX, radarY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Add height indicator for asteroids significantly above or below player
          const heightDiff = asteroidPosition.y - playerPosition.y;
          if (Math.abs(heightDiff) > 200) {
            // If asteroid is significantly above/below player
            ctx.fillStyle =
              heightDiff > 0
                ? `rgba(85, 255, 255, ${alpha})` // Cyan for above
                : `rgba(255, 255, 85, ${alpha})`; // Yellow for below

            // Small triangle indicator
            ctx.beginPath();
            if (heightDiff > 0) {
              // Pointing up for asteroids above
              ctx.moveTo(radarX, radarY - blipSize - 3);
              ctx.lineTo(radarX - 2, radarY - blipSize);
              ctx.lineTo(radarX + 2, radarY - blipSize);
            } else {
              // Pointing down for asteroids below
              ctx.moveTo(radarX, radarY + blipSize + 3);
              ctx.lineTo(radarX - 2, radarY + blipSize);
              ctx.lineTo(radarX + 2, radarY + blipSize);
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      });
    }

    // Add radar sweep effect
    const now = Date.now();
    const angle = ((now % 2000) / 2000) * Math.PI * 2;

    // Create radial gradient for sweep
    const gradient = ctx.createRadialGradient(
      radarCenterX,
      radarCenterY,
      0,
      radarCenterX,
      radarCenterY,
      radarRadius
    );
    gradient.addColorStop(0, "rgba(0, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(0, 255, 255, 0.4)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.arc(
      radarCenterX,
      radarCenterY,
      radarRadius,
      angle - 0.2, // Wider sweep
      angle,
      false
    );
    ctx.closePath();
    ctx.fill();

    // Add subtle glow around the radar
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
    ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, radarRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * Update score and zone info
   */
  private updateInfo(): void {
    this.infoContainer.innerHTML = `
      <div>SCORE: ${this.currentScore}</div>
      <div>ZONE ${this.currentZone}</div>
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
    console.log("GameHUD: Showing HUD");
    this.container.style.display = "block";
    this.isVisible = true;

    // Make sure combat log is visible
    if (this.combatLogContainer) {
      this.combatLogContainer.style.display = "flex";

      // Add animation styles directly to ensure they're defined
      const animStyle = document.createElement("style");
      animStyle.textContent = `
        @keyframes slide-in {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(animStyle);

      // Add a test message to verify the combat log is working
      this.addCombatLogMessage("SYSTEMS ONLINE", "system-message");
    }
  }

  /**
   * Hide the HUD
   */
  hide(): void {
    this.logger.debug("[GameHUD] hide() called");
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
