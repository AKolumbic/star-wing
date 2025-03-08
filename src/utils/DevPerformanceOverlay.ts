import { PerformanceMonitor } from "../core/PerformanceMonitor";

export class DevPerformanceOverlay {
  private monitor: PerformanceMonitor;
  private overlayElement: HTMLDivElement;

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.overlayElement = document.createElement("div");
    this.overlayElement.id = "dev-performance-overlay";
    // Style the overlay so it appears in the top-right corner with a transparent background.
    this.overlayElement.style.position = "fixed";
    this.overlayElement.style.top = "0px";
    this.overlayElement.style.right = "0px";
    this.overlayElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.overlayElement.style.color = "#0f0";
    this.overlayElement.style.fontFamily = "monospace";
    this.overlayElement.style.padding = "5px";
    this.overlayElement.style.zIndex = "9999";
    document.body.appendChild(this.overlayElement);
  }

  public update(deltaTime: number): void {
    const currentTime = performance.now();
    this.monitor.update(currentTime, deltaTime);
    const metrics = this.monitor.getMetrics();
    this.overlayElement.innerText = `FPS: ${
      metrics.fps
    }\nFrame Time: ${metrics.frameTime.toFixed(2)}ms`;
  }

  public dispose(): void {
    if (this.overlayElement.parentElement) {
      this.overlayElement.parentElement.removeChild(this.overlayElement);
    }
  }
}
