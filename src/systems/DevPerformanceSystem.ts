import { GameSystem } from "../core/GameSystem";
import { DevPerformanceOverlay } from "../utils/DevPerformanceOverlay";

export class DevPerformanceSystem implements GameSystem {
  private overlay: DevPerformanceOverlay;

  constructor() {
    this.overlay = new DevPerformanceOverlay();
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  update(deltaTime: number): void {
    this.overlay.update(deltaTime);
  }

  dispose(): void {
    this.overlay.dispose();
  }
}
