/**
 * Global test setup file for Star-Wing test suite
 */

// Import testing tools
import "@testing-library/jest-dom";

// Import our mocks
import { WebGLRenderingContextMock } from "./mocks/webgl";
import { AnimationFrameMock } from "./mocks/timing";

/**
 * Mock console methods to make test output cleaner
 * Actual errors/warnings will still be visible in the terminal,
 * but won't be included in test output
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Create a temporary mock that doesn't fully suppress during development
console.error = (...args) => {
  if (process.env.NODE_ENV !== "test") {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  if (process.env.NODE_ENV !== "test") {
    originalConsoleWarn(...args);
  }
};

console.log = (...args) => {
  if (process.env.NODE_ENV !== "test") {
    originalConsoleLog(...args);
  }
};

/**
 * Mock WebGL context
 * This replaces the getContext method to return our mock implementation
 */
HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (
    contextType === "webgl" ||
    contextType === "webgl2" ||
    contextType === "experimental-webgl"
  ) {
    return new WebGLRenderingContextMock();
  }

  // Return a 2D context mock for other types
  if (contextType === "2d") {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 10 })),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn(),
      createPattern: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fillStyle: null,
      strokeStyle: null,
      lineWidth: 1,
      globalAlpha: 1,
    };
  }

  return null;
};

/**
 * Mock requestAnimationFrame and related timing functions
 */
const animationFrameMock = new AnimationFrameMock();
window.requestAnimationFrame = jest.fn(
  animationFrameMock.requestAnimationFrame.bind(animationFrameMock)
);
window.cancelAnimationFrame = jest.fn(
  animationFrameMock.cancelAnimationFrame.bind(animationFrameMock)
);

// Advance time helper function for tests
window.advanceAnimationFrame = (frames = 1, deltaTime = 16.667) => {
  for (let i = 0; i < frames; i++) {
    animationFrameMock.step(deltaTime);
  }
};

/**
 * Mock Audio API
 */
window.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      value: 1,
    },
  }),
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
    },
  }),
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  }),
  resume: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
  destination: {},
  currentTime: 0,
}));

window.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

/**
 * Canvas dimensions
 * When tests measure or calculate sizes, they'll be consistent
 */
window.innerWidth = 1024;
window.innerHeight = 768;

/**
 * Mock the ResizeObserver
 */
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Helper method for tests to trigger resize
  triggerResize(element, size = { width: 100, height: 100 }) {
    if (this.elements.has(element)) {
      this.callback([
        {
          target: element,
          contentRect: size,
        },
      ]);
    }
  }
}

window.ResizeObserver = MockResizeObserver;

/**
 * Clean up mocks after tests
 */
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
