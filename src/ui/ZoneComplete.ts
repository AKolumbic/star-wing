import { Game } from "../core/Game";
import { RunState } from "../core/RunState";
import { UpgradeDefinition, UpgradeCategory } from "../core/UpgradeDefinitions";
import { Ship } from "../entities/Ship";
import { WeaponSystem } from "../weapons/WeaponSystem";
import { Logger } from "../utils/Logger";

/**
 * Upgrade selection screen displayed when the player completes a zone.
 * Presents 3 (or 4) random upgrade choices from the upgrade pool.
 * The player selects one upgrade which is applied immediately.
 */
export class ZoneComplete {
  /** Container element for the entire screen */
  private container: HTMLDivElement;

  /** Flag to track visibility */
  private isVisible: boolean = false;

  /** Game instance reference */
  private game: Game;

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Callback fired after the player selects an upgrade */
  private onCompleteCallback: (() => void) | null = null;

  /** Current run state */
  private runState: RunState | null = null;

  /** Player's ship reference */
  private ship: Ship | null = null;

  /** Weapon system reference */
  private weaponSystem: WeaponSystem | null = null;

  /** The zone number that was just completed */
  private completedZone: number = 1;

  /** Next zone ID (or null if final zone) */
  private nextZoneId: number | null = null;

  /** Style element for animations */
  private styleElement: HTMLStyleElement;

