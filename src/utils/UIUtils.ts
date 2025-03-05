/**
 * Utility class for UI operations that can be used across the game.
 */
export class UIUtils {
  /**
   * Displays a user-friendly error message overlay.
   * @param title The error title/heading
   * @param message The detailed error message to display
   */
  public static showErrorMessage(title: string, message: string): void {
    // Create error overlay container
    const errorOverlay = document.createElement("div");
    errorOverlay.className = "error-overlay";

    // Apply terminal-style styling
    errorOverlay.style.position = "fixed";
    errorOverlay.style.top = "0";
    errorOverlay.style.left = "0";
    errorOverlay.style.width = "100%";
    errorOverlay.style.height = "100%";
    errorOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    errorOverlay.style.zIndex = "10000";
    errorOverlay.style.display = "flex";
    errorOverlay.style.flexDirection = "column";
    errorOverlay.style.justifyContent = "center";
    errorOverlay.style.alignItems = "center";
    errorOverlay.style.padding = "2rem";
    errorOverlay.style.fontFamily = "'PressStart2P', monospace";
    errorOverlay.style.color = "#ff0000";
    errorOverlay.style.textAlign = "center";
    errorOverlay.style.textShadow = "0 0 5px rgba(255, 0, 0, 0.7)";

    // Create and style error title
    const titleElement = document.createElement("h1");
    titleElement.textContent = title;
    titleElement.style.fontSize = "2rem";
    titleElement.style.marginBottom = "2rem";
    titleElement.style.animation = "errorBlink 1s infinite alternate";

    // Create error message
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.style.fontSize = "1rem";
    messageElement.style.maxWidth = "800px";
    messageElement.style.lineHeight = "1.5";
    messageElement.style.marginBottom = "2rem";

    // Create retry button
    const retryButton = document.createElement("button");
    retryButton.textContent = "[ RELOAD SYSTEM ]";
    retryButton.style.backgroundColor = "transparent";
    retryButton.style.border = "2px solid #ff0000";
    retryButton.style.color = "#ff0000";
    retryButton.style.padding = "1rem 2rem";
    retryButton.style.fontSize = "1rem";
    retryButton.style.fontFamily = "'PressStart2P', monospace";
    retryButton.style.cursor = "pointer";
    retryButton.style.marginTop = "1rem";

    // Add hover effect
    retryButton.onmouseover = () => {
      retryButton.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
    };
    retryButton.onmouseout = () => {
      retryButton.style.backgroundColor = "transparent";
    };

    // Add reload functionality
    retryButton.onclick = () => {
      window.location.reload();
    };

    // Add blink animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes errorBlink {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Assemble and append to document
    errorOverlay.appendChild(titleElement);
    errorOverlay.appendChild(messageElement);
    errorOverlay.appendChild(retryButton);
    document.body.appendChild(errorOverlay);
  }

  /**
   * Creates a debug panel for adjusting ship boundaries.
   * @param ship The player ship instance
   * @returns The created debug panel element
   */
  public static createShipBoundaryControls(ship: any): HTMLElement {
    // Create container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.right = "10px";
    container.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    container.style.padding = "10px";
    container.style.borderRadius = "5px";
    container.style.color = "#fff";
    container.style.fontFamily = "monospace";
    container.style.zIndex = "10000";
    container.style.width = "200px";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Ship Boundary Controls";
    title.style.margin = "0 0 10px 0";
    title.style.fontSize = "14px";
    title.style.color = "#0ff";
    container.appendChild(title);

    // Create horizontal slider
    const horizontalContainer = document.createElement("div");
    horizontalContainer.style.marginBottom = "10px";

    const horizontalLabel = document.createElement("label");
    horizontalLabel.textContent = "Horizontal: ";
    horizontalLabel.style.display = "block";
    horizontalLabel.style.marginBottom = "5px";
    horizontalContainer.appendChild(horizontalLabel);

    const horizontalValue = document.createElement("span");
    horizontalValue.textContent = ship.horizontalLimit?.toString() || "1400";
    horizontalValue.style.marginLeft = "5px";
    horizontalValue.style.color = "#0f0";
    horizontalLabel.appendChild(horizontalValue);

    const horizontalSlider = document.createElement("input");
    horizontalSlider.type = "range";
    horizontalSlider.min = "400";
    horizontalSlider.max = "2000";
    horizontalSlider.step = "100";
    horizontalSlider.value = ship.horizontalLimit?.toString() || "1400";
    horizontalSlider.style.width = "100%";

    horizontalSlider.addEventListener("input", () => {
      const value = parseInt(horizontalSlider.value);
      horizontalValue.textContent = value.toString();
      ship.setBoundaryLimits(value, parseInt(verticalSlider.value));
    });

    horizontalContainer.appendChild(horizontalSlider);
    container.appendChild(horizontalContainer);

    // Create vertical slider
    const verticalContainer = document.createElement("div");
    verticalContainer.style.marginBottom = "10px";

    const verticalLabel = document.createElement("label");
    verticalLabel.textContent = "Vertical: ";
    verticalLabel.style.display = "block";
    verticalLabel.style.marginBottom = "5px";
    verticalContainer.appendChild(verticalLabel);

    const verticalValue = document.createElement("span");
    verticalValue.textContent = ship.verticalLimit?.toString() || "700";
    verticalValue.style.marginLeft = "5px";
    verticalValue.style.color = "#0f0";
    verticalLabel.appendChild(verticalValue);

    const verticalSlider = document.createElement("input");
    verticalSlider.type = "range";
    verticalSlider.min = "200";
    verticalSlider.max = "1000";
    verticalSlider.step = "50";
    verticalSlider.value = ship.verticalLimit?.toString() || "700";
    verticalSlider.style.width = "100%";

    verticalSlider.addEventListener("input", () => {
      const value = parseInt(verticalSlider.value);
      verticalValue.textContent = value.toString();
      ship.setBoundaryLimits(parseInt(horizontalSlider.value), value);
    });

    verticalContainer.appendChild(verticalSlider);
    container.appendChild(verticalContainer);

    // Add "make oblong" button
    const oblongButton = document.createElement("button");
    oblongButton.textContent = "Make Oblong (2:1)";
    oblongButton.style.padding = "5px 10px";
    oblongButton.style.marginRight = "5px";
    oblongButton.style.background = "#333";
    oblongButton.style.color = "#fff";
    oblongButton.style.border = "1px solid #666";
    oblongButton.style.borderRadius = "3px";
    oblongButton.style.cursor = "pointer";

    oblongButton.addEventListener("click", () => {
      // Set to 2800x1400 (2:1 ratio) playable area
      const vertical = 700;
      const horizontal = 1400;

      horizontalSlider.value = horizontal.toString();
      horizontalValue.textContent = horizontal.toString();

      verticalSlider.value = vertical.toString();
      verticalValue.textContent = vertical.toString();

      ship.setBoundaryLimits(horizontal, vertical);
    });

    container.appendChild(oblongButton);

    return container;
  }
}
