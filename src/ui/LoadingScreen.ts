import { Logger } from "../utils/Logger";

export class LoadingScreen {
  private container!: HTMLDivElement;
  private terminal!: HTMLDivElement;
  private loadingText!: HTMLDivElement;
  private executeButton!: HTMLDivElement;
  private errorMessageElement!: HTMLDivElement;
  private ellipsisInterval!: number;
  private cursorBlinkInterval!: number;
  private isMobileDevice: boolean = false;
  private logger = Logger.getInstance();

  // Fixed initial build messages
  private initialBuildMessages: string[] = [
    "Initializing build environment...",
    "Compiling star-wing kernel components...",
    "Building navigation subsystems...",
    "Linking weapon modules...",
  ];

  // Fixed final build messages
  private finalBuildMessages: string[] = ["Finalizing build process..."];

  // Arrays of possible easter egg messages for each slot
  private easterEggOptions: string[][] = [
    // Slot 1 options
    [
      "Charging laser banks to 42%...",
      "Calibrating primary weapon systems...",
      "Aligning targeting matrix...",
      "Loading photon torpedo modules...",
    ],
    // Slot 2 options
    [
      "Defragmenting hyperdrive memory allocations...",
      "Optimizing warp field parameters...",
      "Recalibrating flux capacitor...",
      "Initializing quantum probability field...",
    ],
    // Slot 3 options
    [
      "Converting caffeine to code efficiency...",
      "Brewing coffee for late-night coders...",
      "Calculating optimal dev-to-snack ratio...",
      "Refactoring spaghetti into lasagna code...",
    ],
    // Slot 4 options
    [
      "Polishing pixels for maximum shininess...",
      "Rendering lens flares at 110% intensity...",
      "Buffing sprites to a mirror finish...",
      "Applying bloom filter to explosions...",
    ],
    // Slot 5 options
    [
      "Tuning synthwave oscillators to resonant frequency...",
      "Adjusting reverb on background music...",
      "Sampling 80s drum machines...",
      "Setting bass levels to retrowave standards...",
    ],
    // Slot 6 options
    [
      "Injecting nostalgia modules into memory banks...",
      "Loading cassette tape aesthetic...",
      "Implementing CRT scan line filter...",
      "Simulating VHS distortion effects...",
    ],
    // Slot 7 options
    [
      "Increasing lens flare coefficient by 80s factor...",
      "Consulting design docs from 1986...",
      "Setting neon glow to maximum intensity...",
      "Implementing chrome typography standards...",
    ],
    // Slot 8 options
    [
      "Feeding mogwai after midnight, contrary to warnings...",
      "Installing cow-level secret area...",
      "Hiding konami code easter egg...",
      "Running npm install --universe...",
    ],
  ];

  // Build final message array with random selections
  private buildLines: string[] = this.generateBuildLines();

  constructor(private onComplete: () => void) {
    // Check for mobile device first
    this.detectMobileDevice();
    this.createElements();
    this.startBuildProcess();
  }

  private detectMobileDevice(): void {
    // Check for mobile device using user agent and screen size
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(
        userAgent
      );
    const isTablet = /tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(
      userAgent
    );

    // Also check screen width as a fallback
    const touchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const smallScreen = window.innerWidth < 768;

    this.isMobileDevice = isMobile || isTablet || (touchScreen && smallScreen);

    this.logger.info(
      "Device detection: ",
      this.isMobileDevice ? "Mobile device detected" : "Desktop device detected"
    );
  }

