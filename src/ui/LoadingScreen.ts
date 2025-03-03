import { AudioManager } from "../audio/AudioManager";

export class LoadingScreen {
  private container!: HTMLDivElement;
  private terminal!: HTMLDivElement;
  private loadingText!: HTMLDivElement;
  private executeButton!: HTMLDivElement;
  private ellipsisState: number = 0;
  private ellipsisInterval!: number;
  private buildLines: string[] = [
    "Initializing build environment...",
    "Compiling star-wing kernel components...",
    "Building navigation subsystems...",
    "Linking weapon modules...",
    "Generating star field patterns...",
    "Optimizing render pipeline...",
    "Calibrating physics engine...",
    "Loading audio drivers...",
    "Finalizing build process...",
  ];

  constructor(
    private onComplete: () => void,
    private audioManager: AudioManager
  ) {
    this.createElements();
    this.startBuildProcess();
  }

  private createElements(): void {
    // Main container
    this.container = document.createElement("div");
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.backgroundColor = "#000";
    this.container.style.zIndex = "1000";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.alignItems = "center";
    this.container.style.justifyContent = "center";

    // Terminal window - centered both horizontally and vertically
    this.terminal = document.createElement("div");
    this.terminal.style.position = "absolute";
    this.terminal.style.left = "50%";
    this.terminal.style.top = "50%";
    this.terminal.style.transform = "translate(-50%, -50%)";
    this.terminal.style.width = "600px";
    this.terminal.style.maxWidth = "80%";
    this.terminal.style.height = "300px";
    this.terminal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.terminal.style.border = "1px solid #33ff33";
    this.terminal.style.borderRadius = "5px";
    this.terminal.style.padding = "15px";
    this.terminal.style.fontFamily = "monospace";
    this.terminal.style.color = "#33ff33";
    this.terminal.style.fontSize = "14px";
    this.terminal.style.overflow = "hidden";
    this.terminal.style.boxShadow = "0 0 10px rgba(51, 255, 51, 0.5)";
    this.terminal.style.display = "flex";
    this.terminal.style.flexDirection = "column-reverse"; // New lines at bottom
    this.terminal.style.textAlign = "left"; // Ensure text remains left-aligned

    // Loading text below terminal
    this.loadingText = document.createElement("div");
    this.loadingText.style.position = "absolute";
    this.loadingText.style.left = "50%";
    this.loadingText.style.transform = "translateX(-50%)";
    this.loadingText.style.top = "calc(50% + 160px)"; // Position below the terminal
    this.loadingText.style.fontFamily = "monospace";
    this.loadingText.style.color = "#33ff33";
    this.loadingText.style.fontSize = "18px";
    this.loadingText.textContent = "Loading...";

    // Execute button (hidden initially) - centered with glow
    this.executeButton = document.createElement("div");
    this.executeButton.style.position = "absolute";
    this.executeButton.style.top = "50%";
    this.executeButton.style.left = "50%";
    this.executeButton.style.transform = "translate(-50%, -50%)";
    this.executeButton.style.padding = "15px 25px";
    this.executeButton.style.backgroundColor = "#000";
    this.executeButton.style.border = "2px solid #33ff33";
    this.executeButton.style.borderRadius = "5px";
    this.executeButton.style.fontFamily = "monospace";
    this.executeButton.style.color = "#33ff33";
    this.executeButton.style.fontSize = "20px";
    this.executeButton.style.cursor = "pointer";
    this.executeButton.style.display = "none";
    this.executeButton.style.boxShadow = "0 0 15px rgba(51, 255, 51, 0.7)";
    this.executeButton.style.textAlign = "center";
    this.executeButton.textContent = "> CLICK TO EXECUTE PROGRAM";

    // Add hover effect for button
    this.executeButton.addEventListener("mouseover", () => {
      this.executeButton.style.backgroundColor = "rgba(51, 255, 51, 0.2)";
      this.executeButton.style.boxShadow = "0 0 25px rgba(51, 255, 51, 0.9)";
    });

    this.executeButton.addEventListener("mouseout", () => {
      this.executeButton.style.backgroundColor = "#000";
      this.executeButton.style.boxShadow = "0 0 15px rgba(51, 255, 51, 0.7)";
    });

    // Add click handler
    this.executeButton.addEventListener("click", () => {
      this.audioManager.playTestTone();
      setTimeout(() => {
        this.hide();
        this.onComplete();
      }, 300);
    });

    // Append elements
    this.container.appendChild(this.terminal);
    this.container.appendChild(this.loadingText);
    this.container.appendChild(this.executeButton);
    document.body.appendChild(this.container);

    // Start blinking ellipsis
    this.ellipsisInterval = window.setInterval(
      () => this.updateEllipsis(),
      500
    );
  }

  private updateEllipsis(): void {
    this.ellipsisState = (this.ellipsisState + 1) % 4;
    const ellipsis = ".".repeat(this.ellipsisState);
    this.loadingText.textContent = `Loading${ellipsis}${" ".repeat(
      3 - this.ellipsisState
    )}`;
  }

  private startBuildProcess(): void {
    let lineIndex = 0;

    const addLine = (text: string) => {
      const line = document.createElement("div");
      line.style.marginBottom = "8px";
      line.style.whiteSpace = "nowrap";
      line.style.overflow = "hidden";
      line.style.textAlign = "left";

      // Add line at the beginning (bottom) of the terminal
      if (this.terminal.firstChild) {
        this.terminal.insertBefore(line, this.terminal.firstChild);
      } else {
        this.terminal.appendChild(line);
      }

      // Type-writer effect
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < text.length) {
          line.textContent = `> ${text.substring(0, charIndex + 1)}`;
          charIndex++;
        } else {
          line.textContent = `> ${text} [DONE]`;
          clearInterval(typingInterval);
          processNextLine();
        }
      }, 30);
    };

    const processNextLine = () => {
      if (lineIndex < this.buildLines.length) {
        setTimeout(() => {
          addLine(this.buildLines[lineIndex]);
          lineIndex++;
        }, 200 + Math.random() * 300);
      } else {
        setTimeout(() => {
          this.showExecuteButton();
        }, 1000);
      }
    };

    // Start process with first line
    processNextLine();
  }

  private showExecuteButton(): void {
    // Stop the loading ellipsis animation and hide the loading text
    clearInterval(this.ellipsisInterval);
    this.loadingText.style.display = "none";

    // Show execute button
    this.executeButton.style.display = "block";

    // Add pulsing glow effect
    let glowIntensity = 0.7;
    let increasing = true;
    const glowInterval = setInterval(() => {
      if (increasing) {
        glowIntensity += 0.05;
        if (glowIntensity >= 1.0) {
          increasing = false;
        }
      } else {
        glowIntensity -= 0.05;
        if (glowIntensity <= 0.7) {
          increasing = true;
        }
      }

      this.executeButton.style.boxShadow = `0 0 15px rgba(51, 255, 51, ${glowIntensity})`;
    }, 50);

    // Store interval to clear on hide
    this.executeButton.dataset.glowInterval = String(glowInterval);
  }

  public hide(): void {
    // Clear any intervals
    clearInterval(this.ellipsisInterval);
    if (this.executeButton.dataset.glowInterval) {
      clearInterval(parseInt(this.executeButton.dataset.glowInterval));
    }

    document.body.removeChild(this.container);
  }
}
