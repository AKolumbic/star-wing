/**
 * Mock implementation for keyboard input in tests
 */
export class KeyboardMock {
  constructor() {
    this.pressedKeys = new Set();
    this.eventListeners = {
      keydown: [],
      keyup: [],
    };
  }

  pressKey(key) {
    this.pressedKeys.add(key);
    const event = new KeyboardEvent("keydown", { key });
    this.eventListeners.keydown.forEach((listener) => listener(event));
    return this; // For chaining
  }

  releaseKey(key) {
    this.pressedKeys.delete(key);
    const event = new KeyboardEvent("keyup", { key });
    this.eventListeners.keyup.forEach((listener) => listener(event));
    return this; // For chaining
  }

  isKeyPressed(key) {
    return this.pressedKeys.has(key);
  }

  addEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].push(listener);
    }
    return this; // For chaining
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(
        (l) => l !== listener
      );
    }
    return this; // For chaining
  }

  reset() {
    this.pressedKeys.clear();
    this.eventListeners = {
      keydown: [],
      keyup: [],
    };
    return this; // For chaining
  }
}

/**
 * Mock implementation for mouse input in tests
 */
export class MouseMock {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.buttons = 0;
    this.eventListeners = {
      mousemove: [],
      mousedown: [],
      mouseup: [],
      click: [],
    };
  }

  move(x, y) {
    this.x = x;
    this.y = y;
    const event = new MouseEvent("mousemove", { clientX: x, clientY: y });
    this.eventListeners.mousemove.forEach((listener) => listener(event));
    return this; // For chaining
  }

  down(button = 0) {
    this.buttons |= 1 << button;
    const event = new MouseEvent("mousedown", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.mousedown.forEach((listener) => listener(event));
    return this; // For chaining
  }

  up(button = 0) {
    this.buttons &= ~(1 << button);
    const event = new MouseEvent("mouseup", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.mouseup.forEach((listener) => listener(event));

    // Also trigger click
    const clickEvent = new MouseEvent("click", {
      clientX: this.x,
      clientY: this.y,
      button,
    });
    this.eventListeners.click.forEach((listener) => listener(clickEvent));
    return this; // For chaining
  }

  click(button = 0) {
    this.down(button);
    this.up(button);
    return this; // For chaining
  }

  addEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].push(listener);
    }
    return this; // For chaining
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(
        (l) => l !== listener
      );
    }
    return this; // For chaining
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.buttons = 0;
    this.eventListeners = {
      mousemove: [],
      mousedown: [],
      mouseup: [],
      click: [],
    };
    return this; // For chaining
  }
}

/**
 * Mock implementation for the entire input system
 */
export class InputSystemMock {
  constructor() {
    this.keyboard = new KeyboardMock();
    this.mouse = new MouseMock();
    this.handlers = {
      keydown: new Map(),
      keyup: new Map(),
      mousemove: new Map(),
      mousedown: new Map(),
      mouseup: new Map(),
      click: new Map(),
    };
  }

  // Register handlers
  on(eventType, id, handler) {
    if (this.handlers[eventType]) {
      this.handlers[eventType].set(id, handler);
    }
    return this; // For chaining
  }

  // Remove handlers
  off(eventType, id) {
    if (this.handlers[eventType]) {
      this.handlers[eventType].delete(id);
    }
    return this; // For chaining
  }

  // Simulate events
  simulateKeyDown(key) {
    this.keyboard.pressKey(key);
    const handlers = this.handlers.keydown;
    for (const handler of handlers.values()) {
      handler({ key });
    }
    return this; // For chaining
  }

  simulateKeyUp(key) {
    this.keyboard.releaseKey(key);
    const handlers = this.handlers.keyup;
    for (const handler of handlers.values()) {
      handler({ key });
    }
    return this; // For chaining
  }

  simulateMouseMove(x, y) {
    this.mouse.move(x, y);
    const handlers = this.handlers.mousemove;
    for (const handler of handlers.values()) {
      handler({ x, y });
    }
    return this; // For chaining
  }

  simulateMouseDown(x, y, button = 0) {
    if (x !== undefined && y !== undefined) {
      this.mouse.move(x, y);
    }
    this.mouse.down(button);
    const handlers = this.handlers.mousedown;
    for (const handler of handlers.values()) {
      handler({ x: this.mouse.x, y: this.mouse.y, button });
    }
    return this; // For chaining
  }

  simulateMouseUp(x, y, button = 0) {
    if (x !== undefined && y !== undefined) {
      this.mouse.move(x, y);
    }
    this.mouse.up(button);
    const handlers = this.handlers.mouseup;
    for (const handler of handlers.values()) {
      handler({ x: this.mouse.x, y: this.mouse.y, button });
    }

    // Simulate click event
    const clickHandlers = this.handlers.click;
    for (const handler of clickHandlers.values()) {
      handler({ x: this.mouse.x, y: this.mouse.y, button });
    }

    return this; // For chaining
  }

  simulateMouseClick(x, y, button = 0) {
    this.simulateMouseDown(x, y, button);
    this.simulateMouseUp(undefined, undefined, button); // Use same x,y as mousedown
    return this; // For chaining
  }

  reset() {
    this.keyboard.reset();
    this.mouse.reset();
    for (const eventType in this.handlers) {
      this.handlers[eventType].clear();
    }
    return this; // For chaining
  }
}