  private generateBuildLines(): string[] {
    const lines: string[] = [...this.initialBuildMessages];

    // Add random selection from each easter egg option array
    this.easterEggOptions.forEach((optionsArray) => {
      const randomIndex = Math.floor(Math.random() * optionsArray.length);
      lines.push(optionsArray[randomIndex]);
    });

    // Add final build messages
    lines.push(...this.finalBuildMessages);

    return lines;
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
    this.terminal.style.fontFamily = 'Courier, "Courier New", monospace';
    this.terminal.style.color = "#33ff33";
    this.terminal.style.fontSize = "14px";
    this.terminal.style.overflow = "hidden";
    this.terminal.style.boxShadow = "0 0 10px rgba(51, 255, 51, 0.5)";

    // Create an inner container for the text that can scroll
    const terminalContent = document.createElement("div");
    terminalContent.style.display = "flex";
    terminalContent.style.flexDirection = "column-reverse"; // New lines at bottom
    terminalContent.style.height = "100%";
    terminalContent.style.overflowY = "hidden"; // No scroll bars but content can overflow
    terminalContent.style.textAlign = "left";
    terminalContent.style.fontFamily = 'Courier, "Courier New", monospace';
    this.terminal.appendChild(terminalContent);

    // Store reference to terminal content in the terminal element
    this.terminal.dataset.content = "true";

    // Loading text below terminal - REMOVED
    // Keeping the property but not creating or displaying the element
    this.loadingText = document.createElement("div");
    this.loadingText.style.display = "none"; // Hide it completely

    // Only create execute button if not on mobile device
    if (!this.isMobileDevice) {
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
      this.executeButton.style.fontFamily = 'Courier, "Courier New", monospace';
      this.executeButton.style.color = "#33ff33";
      this.executeButton.style.fontSize = "20px";
      this.executeButton.style.cursor = "pointer";
      this.executeButton.style.display = "none";
      this.executeButton.style.boxShadow = "0 0 15px rgba(51, 255, 51, 0.7)";
      this.executeButton.style.textAlign = "center";

      // The base text for the button - will be updated with cursor
      const baseButtonText = "> CLICK TO EXECUTE PROGRAM";
      this.executeButton.textContent = baseButtonText + "█"; // Start with block cursor

      // Add click handler
      this.executeButton.addEventListener("click", () => {
        // Animate button press - flash green
        this.executeButton.style.backgroundColor = "rgba(51, 255, 51, 0.4)";
        setTimeout(() => {
          this.executeButton.style.backgroundColor = "#000";
          setTimeout(() => {
            // Clear button interval to stop cursor blinking during transition
            clearInterval(this.cursorBlinkInterval);

            // Fade out the entire loading screen
            this.container.style.transition = "opacity 1s ease-out";
            this.container.style.opacity = "0";

            // Call the completion callback after animation
            setTimeout(() => {
              this.hide();
              if (this.onComplete) {
                this.onComplete();
              }
            }, 1000);
          }, 100);
        }, 150);
      });
    }

    // Add to DOM
    this.container.appendChild(this.terminal);
    if (!this.isMobileDevice) {
      this.container.appendChild(this.executeButton);
    }
    document.body.appendChild(this.container);

    // Start blinking ellipsis - REMOVED
    // We don't need this interval anymore since the loading text is hidden
    /* 
    this.ellipsisInterval = window.setInterval(
      () => this.updateEllipsis(),
      500
    );
    */
  }