  /** Bound keyboard handler for cleanup */
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.styleElement = document.createElement("style");
    this.setupStyles();
    this.setupAnimationStyles();
    document.body.appendChild(this.container);
  }

  private setupStyles(): void {
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.display = "none";
    this.container.style.flexDirection = "column";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    this.container.style.backgroundColor = "rgba(0, 10, 30, 0.9)";
    this.container.style.color = "#00ffff";
    this.container.style.fontFamily = "monospace, 'Courier New', Courier";
    this.container.style.zIndex = "9999";
    this.container.style.opacity = "0";
    this.container.style.transition = "opacity 0.8s ease-in";
    this.container.style.backdropFilter = "blur(5px)";
  }

  private setupAnimationStyles(): void {
    this.styleElement.textContent = `
      @keyframes pulsate {
        0% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.7; transform: scale(1); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes cardSlideIn {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes glowPulse {
        0% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.3); }
        50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); }
        100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.3); }
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Shows the upgrade selection screen.
   * @param runState The current run state
   * @param ship The player's ship
   * @param weaponSystem The weapon system
   * @param completedZone The zone number that was just completed
   * @param nextZoneId The next zone ID (or null if final zone)
   * @param onComplete Callback fired after the player selects an upgrade
   */
  show(
    runState: RunState,
    ship: Ship,
    weaponSystem: WeaponSystem,
    completedZone: number,
    nextZoneId: number | null,
    onComplete: () => void
  ): void {
    if (this.isVisible) return;

    this.logger.info(`Showing upgrade selection for Zone ${completedZone}`);
    this.isVisible = true;
    this.runState = runState;
    this.ship = ship;
    this.weaponSystem = weaponSystem;
    this.completedZone = completedZone;
    this.nextZoneId = nextZoneId;
    this.onCompleteCallback = onComplete;

    // Build the UI content
    this.buildContent();

    this.container.style.display = "flex";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.container.style.opacity = "1";
      });
    });
  }

  /**
   * Hides the upgrade selection screen.
   */
  hide(): void {
    if (!this.isVisible) return;

    this.logger.info("Hiding upgrade selection screen");
    this.isVisible = false;
    this.container.style.opacity = "0";

    // Remove keyboard handler
    if (this.boundKeyHandler) {
      document.removeEventListener("keydown", this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    setTimeout(() => {
      this.container.style.display = "none";
      // Clear content for next show
      this.container.innerHTML = "";
    }, 800);
  }

  dispose(): void {
    this.logger.info("Disposing upgrade selection screen");
    if (this.boundKeyHandler) {
      document.removeEventListener("keydown", this.boundKeyHandler);
    }
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    if (this.styleElement && this.styleElement.parentElement) {
      this.styleElement.parentElement.removeChild(this.styleElement);
    }
  }

  /**
   * Builds the full upgrade selection UI content.
   */
  private buildContent(): void {
    this.container.innerHTML = "";

    if (!this.runState) return;

    // Title
    const title = this.createTitle();
    this.container.appendChild(title);

    // Status bar (score, hull, shield)
    const status = this.createStatusBar();
    this.container.appendChild(status);

    // Check if this is the final zone
    if (this.nextZoneId === null) {
      this.buildVictoryContent();
      return;
    }

    // Instruction text
    const instruction = document.createElement("div");
    instruction.textContent = "DOCKING AT CARRIER... SELECT TECH ENHANCEMENT";
    instruction.style.fontSize = "1.1rem";
    instruction.style.margin = "0 0 2rem 0";
    instruction.style.opacity = "0.8";
    instruction.style.letterSpacing = "2px";
    this.container.appendChild(instruction);

    // Generate upgrade choices
    const choices = this.runState.generateUpgradeChoices(this.completedZone);

    if (choices.length === 0) {
      // No upgrades available (all maxed out)
      const noUpgrades = document.createElement("div");
      noUpgrades.textContent = "ALL SYSTEMS FULLY UPGRADED";
      noUpgrades.style.fontSize = "1.5rem";
      noUpgrades.style.margin = "2rem 0";
      noUpgrades.style.color = "#00ff88";
      this.container.appendChild(noUpgrades);

      const continueBtn = this.createButton("CONTINUE", () =>
        this.handleContinue()
      );
      continueBtn.style.marginTop = "2rem";
      this.container.appendChild(continueBtn);
      return;
    }

    // Cards container
    const cardsContainer = document.createElement("div");
    cardsContainer.style.display = "flex";
    cardsContainer.style.gap = "1.5rem";
    cardsContainer.style.justifyContent = "center";
    cardsContainer.style.flexWrap = "wrap";
    cardsContainer.style.maxWidth = "900px";

    // Set up keyboard handler
    this.boundKeyHandler = (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= choices.length && this.isVisible) {
        this.handleUpgradeSelect(choices[keyNum - 1]);
      }
    };
    document.addEventListener("keydown", this.boundKeyHandler);

    choices.forEach((upgrade, index) => {
      const card = this.createUpgradeCard(upgrade, index);
      cardsContainer.appendChild(card);
    });

    this.container.appendChild(cardsContainer);

    // Reroll button (if available)
    if (this.runState.canReroll()) {
      const rerollContainer = document.createElement("div");
      rerollContainer.style.marginTop = "1.5rem";

      const rerollBtn = this.createButton("REROLL CHOICES", () =>
        this.handleReroll()
      );
      rerollBtn.style.backgroundColor = "rgba(80, 60, 0, 0.7)";
      rerollBtn.style.borderColor = "#ffaa00";
      rerollBtn.style.color = "#ffdd44";
      rerollContainer.appendChild(rerollBtn);
      this.container.appendChild(rerollContainer);
    }

    // Main menu button at bottom
    const menuContainer = document.createElement("div");
    menuContainer.style.marginTop = "2rem";
    const menuBtn = this.createButton("RETURN TO MAIN MENU", () =>
      this.handleMainMenu()
    );
    menuBtn.style.opacity = "0.7";
    menuBtn.style.fontSize = "0.9rem";
    menuBtn.style.padding = "0.5rem 1.5rem";
    menuContainer.appendChild(menuBtn);
    this.container.appendChild(menuContainer);
  }

  /**
   * Builds victory content for completing all zones.
   */
  private buildVictoryContent(): void {
    const victoryTitle = document.createElement("div");
    victoryTitle.textContent = "MISSION COMPLETE";
    victoryTitle.style.fontSize = "2.5rem";
    victoryTitle.style.color = "#00ff88";
    victoryTitle.style.textShadow = "0 0 15px rgba(0, 255, 136, 0.7)";
    victoryTitle.style.margin = "1rem 0";
    this.container.appendChild(victoryTitle);

    const victoryMsg = document.createElement("div");
    victoryMsg.textContent = "ALL SECTORS SECURED";
    victoryMsg.style.fontSize = "1.2rem";
    victoryMsg.style.margin = "0 0 2rem 0";
    victoryMsg.style.opacity = "0.8";
    this.container.appendChild(victoryMsg);

    // Show collected upgrades
    if (this.runState) {
      const upgrades = this.runState.getCollectedUpgrades();
      if (upgrades.length > 0) {
        const upgradesList = document.createElement("div");
        upgradesList.style.margin = "1rem 0 2rem 0";
        upgradesList.style.padding = "1rem";
        upgradesList.style.backgroundColor = "rgba(0, 40, 40, 0.5)";
        upgradesList.style.borderRadius = "4px";
        upgradesList.style.maxWidth = "600px";

        const upgradesTitle = document.createElement("div");
        upgradesTitle.textContent = `ENHANCEMENTS COLLECTED: ${upgrades.length}`;
        upgradesTitle.style.marginBottom = "0.5rem";
        upgradesTitle.style.fontSize = "0.9rem";
        upgradesList.appendChild(upgradesTitle);

        const upgradeNames = upgrades.map((u) => u.name).join(", ");
        const upgradesText = document.createElement("div");
        upgradesText.textContent = upgradeNames;
        upgradesText.style.fontSize = "0.8rem";
        upgradesText.style.opacity = "0.7";
        upgradesText.style.lineHeight = "1.4";
        upgradesList.appendChild(upgradesText);

        this.container.appendChild(upgradesList);
      }
    }

    const menuBtn = this.createButton("RETURN TO MAIN MENU", () =>
      this.handleMainMenu()
    );
    this.container.appendChild(menuBtn);
  }

  private createTitle(): HTMLHeadingElement {
    const title = document.createElement("h1");
    title.textContent = `ZONE ${this.completedZone} CLEARED`;
    title.style.fontSize = "3.5rem";
    title.style.textAlign = "center";
    title.style.margin = "0 0 1rem 0";
    title.style.fontWeight = "bold";
    title.style.textShadow = "0 0 10px rgba(0, 255, 255, 0.7)";
    title.style.animation = "pulsate 2s infinite";
    title.style.letterSpacing = "4px";
    return title;
  }

  private createStatusBar(): HTMLDivElement {
    const status = document.createElement("div");
    status.style.display = "flex";
    status.style.gap = "2rem";
    status.style.margin = "0 0 1.5rem 0";
    status.style.fontSize = "0.9rem";
    status.style.opacity = "0.7";

    const score = this.game.getSceneSystem().getScene().getScore();
    const health = this.ship ? this.ship.getHealth() : 100;
    const maxHealth = this.ship ? this.ship.getMaxHealth() : 100;
    const shield = this.ship ? this.ship.getShield() : 100;
    const maxShield = this.ship ? this.ship.getMaxShield() : 100;

    status.innerHTML = `
      <span>SCORE: ${score}</span>
      <span style="color: #44ff44">HULL: ${Math.floor(health)}/${maxHealth}</span>
      <span style="color: #4488ff">SHIELD: ${Math.floor(shield)}/${maxShield}</span>
    `;
    return status;
  }

  /**
   * Creates a single upgrade card element.
   */
  private createUpgradeCard(
    upgrade: UpgradeDefinition,
    index: number
  ): HTMLDivElement {
    const card = document.createElement("div");
    card.style.width = "220px";
    card.style.padding = "1.5rem";
    card.style.backgroundColor = "rgba(0, 20, 40, 0.9)";
    card.style.border = "2px solid #00ffff";
    card.style.borderRadius = "8px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.gap = "0.75rem";
    card.style.cursor = "pointer";
    card.style.transition = "all 0.3s ease";
    card.style.animation = `cardSlideIn 0.5s ease-out ${index * 0.15}s both`;
    card.style.position = "relative";

    // Category-specific border color
    const categoryColor = this.getCategoryColor(upgrade.category);
    card.style.borderColor = categoryColor;

    // Icon
    const icon = document.createElement("div");
    icon.textContent = upgrade.icon;
    icon.style.fontSize = "2rem";
    icon.style.fontWeight = "bold";
    icon.style.color = categoryColor;
    icon.style.textShadow = `0 0 10px ${categoryColor}`;
    icon.style.marginBottom = "0.25rem";
    card.appendChild(icon);

    // Name
    const name = document.createElement("div");
    name.textContent = upgrade.name;
    name.style.fontSize = "1rem";
    name.style.fontWeight = "bold";
    name.style.color = "#ffffff";
    name.style.textAlign = "center";
    name.style.lineHeight = "1.2";
    card.appendChild(name);

    // Category tag
    const categoryTag = document.createElement("div");
    categoryTag.textContent = upgrade.category.toUpperCase();
    categoryTag.style.fontSize = "0.7rem";
    categoryTag.style.padding = "0.15rem 0.5rem";
    categoryTag.style.backgroundColor = `${categoryColor}33`;
    categoryTag.style.border = `1px solid ${categoryColor}`;
    categoryTag.style.borderRadius = "3px";
    categoryTag.style.color = categoryColor;
    categoryTag.style.letterSpacing = "1px";
    card.appendChild(categoryTag);

    // Description
    const desc = document.createElement("div");
    desc.textContent = upgrade.description;
    desc.style.fontSize = "0.8rem";
    desc.style.color = "#aaccdd";
    desc.style.textAlign = "center";
    desc.style.lineHeight = "1.3";
    desc.style.flexGrow = "1";
    desc.style.display = "flex";
    desc.style.alignItems = "center";
    card.appendChild(desc);

    // Rarity indicator
    if (upgrade.rarity !== "common") {
      const rarityTag = document.createElement("div");
      rarityTag.textContent = upgrade.rarity === "rare" ? "RARE" : "UNCOMMON";
      rarityTag.style.fontSize = "0.65rem";
      rarityTag.style.color = upgrade.rarity === "rare" ? "#ffaa00" : "#88ddff";
      rarityTag.style.letterSpacing = "2px";
      rarityTag.style.marginBottom = "0.25rem";
      card.appendChild(rarityTag);
    }

    // Select button
    const selectBtn = document.createElement("button");
    selectBtn.textContent = `[${index + 1}] SELECT`;
    selectBtn.style.backgroundColor = `${categoryColor}22`;
    selectBtn.style.color = "#ffffff";
    selectBtn.style.border = `1px solid ${categoryColor}`;
    selectBtn.style.borderRadius = "4px";
    selectBtn.style.padding = "0.5rem 1.5rem";
    selectBtn.style.fontSize = "0.85rem";
    selectBtn.style.fontFamily = "monospace, 'Courier New', Courier";
    selectBtn.style.cursor = "pointer";
    selectBtn.style.transition = "all 0.2s ease";
    selectBtn.style.width = "100%";
    selectBtn.style.outline = "none";
    card.appendChild(selectBtn);

    // Hover effects
    card.addEventListener("mouseover", () => {
      card.style.transform = "translateY(-5px) scale(1.03)";
      card.style.boxShadow = `0 0 25px ${categoryColor}66`;
      card.style.borderColor = "#ffffff";
      selectBtn.style.backgroundColor = `${categoryColor}44`;
    });

    card.addEventListener("mouseout", () => {
      card.style.transform = "translateY(0) scale(1)";
      card.style.boxShadow = "none";
      card.style.borderColor = categoryColor;
      selectBtn.style.backgroundColor = `${categoryColor}22`;
    });

    // Click handler
    card.addEventListener("click", () => this.handleUpgradeSelect(upgrade));

    return card;
  }

  /**
   * Returns a color for each upgrade category.
   */
  private getCategoryColor(category: UpgradeCategory): string {
    switch (category) {
      case "weapon":
        return "#ff4444";
      case "defense":
        return "#44ff44";
      case "special":
        return "#aa44ff";
      case "economy":
        return "#ffaa00";
    }
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.backgroundColor = "rgba(0, 80, 80, 0.7)";
    button.style.color = "#ffffff";
    button.style.border = "2px solid #00ffff";
    button.style.borderRadius = "4px";
    button.style.padding = "0.8rem 2rem";
    button.style.fontSize = "1rem";
    button.style.fontFamily = "monospace, 'Courier New', Courier";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s ease";
    button.style.outline = "none";

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "rgba(0, 120, 120, 0.8)";
      button.style.transform = "scale(1.05)";
      button.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
    });

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "rgba(0, 80, 80, 0.7)";
      button.style.transform = "scale(1)";
      button.style.boxShadow = "none";
    });

    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * Handles the player selecting an upgrade.
   */
  private handleUpgradeSelect(upgrade: UpgradeDefinition): void {
    if (!this.runState || !this.ship || !this.weaponSystem) return;

    this.logger.info(`Player selected upgrade: ${upgrade.name}`);

    // Apply the upgrade
    this.runState.addUpgrade(upgrade, this.ship, this.weaponSystem);

    // Show brief confirmation
    this.showConfirmation(upgrade);
  }

  /**
   * Shows a brief confirmation animation, then continues.
   */
  private showConfirmation(upgrade: UpgradeDefinition): void {
    // Remove keyboard handler during confirmation
    if (this.boundKeyHandler) {
      document.removeEventListener("keydown", this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    this.container.innerHTML = "";

    const confirmation = document.createElement("div");
    confirmation.style.display = "flex";
    confirmation.style.flexDirection = "column";
    confirmation.style.alignItems = "center";
    confirmation.style.gap = "1rem";

    const installedText = document.createElement("div");
    installedText.textContent = "ENHANCEMENT INSTALLED";
    installedText.style.fontSize = "1.5rem";
    installedText.style.color = "#00ff88";
    installedText.style.letterSpacing = "3px";
    installedText.style.textShadow = "0 0 10px rgba(0, 255, 136, 0.7)";

    const upgradeName = document.createElement("div");
    upgradeName.textContent = upgrade.name.toUpperCase();
    upgradeName.style.fontSize = "2.5rem";
    upgradeName.style.fontWeight = "bold";
    upgradeName.style.color = this.getCategoryColor(upgrade.category);
    upgradeName.style.textShadow = `0 0 15px ${this.getCategoryColor(upgrade.category)}`;

    const desc = document.createElement("div");
    desc.textContent = upgrade.description;
    desc.style.fontSize = "1rem";
    desc.style.color = "#aaccdd";
    desc.style.marginTop = "0.5rem";

    confirmation.appendChild(installedText);
    confirmation.appendChild(upgradeName);
    confirmation.appendChild(desc);
    this.container.appendChild(confirmation);

    // Auto-continue after a short delay
    setTimeout(() => {
      this.handleContinue();
    }, 1500);
  }

  /**
   * Handles continuing to the next zone after upgrade selection.
   */
  private handleContinue(): void {
    this.hide();

    if (this.onCompleteCallback) {
      // Delay callback to allow hide animation
      setTimeout(() => {
        this.onCompleteCallback!();
        this.onCompleteCallback = null;
      }, 800);
    }
  }

  /**
   * Handles the reroll button click.
   */
  private handleReroll(): void {
    if (!this.runState) return;

    this.logger.info("Player used reroll");
    this.runState.useReroll();

    // Rebuild the content with new random choices
    this.buildContent();
  }

  /**
   * Handles the main menu button click.
   */
  private handleMainMenu(): void {
    this.logger.info("Zone complete: Player chose to return to main menu");

    // Hide this screen first
    this.hide();

    // Ensure hyperspace effect is disabled when returning to main menu
    if (this.game) {
      const scene = this.game.getSceneSystem().getScene();
      scene.transitionHyperspace(false, 1.0);

      // Transition to menu music
      if (this.game.getAudioManager()) {
        // Stop any game music first with a short fade out
        this.game.getAudioManager().stopMusic(0.5);
      }
    }

    // Tell the game to return to the main menu
    setTimeout(() => {
      this.game.getUISystem().showMenu();
    }, 1000);
  }
}
