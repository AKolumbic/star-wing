/**
 * Mock implementation for requestAnimationFrame and timing in tests
 */
export class AnimationFrameMock {
  constructor() {
    this.callbacks = new Map();
    this.nextId = 1;
    this.currentTime = 0;
    this.isInstalled = false;
  }

  /**
   * Install mock globally to replace requestAnimationFrame
   */
  install() {
    if (this.isInstalled) {
      return;
    }

    this.originalRAF = window.requestAnimationFrame;
    this.originalCAF = window.cancelAnimationFrame;
    this.originalPerformanceNow = performance.now;
    this.originalDateNow = Date.now;

    window.requestAnimationFrame = this.requestAnimationFrame.bind(this);
    window.cancelAnimationFrame = this.cancelAnimationFrame.bind(this);
    performance.now = this.performanceNow.bind(this);
    Date.now = this.dateNow.bind(this);

    this.isInstalled = true;

    return this;
  }

  /**
   * Uninstall mock and restore original functions
   */
  uninstall() {
    if (!this.isInstalled) {
      return;
    }

    window.requestAnimationFrame = this.originalRAF;
    window.cancelAnimationFrame = this.originalCAF;
    performance.now = this.originalPerformanceNow;
    Date.now = this.originalDateNow;

    this.isInstalled = false;

    return this;
  }

  /**
   * Mock implementation of requestAnimationFrame
   */
  requestAnimationFrame(callback) {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  /**
   * Mock implementation of cancelAnimationFrame
   */
  cancelAnimationFrame(id) {
    this.callbacks.delete(id);
    return this;
  }

  /**
   * Mock implementation of performance.now()
   */
  performanceNow() {
    return this.currentTime;
  }

  /**
   * Mock implementation of Date.now()
   */
  dateNow() {
    return this.currentTime;
  }

  /**
   * Advance time and trigger callbacks
   * @param {number} deltaTime - Time to advance in milliseconds (default: 16.667 for 60fps)
   * @param {boolean} triggerAnimationFrame - Whether to trigger animation frame callbacks
   */
  step(deltaTime = 16.667, triggerAnimationFrame = true) {
    this.currentTime += deltaTime;

    if (triggerAnimationFrame) {
      // Get callbacks to run (in case callbacks register new ones)
      const callbacksToRun = Array.from(this.callbacks.entries());

      // Clear callbacks before running them
      this.callbacks.clear();

      // Run all queued callbacks with the current timestamp
      for (const [id, callback] of callbacksToRun) {
        callback(this.currentTime);
      }
    }

    return this;
  }

  /**
   * Run multiple animation frames
   * @param {number} frameCount - Number of frames to run
   * @param {number} deltaTime - Time per frame (default: 16.667 for 60fps)
   */
  runFrames(frameCount, deltaTime = 16.667) {
    for (let i = 0; i < frameCount; i++) {
      this.step(deltaTime);
    }
    return this;
  }

  /**
   * Reset the mock state
   */
  reset() {
    this.callbacks.clear();
    this.nextId = 1;
    this.currentTime = 0;
    return this;
  }
}

/**
 * Convenience function to create and install a mock
 * @returns {function} Function that will uninstall the mock
 */
export function mockAnimationFrame() {
  const mock = new AnimationFrameMock().install();

  return () => {
    mock.uninstall();
  };
}
