export class Input {
  private keys: Set<string> = new Set();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseButtons: Set<number> = new Set();

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  init(): void {
    // Add event listeners
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.key.toLowerCase());
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    this.mouseButtons.add(event.button);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.mouseButtons.delete(event.button);
  }

  update(): void {
    // Update input state if needed
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  dispose(): void {
    // Remove event listeners
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
  }
}
