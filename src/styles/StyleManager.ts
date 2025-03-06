/**
 * StyleManager.ts
 * Utility for managing and applying styles across the application.
 * Provides a consistent interface for applying CSS styles to the document.
 */

import { Logger } from "../utils/Logger";

export class StyleManager {
  private static styleElements: Map<string, HTMLStyleElement> = new Map();
  private static logger = Logger.getInstance();

  /**
   * Applies styles to the document
   * @param id Unique identifier for the style (typically component name)
   * @param css CSS content as a template string
   */
  public static applyStyles(id: string, css: string): void {
    // Check if styles with this ID already exist
    if (this.styleElements.has(id)) {
      this.logger.debug(
        `StyleManager: Styles for ${id} already exist, updating`
      );
      const existingElement = this.styleElements.get(id)!;
      existingElement.textContent = css;
      return;
    }

    // Create and append new style element
    try {
      const styleElement = document.createElement("style");
      styleElement.setAttribute("data-style-id", id);
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
      this.styleElements.set(id, styleElement);
      this.logger.debug(`StyleManager: Applied styles for ${id}`);
    } catch (error) {
      this.logger.error(
        `StyleManager: Failed to apply styles for ${id}`,
        error
      );
    }
  }

  /**
   * Removes styles from the document
   * @param id Unique identifier for the style to remove
   */
  public static removeStyles(id: string): void {
    if (!this.styleElements.has(id)) {
      this.logger.debug(`StyleManager: No styles found for ${id}`);
      return;
    }

    try {
      const styleElement = this.styleElements.get(id)!;
      document.head.removeChild(styleElement);
      this.styleElements.delete(id);
      this.logger.debug(`StyleManager: Removed styles for ${id}`);
    } catch (error) {
      this.logger.error(
        `StyleManager: Failed to remove styles for ${id}`,
        error
      );
    }
  }
}
