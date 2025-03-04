/**
 * Class for monitoring and tracking game performance metrics.
 */
export class PerformanceMonitor {
  /** Current frames per second */
  private fps: number = 0;

  /** Time taken to process the last frame in milliseconds */
  private frameTime: number = 0;

  /** Timestamp of the last FPS update */
  private lastFpsUpdate: number = 0;

  /** Frame counter used for FPS calculation */
  private frameCount: number = 0;

  /**
   * Creates a new PerformanceMonitor instance.
   */
  constructor() {
    this.lastFpsUpdate = performance.now();
  }

  /**
   * Updates performance metrics.
   * @param currentTime Current timestamp from performance.now()
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(currentTime: number, deltaTime: number): void {
    this.frameCount++;

    // Update metrics every second
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastFpsUpdate)
      );
      this.frameTime = deltaTime * 1000; // Convert to milliseconds
      this.lastFpsUpdate = currentTime;
      this.frameCount = 0;

      // Optionally log metrics for debugging
      // console.log(`FPS: ${this.fps}, Frame Time: ${this.frameTime.toFixed(2)}ms`);
    }
  }

  /**
   * Gets the current performance metrics.
   * @returns Object containing FPS and frame time information
   */
  getMetrics(): { fps: number; frameTime: number } {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
    };
  }

  /**
   * Resets all performance metrics.
   */
  reset(): void {
    this.fps = 0;
    this.frameTime = 0;
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;
  }
}
