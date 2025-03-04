import { Game } from "../core/Game";

export class TextCrawl {
  private container: HTMLDivElement;
  private crawlContainer: HTMLDivElement;
  private isVisible: boolean = false;
  private game: Game;
  private onCompleteCallback: (() => void) | null = null;

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.crawlContainer = document.createElement("div");
    this.setupStyles();
    this.setupCrawl();
    this.hide(); // Initially hidden
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .text-crawl-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        overflow: hidden;
        background: black;
        perspective: 400px;
        display: flex;
        justify-content: center;
        font-family: 'PressStart2P', monospace;
      }

      .crawl-content {
        position: absolute;
        top: 100%;
        color: #ffda00;
        font-size: 24px;
        text-align: center;
        width: 80%;
        max-width: 800px;
        transform-origin: 50% 100%;
        transform: rotateX(35deg);
        line-height: 1.8;
        letter-spacing: 2px;
        text-shadow: 0 0 10px rgba(255, 218, 0, 0.6);
      }

      .crawl-title {
        font-size: 38px;
        margin-bottom: 70px;
        color: #ffda00;
      }

      .crawl-paragraph {
        margin-bottom: 50px;
      }

      @keyframes scroll {
        0% { top: 100%; }
        100% { top: -250%; }
      }
    `;
    document.head.appendChild(style);
  }

  private setupCrawl(): void {
    this.container.className = "text-crawl-container";

    this.crawlContainer.className = "crawl-content";

    // Title
    const title = document.createElement("div");
    title.className = "crawl-title";
    title.textContent = "STAR WING";
    this.crawlContainer.appendChild(title);

    // Get story from GDD
    const paragraph1 = document.createElement("div");
    paragraph1.className = "crawl-paragraph";
    paragraph1.textContent =
      "You are the last surviving ACE PILOT on a critical mission.";
    this.crawlContainer.appendChild(paragraph1);

    const paragraph2 = document.createElement("div");
    paragraph2.className = "crawl-paragraph";
    paragraph2.textContent =
      "You roam lawless outer space zones overrun by pirates, alien raiders, and derelict war machines.";
    this.crawlContainer.appendChild(paragraph2);

    const paragraph3 = document.createElement("div");
    paragraph3.className = "crawl-paragraph";
    paragraph3.textContent =
      "Your mission: clear out enemies to make these regions safe for the galactic coalition.";
    this.crawlContainer.appendChild(paragraph3);

    const paragraph4 = document.createElement("div");
    paragraph4.className = "crawl-paragraph";
    paragraph4.textContent =
      "Take control of your starfighter and begin the fight against the worst scourges of space!";
    this.crawlContainer.appendChild(paragraph4);

    this.container.appendChild(this.crawlContainer);
    document.body.appendChild(this.container);
  }

  /**
   * Show the text crawl and start the animation.
   * @param onComplete Callback to call when the crawl animation finishes
   */
  show(onComplete?: () => void): void {
    if (this.isVisible) return;

    console.log("TextCrawl: Starting text crawl with callback:", !!onComplete);
    this.onCompleteCallback = onComplete || null;
    this.isVisible = true;
    this.container.style.display = "flex";

    // Reset crawl position
    this.crawlContainer.style.animation = "none";
    this.crawlContainer.offsetHeight; // Trigger reflow

    // Add animation with a callback for when it's done
    const animationDuration = 10; // Reduced from 60 to 10 seconds for testing
    this.crawlContainer.style.animation = `scroll ${animationDuration}s linear forwards`;

    // Listen for animation end to call the callback
    const onAnimationEnd = () => {
      console.log(
        "TextCrawl: Animation ended, calling callback:",
        !!this.onCompleteCallback
      );
      this.hide();
      if (this.onCompleteCallback) {
        console.log("TextCrawl: Executing callback");
        this.onCompleteCallback();
      }
      this.crawlContainer.removeEventListener("animationend", onAnimationEnd);
      console.log("TextCrawl: Finished cleanup after animation");
    };

    this.crawlContainer.addEventListener("animationend", onAnimationEnd);
    console.log("TextCrawl: Added animationend listener");

    // Also add a skip option with keyboard
    const skipKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        console.log("TextCrawl: Skipping via key:", e.key);
        // Remove the animation and trigger the callback
        this.crawlContainer.style.animation = "none";
        document.removeEventListener("keydown", skipKeyHandler);
        onAnimationEnd();
      }
    };

    document.addEventListener("keydown", skipKeyHandler);
    console.log("TextCrawl: Added keydown listener for skipping");
  }

  /**
   * Hide the text crawl.
   */
  hide(): void {
    this.isVisible = false;
    this.container.style.display = "none";
    this.onCompleteCallback = null;
  }

  /**
   * Clean up resources used by the text crawl.
   */
  dispose(): void {
    this.hide();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Check if the text crawl is currently visible.
   */
  isTextCrawlVisible(): boolean {
    return this.isVisible;
  }
}
