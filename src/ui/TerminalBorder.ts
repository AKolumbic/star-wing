/**
 * TerminalBorder - A singleton component that creates a consistent terminal-style border
 * that appears over all other UI elements in the application.
 */
export class TerminalBorder {
  private static instance: TerminalBorder | null = null;
  private container: HTMLDivElement;
  private initialized: boolean = false;

  // Private constructor for singleton pattern
  private constructor() {
    this.container = document.createElement("div");
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
    if (this.initialized) return;

    this.setupContainer();
    this.setupStyles();
    this.addToDOM();
    this.initialized = true;

    console.log("Terminal border initialized");
  }

  /**
   * Set up the main container for the border
   */
  private setupContainer(): void {
    // Set the container to cover the entire viewport
    this.container.className = "terminal-border-container";
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.pointerEvents = "none"; // Allow clicks to pass through
    this.container.style.zIndex = "9999"; // Make sure it's above everything
  }

  /**
   * Add all the stylesheets needed for the border elements
   */
  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .terminal-border-container {
        /* Container styles */
      }

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
        z-index: 9999;
        box-shadow: 
          inset 0 0 20px rgba(0, 0, 0, 0.8),
          0 0 10px rgba(0, 0, 0, 0.8);
      }

      /* Scan line effect */
      .terminal-scanlines {
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
        z-index: 10000;
        pointer-events: none;
        opacity: 0.7;
      }

      /* Screen glare effect */
      .terminal-glare {
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
        z-index: 10001;
        pointer-events: none;
      }

      /* Corner screws */
      .terminal-screw {
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #222;
        border-radius: 50%;
        z-index: 10002;
        box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.2);
      }
      .terminal-screw::after {
        content: "+";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 8px;
        color: #666;
      }
      .terminal-screw-tl { top: 8px; left: 8px; }
      .terminal-screw-tr { top: 8px; right: 8px; }
      .terminal-screw-bl { bottom: 8px; left: 8px; }
      .terminal-screw-br { bottom: 8px; right: 8px; }

      /* Power button */
      .terminal-power-button {
        position: absolute;
        top: -20px;
        right: 50px;
        width: 40px;
        height: 20px;
        background-color: #444;
        border-radius: 10px 10px 0 0;
        z-index: 10002;
      }
      .terminal-power-button::after {
        content: "POWER";
        position: absolute;
        top: 3px;
        left: 4px;
        font-size: 5px;
        color: #aaa;
      }
      .terminal-power-led {
        position: absolute;
        right: 5px;
        top: 5px;
        width: 5px;
        height: 5px;
        background-color: #0f0;
        border-radius: 50%;
        box-shadow: 0 0 5px #0f0;
        animation: terminal-blink 4s infinite;
      }

      @keyframes terminal-blink {
        0%, 95% { opacity: 1; }
        96%, 100% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
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

    if (this.container && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
    }

    this.initialized = false;
  }
}