  private startBuildProcess(): void {
    let lineIndex = 0;
    // Get terminal content div
    const terminalContent = this.terminal.firstChild as HTMLDivElement;

    const addLine = (text: string) => {
      const line = document.createElement("div");
      line.style.marginBottom = "8px";
      line.style.whiteSpace = "nowrap";
      line.style.overflow = "hidden";
      line.style.textAlign = "left";

      // Add line at the beginning (bottom) of the terminal content
      if (terminalContent.firstChild) {
        terminalContent.insertBefore(line, terminalContent.firstChild);
      } else {
        terminalContent.appendChild(line);
      }

      // Type-writer effect - faster typing speed
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
      }, 15); // Faster typing (was 30)
    };

    const processNextLine = () => {
      if (lineIndex < this.buildLines.length) {
        // Consistent shorter delay between lines
        const delay = 100 + Math.random() * 100; // Much faster delay between lines

        setTimeout(() => {
          addLine(this.buildLines[lineIndex]);
          lineIndex++;
        }, delay);
      } else {
        // Show button sooner after last line
        setTimeout(() => {
          this.showExecuteButton();
        }, 500); // Was 1000
      }
    };

    // Start process with first line
    processNextLine();
  }

  private showExecuteButton(): void {
    // Stop the loading ellipsis animation and hide the loading text
    clearInterval(this.ellipsisInterval);
    this.loadingText.style.display = "none";

    if (this.isMobileDevice) {
      // Show error message for mobile devices
      this.showMobileDeviceError();
    } else {
      // Show execute button for desktop devices
      this.executeButton.style.display = "block";

      // Set a static glow instead of a pulsing effect
      this.executeButton.style.boxShadow = `0 0 15px rgba(51, 255, 51, 0.7)`;

      // Add terminal cursor blinking effect to button text
      const baseButtonText = "> CLICK TO EXECUTE PROGRAM";
      let cursorVisible = true;

      this.cursorBlinkInterval = window.setInterval(() => {
        cursorVisible = !cursorVisible;
        this.executeButton.textContent =
          baseButtonText + (cursorVisible ? "█" : " ");
      }, 530); // Slightly off from 500ms to create a more authentic feel

      // Store intervals to clear on hide - removed glowInterval
      // this.executeButton.dataset.glowInterval = String(glowInterval);
      this.executeButton.dataset.cursorInterval = String(
        this.cursorBlinkInterval
      );
    }
  }

  private showMobileDeviceError(): void {
    // Create and show the error message
    this.errorMessageElement = document.createElement("div");
    this.errorMessageElement.style.position = "absolute";
    this.errorMessageElement.style.top = "50%";
    this.errorMessageElement.style.left = "50%";
    this.errorMessageElement.style.transform = "translate(-50%, -50%)";
    this.errorMessageElement.style.textAlign = "center";
    this.errorMessageElement.style.backgroundColor = "#000";
    this.errorMessageElement.style.border = "2px solid #ff3333"; // Red border for error
    this.errorMessageElement.style.borderRadius = "5px";
    this.errorMessageElement.style.padding = "20px";
    this.errorMessageElement.style.fontFamily =
      'Courier, "Courier New", monospace';
    this.errorMessageElement.style.color = "#ff3333"; // Red text for error
    this.errorMessageElement.style.fontSize = "18px";
    this.errorMessageElement.style.boxShadow =
      "0 0 15px rgba(255, 51, 51, 0.7)"; // Red glow
    this.errorMessageElement.style.width = "80%";
    this.errorMessageElement.style.maxWidth = "500px";
    this.errorMessageElement.style.zIndex = "1001";

    // Error message text
    const errorText = document.createElement("div");
    errorText.textContent = "ERROR: FAILED TO EXECUTE PROGRAM";
    errorText.style.fontWeight = "bold";
    errorText.style.marginBottom = "15px";
    errorText.style.fontSize = "20px";
    this.errorMessageElement.appendChild(errorText);

    // Error details
    const errorDetails = document.createElement("div");
    errorDetails.innerHTML =
      "SYSTEM REQUIREMENTS NOT MET:<br>MOUSE AND KEYBOARD REQUIRED<br><br>PLEASE ACCESS THIS PROGRAM<br>FROM A DESKTOP DEVICE";
    errorDetails.style.lineHeight = "1.5";
    this.errorMessageElement.appendChild(errorDetails);

    // Add the error message to the container
    this.container.appendChild(this.errorMessageElement);

    // Add blinking effect to the error message border
    let isVisible = true;
    const blinkInterval = setInterval(() => {
      isVisible = !isVisible;
      this.errorMessageElement.style.borderColor = isVisible
        ? "#ff3333"
        : "#880000";
    }, 500);

    // Store the interval to clear on hide
    this.errorMessageElement.dataset.blinkInterval = String(blinkInterval);
  }

  public hide(): void {
    // Clear all intervals
    clearInterval(this.ellipsisInterval);

    if (this.executeButton && this.executeButton.dataset.cursorInterval) {
      clearInterval(parseInt(this.executeButton.dataset.cursorInterval));
    }

    // Clear error message blink interval if it exists
    if (
      this.errorMessageElement &&
      this.errorMessageElement.dataset.blinkInterval
    ) {
      clearInterval(parseInt(this.errorMessageElement.dataset.blinkInterval));
    }

    // Remove from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  public dispose(): void {
    this.hide();
  }
}
