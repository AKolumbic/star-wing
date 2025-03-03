import { Game } from "../core/Game";

export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "SETTINGS", "HIGH SCORES"];
  private game: Game;

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";
    this.setupStyles();
    this.setupMenu();
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'PressStart2P';
        src: url('https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
      }

      .terminal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        font-family: 'PressStart2P', monospace;
        overflow: hidden;
        z-index: 1000;
        color: #fff;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Terminal Frame */
      .terminal-frame {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 28px solid #333;
        box-sizing: border-box;
        border-radius: 15px;
        pointer-events: none;
        background: transparent;
        z-index: 1003;
        box-shadow: 
          inset 0 0 20px rgba(0, 0, 0, 0.8),
          0 0 10px rgba(0, 0, 0, 0.8);
      }

      /* CRT Screen Effect with Viewport */
      .terminal-viewport {
        position: relative;
        width: calc(100% - 56px);
        height: calc(100% - 56px);
        overflow: hidden;
        background: transparent;
        z-index: 1002;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.5) inset;
      }

      /* Scan line effect */
      .terminal-overlay::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          rgba(18, 16, 16, 0) 50%, 
          rgba(0, 0, 0, 0.25) 50%
        );
        background-size: 100% 4px;
        z-index: 1005;
        pointer-events: none;
        opacity: 0.7;
      }

      /* Screen glare effect */
      .terminal-overlay::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          ellipse at center,
          rgba(255, 255, 255, 0.025) 0%,
          rgba(0, 0, 0, 0) 99%
        );
        z-index: 1004;
        pointer-events: none;
      }

      /* Corner screws */
      .screw {
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #222;
        border-radius: 50%;
        z-index: 1010;
        box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.2);
      }
      .screw::after {
        content: "+";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 8px;
        color: #666;
      }
      .screw-tl { top: 8px; left: 8px; }
      .screw-tr { top: 8px; right: 8px; }
      .screw-bl { bottom: 8px; left: 8px; }
      .screw-br { bottom: 8px; right: 8px; }

      .content-container {
        position: relative;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
      }

      .title-section {
        text-align: center;
        margin-bottom: 2rem;
      }

      .game-title {
        font-size: 3.5rem;
        color: #ff0;
        text-shadow: 3px 3px 0 #f00;
        margin: 0;
        animation: pulse 1.5s infinite alternate;
        letter-spacing: -2px;
      }

      .title-invaders {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      .invader {
        width: 30px;
        height: 30px;
        margin: 0 10px;
        background-color: #0f0;
        clip-path: polygon(
          0% 25%, 35% 25%, 35% 0%, 65% 0%, 65% 25%, 100% 25%, 
          100% 60%, 85% 60%, 85% 75%, 70% 75%, 70% 60%, 30% 60%, 
          30% 75%, 15% 75%, 15% 60%, 0% 60%
        );
        animation: invader-dance 1s infinite step-end;
      }

      .invader:nth-child(odd) {
        animation-delay: 0.5s;
      }

      .copyright {
        color: #fff;
        font-size: 0.8rem;
        text-align: center;
        position: absolute;
        bottom: 20px;
        width: 100%;
        z-index: 1006;
      }

      .menu-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0;
      }

      .menu-option {
        color: #fff;
        font-size: 1.4rem;
        margin: 15px 0;
        padding: 5px 20px;
        position: relative;
        transition: all 0.1s;
        cursor: pointer;
      }

      .menu-option.selected {
        color: #0f0;
      }

      /* Power button */
      .power-button {
        position: absolute;
        top: -20px;
        right: 50px;
        width: 40px;
        height: 20px;
        background-color: #444;
        border-radius: 10px 10px 0 0;
        z-index: 1010;
      }
      .power-button::after {
        content: "POWER";
        position: absolute;
        top: 3px;
        left: 4px;
        font-size: 5px;
        color: #aaa;
      }
      .power-led {
        position: absolute;
        right: 5px;
        top: 5px;
        width: 5px;
        height: 5px;
        background-color: #0f0;
        border-radius: 50%;
        box-shadow: 0 0 5px #0f0;
        animation: blink 4s infinite;
      }

      @keyframes blink {
        0%, 95% { opacity: 1; }
        96%, 100% { opacity: 0.7; }
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      @keyframes invader-dance {
        0%, 50% { transform: translateY(0); }
        50.01%, 100% { transform: translateY(5px); }
      }

      @keyframes screen-flicker {
        0%, 95% { opacity: 1; }
        96%, 100% { opacity: 0.8; }
      }

      .screen-flicker {
        animation: screen-flicker 10s infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private setupMenu(): void {
    // Create terminal elements
    const terminalFrame = document.createElement("div");
    terminalFrame.className = "terminal-frame";

    const terminalViewport = document.createElement("div");
    terminalViewport.className = "terminal-viewport";

    // Add screws to corners
    const screwPositions = ["tl", "tr", "bl", "br"];
    screwPositions.forEach((pos) => {
      const screw = document.createElement("div");
      screw.className = `screw screw-${pos}`;
      this.container.appendChild(screw);
    });

    // Add power button
    const powerButton = document.createElement("div");
    powerButton.className = "power-button";
    const powerLed = document.createElement("div");
    powerLed.className = "power-led";
    powerButton.appendChild(powerLed);
    this.container.appendChild(powerButton);

    // Content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container screen-flicker";

    // Title section
    const titleSection = document.createElement("div");
    titleSection.className = "title-section";

    const title = document.createElement("h1");
    title.className = "game-title";
    title.textContent = "STAR WING";

    const invadersRow = document.createElement("div");
    invadersRow.className = "title-invaders";

    // Add space invader style icons
    for (let i = 0; i < 5; i++) {
      const invader = document.createElement("div");
      invader.className = "invader";
      invadersRow.appendChild(invader);
    }

    titleSection.appendChild(title);
    titleSection.appendChild(invadersRow);

    // Menu options section
    const menuSection = document.createElement("div");
    menuSection.className = "menu-section";

    this.menuOptions.forEach((option, index) => {
      const menuOption = document.createElement("div");
      menuOption.className = "menu-option";
      menuOption.textContent = option;
      if (index === this.currentSelection) {
        menuOption.classList.add("selected");
      }
      menuOption.dataset.index = index.toString();
      menuOption.addEventListener("click", () => {
        if (option === "START GAME") {
          this.hide();
        } else if (option === "SETTINGS") {
          this.showControls();
        }
      });
      menuSection.appendChild(menuOption);
    });

    // Copyright section
    const copyright = document.createElement("div");
    copyright.className = "copyright";
    copyright.textContent = "© 2025 DROSSHOLE";

    // Append all elements
    contentContainer.appendChild(titleSection);
    contentContainer.appendChild(menuSection);
    contentContainer.appendChild(copyright);

    terminalViewport.appendChild(contentContainer);
    this.container.appendChild(terminalViewport);
    this.container.appendChild(terminalFrame);
    document.body.appendChild(this.container);

    // Setup keyboard navigation
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Add mute button to the menu
    const muteButton = this.createMuteButton();
    this.container.appendChild(muteButton);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    switch (event.key) {
      case "ArrowUp":
        this.selectOption(this.currentSelection - 1);
        break;
      case "ArrowDown":
        this.selectOption(this.currentSelection + 1);
        break;
      case "Enter":
        this.activateCurrentOption();
        break;
    }
  }

  private selectOption(index: number): void {
    if (index < 0) index = this.menuOptions.length - 1;
    if (index >= this.menuOptions.length) index = 0;

    // Remove previous selection
    const options = document.querySelectorAll(".menu-option");
    options.forEach((option) => option.classList.remove("selected"));

    // Add new selection
    options[index].classList.add("selected");
    this.currentSelection = index;
  }

  private activateCurrentOption(): void {
    const selectedOption = this.menuOptions[this.currentSelection];

    if (selectedOption === "START GAME") {
      this.hide();
    } else if (selectedOption === "SETTINGS") {
      this.showControls();
    }
  }

  private showControls(): void {
    // In a real implementation, we would show the settings screen
    console.log("Show settings");
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.display = "none";
    this.isVisible = false;
  }

  isMenuVisible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    document.body.removeChild(this.container);
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private createMuteButton(): HTMLElement {
    const muteButton = document.createElement("div");
    muteButton.className = "pixel-button mute-button";
    muteButton.textContent = "🔊";
    muteButton.style.position = "absolute";
    muteButton.style.bottom = "20px";
    muteButton.style.right = "20px";
    muteButton.style.cursor = "pointer";
    muteButton.style.padding = "8px";
    muteButton.style.color = "#00ff00";

    let muted = false;

    muteButton.addEventListener("click", () => {
      if (this.game) {
        this.game.getAudioManager().toggleMute();
        muted = !muted;
        muteButton.textContent = muted ? "🔇" : "��";
      }
    });

    return muteButton;
  }
}
