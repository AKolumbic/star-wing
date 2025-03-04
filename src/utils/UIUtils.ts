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
}
