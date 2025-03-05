import { GameSystem } from "../GameSystem";
import { Input } from "../Input";

/**
 * Adapter class that wraps the Input class to implement the GameSystem interface.
 * Responsible for handling keyboard, mouse and other user input.
 */
export class InputSystem implements GameSystem {
  /** The underlying Input instance */
  private input: Input;

  /**
   * Creates a new InputSystem.
   */
  constructor() {
    this.input = new Input();
  }

  /**
   * Initializes the input system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    this.input.init();
    return Promise.resolve();
  }

  /**
   * Updates the input system for the current frame.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(_deltaTime: number): void {
    this.input.update();
  }

  /**
   * Cleans up input resources.
   */
  dispose(): void {
    this.input.dispose();
  }

  /**
   * Gets the underlying Input instance.
   * @returns The Input instance
   */
  getInput(): Input {
    return this.input;
  }

  /**
   * Checks if a specific key is currently pressed.
   * @param key The key to check
   * @returns True if the key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.input.isKeyPressed(key);
  }

  /**
   * Checks if a specific mouse button is currently pressed.
   * @param button The mouse button to check
   * @returns True if the button is currently pressed
   */
  isMouseButtonPressed(button: number): boolean {
    return this.input.isMouseButtonPressed(button);
  }

  /**
   * Gets the current mouse position.
   * @returns The current mouse position object
   */
  getMousePosition(): { x: number; y: number } {
    return this.input.getMousePosition();
  }
}
