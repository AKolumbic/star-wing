export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "CONTROLS", "HIGH SCORES"];
  private animationFrame: number | null = null;
  private frameCount: number = 0;
  private shipPosition: number = 0;

  constructor() {
    this.container = document.createElement("div");
    this.container.className = "arcade-cabinet";
    this.setupStyles();
    this.setupMenu();
    this.startMenuAnimation();
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

      .arcade-cabinet {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        font-family: 'PressStart2P', monospace;
        overflow: hidden;
        z-index: 1000;
        color: #fff;
      }

      /* CRT scan line effect */
      .arcade-cabinet::before {
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
        z-index: 2000;
        pointer-events: none;
        opacity: 0.9;
      }

      /* Screen border effect */
      .arcade-cabinet::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.9);
        border-radius: 20px;
        z-index: 1999;
        pointer-events: none;
      }

      .game-screen {
        width: 80%;
        height: 90%;
        margin-top: 2%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
        border: 10px solid #333;
        border-radius: 10px;
        background-color: #000;
        position: relative;
        overflow: hidden;
      }

      .title-section {
        text-align: center;
        margin-top: 5%;
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

      .credit-section {
        display: flex;
        justify-content: space-between;
        width: 100%;
        color: #ff0;
        font-size: 0.8rem;
        margin-top: 10px;
      }

      .credit-text {
        animation: blink 1s infinite;
      }

      .copyright {
        color: #fff;
        font-size: 0.7rem;
      }

      .menu-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 5% 0;
      }

      .menu-option {
        color: #fff;
        font-size: 1.4rem;
        margin: 15px 0;
        padding: 5px 20px;
        position: relative;
        transition: all 0.1s;
      }

      .menu-option.selected {
        color: #0f0;
      }

      .menu-option.selected::before {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        left: -30px;
        top: 50%;
        transform: translateY(-50%);
        background-color: #0f0;
        clip-path: polygon(0 0, 0 100%, 100% 50%);
      }

      .ship-container {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        height: 60px;
        overflow: hidden;
      }

      .player-ship {
        position: absolute;
        bottom: 0;
        width: 50px;
        height: 30px;
        background-color: #0f0;
        clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
        transition: left 0.1s linear;
      }

      .laser {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 20px;
        background-color: #f00;
        opacity: 0;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }

      @keyframes invader-dance {
        0%, 50% { transform: translateY(0); }
        50.01%, 100% { transform: translateY(5px); }
      }

      @keyframes laser-shoot {
        0% { height: 0; opacity: 1; }
        100% { height: 500px; opacity: 1; }
      }

      @keyframes screen-flicker {
        0%, 95% { opacity: 1; }
        96%, 100% { opacity: 0.8; }
      }

      .game-screen {
        animation: screen-flicker 10s infinite;
      }

      .level-counter {
        position: absolute;
        top: 20px;
        right: 20px;
        color: #ff0;
        font-size: 0.9rem;
      }

      .hi-score {
        position: absolute;
        top: 20px;
        left: 20px;
        color: #ff0;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }

  private setupMenu(): void {
    // Create game screen container
    const gameScreen = document.createElement("div");
    gameScreen.className = "game-screen";

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
        } else if (option === "CONTROLS") {
          this.showControls();
        }
      });
      menuSection.appendChild(menuOption);
    });

    // Player ship animation at bottom
    const shipContainer = document.createElement("div");
    shipContainer.className = "ship-container";

    const playerShip = document.createElement("div");
    playerShip.className = "player-ship";
    playerShip.style.left = "10%";

    const laser = document.createElement("div");
    laser.className = "laser";

    shipContainer.appendChild(playerShip);
    shipContainer.appendChild(laser);

    // Credit and score section
    const creditSection = document.createElement("div");
    creditSection.className = "credit-section";

    const creditText = document.createElement("div");
    creditText.className = "credit-text";
    creditText.textContent = "INSERT COIN";

    const copyright = document.createElement("div");
    copyright.className = "copyright";
    copyright.textContent = "© 2023 STAR WING";

    creditSection.appendChild(creditText);
    creditSection.appendChild(copyright);

    // Hi-Score display
    const hiScore = document.createElement("div");
    hiScore.className = "hi-score";
    hiScore.textContent = "HI-SCORE: 10000";

    // Level counter
    const levelCounter = document.createElement("div");
    levelCounter.className = "level-counter";
    levelCounter.textContent = "LEVEL 01";

    // Append all elements
    gameScreen.appendChild(hiScore);
    gameScreen.appendChild(levelCounter);
    gameScreen.appendChild(titleSection);
    gameScreen.appendChild(menuSection);
    gameScreen.appendChild(shipContainer);
    gameScreen.appendChild(creditSection);

    this.container.appendChild(gameScreen);
    document.body.appendChild(this.container);

    // Setup keyboard navigation
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
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

    // Play selection sound (would implement actual sound in a real game)
    console.log("Selection sound");
  }

  private activateCurrentOption(): void {
    const selectedOption = this.menuOptions[this.currentSelection];

    // Animate laser shot
    const laser = document.querySelector(".laser") as HTMLElement;
    laser.style.left = `${this.shipPosition + 25}px`;
    laser.style.animation = "laser-shoot 0.5s forwards";

    // Reset animation after completion
    setTimeout(() => {
      laser.style.animation = "";

      if (selectedOption === "START GAME") {
        this.hide();
      } else if (selectedOption === "CONTROLS") {
        this.showControls();
      }
    }, 500);
  }

  private startMenuAnimation(): void {
    const animate = () => {
      this.frameCount++;

      // Move ship back and forth
      const shipElement = document.querySelector(".player-ship") as HTMLElement;
      if (shipElement) {
        this.shipPosition = 50 + Math.sin(this.frameCount / 30) * 40;
        shipElement.style.left = `${this.shipPosition}%`;
      }

      if (this.isVisible) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private showControls(): void {
    // In a real implementation, we would show the controls screen
    console.log("Show controls");
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
    this.startMenuAnimation();
  }

  hide(): void {
    this.container.style.display = "none";
    this.isVisible = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  isMenuVisible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    document.body.removeChild(this.container);
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }
}
