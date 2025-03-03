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

    // Terminal window
    this.terminal = document.createElement("div");
    this.terminal.style.width = "80%";
    this.terminal.style.maxWidth = "800px";
    this.terminal.style.height = "60%";
    this.terminal.style.backgroundColor = "#000";
    this.terminal.style.border = "1px solid #33ff33";
    this.terminal.style.borderRadius = "5px";
    this.terminal.style.padding = "20px";
    this.terminal.style.fontFamily = "monospace";
    this.terminal.style.color = "#33ff33";
    this.terminal.style.fontSize = "14px";
    this.terminal.style.overflow = "hidden";
    this.terminal.style.boxShadow = "0 0 10px #33ff33";

    // Loading text at the bottom
    this.loadingText = document.createElement("div");
    this.loadingText.style.marginTop = "20px";
    this.loadingText.style.fontFamily = "monospace";
    this.loadingText.style.color = "#33ff33";
    this.loadingText.style.fontSize = "18px";
    this.loadingText.textContent = "Loading...";

    // Execute button (hidden initially)
    this.executeButton = document.createElement("div");
    this.executeButton.style.marginTop = "30px";
    this.executeButton.style.padding = "10px 20px";
    this.executeButton.style.backgroundColor = "#000";
    this.executeButton.style.border = "2px solid #33ff33";
    this.executeButton.style.borderRadius = "5px";
    this.executeButton.style.fontFamily = "monospace";
    this.executeButton.style.color = "#33ff33";
    this.executeButton.style.fontSize = "16px";
    this.executeButton.style.cursor = "pointer";
    this.executeButton.style.display = "none";
    this.executeButton.textContent = "> CLICK TO EXECUTE PROGRAM";
    this.executeButton.style.boxShadow = "0 0 5px #33ff33";

    // Add hover effect for button
    this.executeButton.addEventListener("mouseover", () => {
      this.executeButton.style.backgroundColor = "#33ff33";
      this.executeButton.style.color = "#000";
    });

    this.executeButton.addEventListener("mouseout", () => {
      this.executeButton.style.backgroundColor = "#000";
      this.executeButton.style.color = "#33ff33";
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

      this.terminal.appendChild(line);
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
    // Change loading text to completed
    this.loadingText.textContent = "Build process completed";
    this.loadingText.style.color = "#ffffff";

    // Clear blinking interval
    clearInterval(this.ellipsisInterval);

    // Show execute button with a blink effect
    this.executeButton.style.display = "block";

    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      this.executeButton.style.visibility =
        this.executeButton.style.visibility === "hidden" ? "visible" : "hidden";
      blinkCount++;

      if (blinkCount > 5) {
        clearInterval(blinkInterval);
        this.executeButton.style.visibility = "visible";
      }
    }, 300);
  }

  public hide(): void {
    document.body.removeChild(this.container);
    clearInterval(this.ellipsisInterval);
  }
}
