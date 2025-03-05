import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";

export class TextCrawl {
  private container: HTMLDivElement;
  private crawlContainer: HTMLDivElement;
  private isVisible: boolean = false;

  // Stored for future integration with game state and event systems
  private game: Game;
  private onCompleteCallback: (() => void) | null = null;
  private animationEndHandler: ((e: AnimationEvent) => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private positionCheckInterval: number | null = null;
  private logger = Logger.getInstance();

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
        background: rgba(0, 0, 0, 0.2); /* More transparent background to see starfield */
        perspective: 500px; /* Increased perspective for more dramatic effect */
        display: flex;
        justify-content: center;
        font-family: 'PressStart2P', monospace;
      }

      .crawl-content {
        position: absolute;
        top: 100%;
        color: #FFE81F; /* Star Wars gold */
        font-size: 28px;
        text-align: center;
        width: 80%;
        max-width: 800px;
        transform-origin: 50% 100%;
        transform: rotateX(25deg); /* Reduced angle for better readability */
        line-height: 2;
        letter-spacing: 2px;
        text-shadow: 0 0 10px rgba(255, 232, 31, 0.7);
        padding-bottom: 20%;
      }

      /* Add a subtle fade effect only at the very bottom edge */
      .crawl-content::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 15%;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        pointer-events: none;
      }

      .crawl-title {
        font-size: 50px; /* Larger title */
        margin-bottom: 100px;
        color: #FFE81F; /* Star Wars gold */
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(255, 232, 31, 0.9);
      }

      .crawl-paragraph {
        margin-bottom: 50px;
        text-shadow: 0 0 15px rgba(255, 232, 31, 0.8); /* Enhanced text shadow for better readability */
      }

      @keyframes scroll {
        0% { 
          top: 100%; 
        }
        100% { 
          top: -250%;
        }
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

    // Add an extra empty element as the last child to detect when all content has passed
    const endDetector = document.createElement("div");
    endDetector.className = "crawl-end-detector";
    endDetector.style.height = "1px";
    endDetector.dataset.endDetector = "true";
    this.crawlContainer.appendChild(endDetector);

    this.container.appendChild(this.crawlContainer);
    document.body.appendChild(this.container);
  }

  /**
   * Show the text crawl and start the animation.
   * @param onComplete Callback to call when the crawl animation finishes
   */
  show(onComplete?: () => void): void {
    if (this.isVisible) return;

    this.logger.info(
      "TextCrawl: Starting text crawl with callback:",
      !!onComplete
    );
    this.onCompleteCallback = onComplete || null;
    this.isVisible = true;
    this.container.style.display = "flex";

    // Reset crawl position
    this.crawlContainer.style.animation = "none";
    this.crawlContainer.offsetHeight; // Trigger reflow

    // Add animation with a callback for when it's done (as a fallback)
    const animationDuration = 60; // Keep the 60 second duration as requested
    this.crawlContainer.style.animation = `scroll ${animationDuration}s linear forwards`;

    // Apply a slight zoom effect to enhance the 3D feeling
    setTimeout(() => {
      if (this.crawlContainer && this.isVisible) {
        this.crawlContainer.style.transition = "transform 60s ease-out";
        this.crawlContainer.style.transform = "rotateX(25deg) scale(0.8)";
      }
    }, 100);

    // Set up animation end listener (fallback if position checking fails)
    this.animationEndHandler = (e: AnimationEvent) => {
      if (e.animationName === "scroll") {
        this.logger.info(
          "TextCrawl: Animation ended naturally (fallback), cleaning up and executing callback"
        );

        // Clean up event listeners first
        this.cleanupEventListeners();

        // Hide the crawl and execute callback
        this.hide();
        this.executeCallback();
      }
    };

    this.crawlContainer.addEventListener(
      "animationend",
      this.animationEndHandler
    );
    this.logger.info("TextCrawl: Added animationend listener");

    // Set up key listener for skipping
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        this.logger.info("TextCrawl: Skipping via key:", e.key);
        this.skip();
      }
    };

    document.addEventListener("keydown", this.keydownHandler);
    this.logger.info("TextCrawl: Added keydown listener for skipping");

    // Set up interval to check text position relative to terminal border
    this.startPositionChecking();
  }

  /**
   * Set up an interval to check if all text has passed the top of the terminal border
   */
  private startPositionChecking(): void {
    this.logger.info("TextCrawl: Starting position check interval");

    // Check every 100ms if the text has scrolled past the terminal border
    this.positionCheckInterval = window.setInterval(() => {
      if (this.hasAllTextPassedTerminalBorder()) {
        this.logger.info(
          "TextCrawl: All text has passed terminal border, ending animation"
        );
        this.endAnimationEarly();
      }
    }, 100);
  }

  /**
   * Check if all text content has passed above the terminal border
   */
  private hasAllTextPassedTerminalBorder(): boolean {
    if (!this.isVisible) return false;

    // Find the end detector element
    const endDetector = this.crawlContainer.querySelector(
      '[data-end-detector="true"]'
    );
    if (!endDetector) return false;

    // Get its position
    const endDetectorRect = endDetector.getBoundingClientRect();

    // Get the terminal border position - the top 10% of the screen as an approximation
    // This is an estimate since we don't have direct access to the terminal border position
    const terminalBorderTop = window.innerHeight * 0.1;

    // If the end detector is above the terminal border top, all text has passed
    return endDetectorRect.bottom < terminalBorderTop;
  }

  /**
   * End the animation early because all text has passed the terminal border
   */
  private endAnimationEarly(): void {
    // Stop checking position
    if (this.positionCheckInterval !== null) {
      clearInterval(this.positionCheckInterval);
      this.positionCheckInterval = null;
    }

    // Remove the animation
    this.crawlContainer.style.animation = "none";

    // Clean up event listeners
    this.cleanupEventListeners();

    // Hide the crawl and execute callback
    this.hide();
    this.executeCallback();
  }

  /**
   * Hide the text crawl.
   */
  hide(): void {
    this.isVisible = false;
    this.container.style.display = "none";
  }

  /**
   * Clean up all event listeners
   */
  private cleanupEventListeners(): void {
    // Remove animation end listener
    if (this.animationEndHandler) {
      this.crawlContainer.removeEventListener(
        "animationend",
        this.animationEndHandler
      );
      this.animationEndHandler = null;
    }

    // Remove key down listener
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }

    // Clear position check interval
    if (this.positionCheckInterval !== null) {
      clearInterval(this.positionCheckInterval);
      this.positionCheckInterval = null;
    }

    this.logger.info("TextCrawl: Removed all event listeners");
  }

  /**
   * Clean up resources used by the text crawl.
   */
  dispose(): void {
    this.cleanupEventListeners();
    this.hide();
    this.onCompleteCallback = null;

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

  /**
   * Skip the text crawl animation
   */
  private skip(): void {
    // Remove the animation
    this.crawlContainer.style.animation = "none";

    // Clean up event listeners
    this.cleanupEventListeners();

    // Hide the crawl and execute callback
    this.hide();
    this.executeCallback();
  }

  /**
   * Execute the completion callback if it exists
   */
  private executeCallback(): void {
    if (this.onCompleteCallback) {
      this.logger.info(
        "TextCrawl: Preparing to execute callback with 2-second delay"
      );

      // Save callback to a local variable to avoid null reference later
      const callback = this.onCompleteCallback;
      // Clear the callback reference immediately to prevent double execution
      this.onCompleteCallback = null;

      // Add a 2-second delay before executing the callback
      setTimeout(() => {
        this.logger.info("TextCrawl: Executing callback after delay");
        callback(); // Using local variable that we know is non-null
      }, 2000);
    }
    this.logger.info("TextCrawl: Finished cleanup after animation");
  }
}
