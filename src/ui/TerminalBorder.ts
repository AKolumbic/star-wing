/**
 * TerminalBorder - A singleton component that creates a consistent terminal-style border
 * that appears over all other UI elements in the application.
 */
import { Logger } from "../utils/Logger";
import { StyleManager } from "../styles/StyleManager";
import { terminalBorderStyles } from "../styles/TerminalBorderStyles";

export class TerminalBorder {
  private static instance: TerminalBorder | null = null;
  private container: HTMLDivElement;
  private initialized: boolean = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  // Private constructor for singleton pattern
  private constructor() {
    this.container = document.createElement("div");
    this.container.className = "terminal-border-container";
  }

  /**
   * Get the singleton instance of TerminalBorder
   */
  public static getInstance(): TerminalBorder {
    if (!TerminalBorder.instance) {
      TerminalBorder.instance = new TerminalBorder();
    }
    return TerminalBorder.instance;
  }

  /**
   * Initialize the terminal border with all visual elements
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.logger.info("[TerminalBorder] Initializing...");

    // Apply styles
    StyleManager.applyStyles("terminalBorder", terminalBorderStyles);

    this.setupContainer();
    this.addToDOM();
    this.initialized = true;

    this.logger.info(
      "[TerminalBorder] Initialized, container:",
      this.container
    );
  }

  /**
   * Set up the main container for the border
   */
  private setupContainer(): void {
    // Set the container to cover the entire viewport
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.pointerEvents = "none"; // Allow clicks to pass through
    this.container.style.zIndex = "9999"; // Make sure it's above everything
  }

  /**
   * Create and add all the DOM elements for the border
   */
  private addToDOM(): void {
    // Create frame
    const frame = document.createElement("div");
    frame.className = "terminal-frame";
    this.container.appendChild(frame);

    // Create scan lines
    const scanlines = document.createElement("div");
    scanlines.className = "terminal-scanlines";
    this.container.appendChild(scanlines);

    // Create glare
    const glare = document.createElement("div");
    glare.className = "terminal-glare";
    this.container.appendChild(glare);

    // Create screws
    const screwPositions = ["tl", "tr", "bl", "br"];
    screwPositions.forEach((pos) => {
      const screw = document.createElement("div");
      screw.className = `terminal-screw terminal-screw-${pos}`;
      this.container.appendChild(screw);
    });

    // Create power button
    const powerButton = document.createElement("div");
    powerButton.className = "terminal-power-button";

    // Add power LED
    const powerLed = document.createElement("div");
    powerLed.className = "terminal-power-led";
    powerButton.appendChild(powerLed);

    this.container.appendChild(powerButton);

    // Add the container to the document body
    document.body.appendChild(this.container);
  }

  /**
   * Remove the terminal border from the DOM
   */
  public dispose(): void {
    if (!this.initialized) return;

    this.logger.info("[TerminalBorder] Disposing...");

    // Remove styles
    StyleManager.removeStyles("terminalBorder");

    if (this.container && document.body.contains(this.container)) {
      this.logger.info("[TerminalBorder] Removing container from DOM");
      document.body.removeChild(this.container);
    } else {
      this.logger.info("[TerminalBorder] Container not found in DOM");
    }

    this.initialized = false;
    this.logger.info("[TerminalBorder] Disposed");
  }
}
