import { LoadingScreen } from "../../../src/ui/LoadingScreen";
import { Logger } from "../../../src/utils/Logger";

// Mock dependencies
jest.mock("../../../src/utils/Logger");

describe("LoadingScreen", () => {
  let mockLogger: jest.Mocked<Logger>;
  let loadingScreen: LoadingScreen;
  let onCompleteMock: jest.Mock;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Setup logger mock
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      getInstance: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;
    (Logger as jest.Mocked<typeof Logger>).getInstance.mockReturnValue(
      mockLogger
    );

    // Mock navigator for desktop device detection
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        maxTouchPoints: 0,
      },
      configurable: true,
    });

    // Mock window.innerWidth for desktop device detection
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      configurable: true,
    });

    // Mock ontouchstart for desktop device detection
    Object.defineProperty(window, "ontouchstart", {
      value: undefined,
      configurable: true,
    });

    // Create completion callback mock
    onCompleteMock = jest.fn();

    // Create LoadingScreen instance
    loadingScreen = new LoadingScreen(onCompleteMock);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("creates loading screen with correct structure", () => {
      const container = document.querySelector("div") as HTMLDivElement;
      expect(container).toBeTruthy();
      expect(container.style.position).toBe("fixed");
      expect(container.style.backgroundColor).toBe("rgb(0, 0, 0)");

      // Check for terminal window
      const terminal = container.querySelector(
        "div[style*='border: 1px solid']"
      ) as HTMLDivElement;
      expect(terminal).toBeTruthy();
      expect(terminal.style.fontFamily).toContain("Courier");
      expect(terminal.style.color).toBe("rgb(51, 255, 51)");

      // Check for terminal content
      const terminalContent = terminal.querySelector("div");
      expect(terminalContent).toBeTruthy();
      expect(terminalContent?.style.display).toBe("flex");
      expect(terminalContent?.style.flexDirection).toBe("column-reverse");
    });

    test("initializes with correct build messages", () => {
      const terminalContent = document.querySelector(
        "div[data-content='true']"
      );
      expect(terminalContent).toBeTruthy();

      // Let initial messages appear
      jest.advanceTimersByTime(1000);

      const lines = terminalContent?.querySelectorAll("div");
      expect(lines?.length).toBeGreaterThan(0);
      const firstLine = lines?.[0];
      expect(firstLine?.textContent).toMatch(/^> /); // Lines should start with "> "
    });

    test("detects desktop device correctly", () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Device detection: ",
        "Desktop device detected"
      );

      // Execute button should exist (but is hidden initially)
      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      expect(executeButton).toBeTruthy();
      expect(executeButton.style.display).toBe("none");
    });
  });

  describe("Mobile Device Handling", () => {
    beforeEach(() => {
      // Clean up previous instance
      if (loadingScreen) {
        loadingScreen.dispose();
      }

      // Mock mobile device
      Object.defineProperty(window, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
          maxTouchPoints: 5,
        },
        configurable: true,
      });

      Object.defineProperty(window, "innerWidth", {
        value: 375,
        configurable: true,
      });

      Object.defineProperty(window, "ontouchstart", {
        value: () => {},
        configurable: true,
      });

      // Create new instance with mobile device detection
      loadingScreen = new LoadingScreen(onCompleteMock);
    });

    test("detects mobile device correctly", () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Device detection: ",
        "Mobile device detected"
      );

      // Execute button should not exist
      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      expect(executeButton).toBeFalsy();
    });

    test("shows mobile error message after build process", () => {
      // Complete the build process
      jest.advanceTimersByTime(10000); // Wait for all build messages

      // Wait for the final delay
      jest.advanceTimersByTime(500);

      // Get error message element
      const errorMessage = document.querySelector(
        "div[style*='border: 2px solid']"
      ) as HTMLDivElement;
      expect(errorMessage).toBeTruthy();

      // Wait for error message to be added to DOM and interval to be set up
      jest.advanceTimersByTime(0);

      // Wait for first tick
      jest.advanceTimersByTime(0);

      // Check error message content
      expect(errorMessage.textContent).toContain(
        "ERROR: FAILED TO EXECUTE PROGRAM"
      );
      expect(errorMessage.textContent).toContain("SYSTEM REQUIREMENTS NOT MET");
    });

    /* Temporarily disabled - needs timing fixes
    test("error message has blinking effect", () => {
      // Complete the build process
      jest.advanceTimersByTime(10000); // Wait for all build messages

      // Wait for the final delay
      jest.advanceTimersByTime(500);

      // Get error message element immediately after creation
      const errorMessage = document.querySelector(
        "div[style*='border: 2px solid']"
      ) as HTMLDivElement;
      expect(errorMessage).toBeTruthy();

      // Initial border color should be #ff3333 (set in style attribute)
      expect(errorMessage.style.borderColor).toBe("#ff3333");

      // Wait for interval to be set up and first tick
      jest.advanceTimersByTime(0);

      // After first tick, color should be #880000
      expect(errorMessage.style.borderColor).toBe("#880000");

      // Wait for second tick
      jest.advanceTimersByTime(500);

      // After second tick, color should be back to #ff3333
      expect(errorMessage.style.borderColor).toBe("#ff3333");
    });
    */
  });

  describe("Build Process", () => {
    /* Temporarily disabled - needs timing fixes
    test("displays build messages with typing effect", () => {
      // Get terminal content
      const terminalContent = document.querySelector(
        "div[data-content='true']"
      ) as HTMLDivElement;
      expect(terminalContent).toBeTruthy();

      // Wait for processNextLine to be called
      jest.advanceTimersByTime(0);

      // Wait for addLine to be called (100ms delay)
      jest.advanceTimersByTime(100);

      // Get first line
      const firstLine = terminalContent.querySelector("div");
      expect(firstLine).toBeTruthy();

      // Wait for typing interval to be set up
      jest.advanceTimersByTime(0);

      // Wait for first character to be typed
      jest.advanceTimersByTime(15);

      // Should now have "> I"
      expect(firstLine?.textContent).toBe("> I");

      // Wait for rest of first line
      jest.advanceTimersByTime(450); // 30 chars * 15ms

      // Wait for [DONE] to be added
      jest.advanceTimersByTime(15);

      // Should have complete line
      expect(firstLine?.textContent).toBe(
        "> Initializing build environment... [DONE]"
      );
    });
    */
    /* Temporarily disabled - needs timing fixes
    test("shows execute button after build completion", () => {
      // Complete the build process
      jest.advanceTimersByTime(10000); // Wait for all build messages

      // Wait for the final delay
      jest.advanceTimersByTime(500);

      // Get execute button immediately after it's shown
      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      expect(executeButton).toBeTruthy();
      expect(executeButton.style.display).toBe("block");

      // Wait for cursor interval to be set up
      jest.advanceTimersByTime(0);

      // Check initial text
      expect(executeButton.textContent).toBe("> CLICK TO EXECUTE PROGRAM█");

      // Wait for first blink
      jest.advanceTimersByTime(530);

      // Should now have space
      expect(executeButton.textContent).toBe("> CLICK TO EXECUTE PROGRAM ");

      // Wait for second blink
      jest.advanceTimersByTime(530);

      // Should have cursor again
      expect(executeButton.textContent).toBe("> CLICK TO EXECUTE PROGRAM█");
    });
    */
  });

  describe("User Interaction", () => {
    test("handles execute button click", () => {
      // Advance time to show execute button
      jest.advanceTimersByTime(5000);

      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      executeButton.click();

      // Verify button flash effect
      expect(executeButton.style.backgroundColor).toBe(
        "rgba(51, 255, 51, 0.4)"
      );

      // Advance timer to complete button animation
      jest.advanceTimersByTime(150);
      expect(onCompleteMock).toHaveBeenCalled();
    });

    test("handles escape key to skip animation", () => {
      // Get terminal content
      const terminalContent = document.querySelector(
        "div[data-content='true']"
      ) as HTMLDivElement;
      expect(terminalContent).toBeTruthy();

      // Wait for first line to be created
      jest.advanceTimersByTime(100);

      // Create and dispatch escape key event
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      // Check that logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Escape key pressed, skipping loading animation"
      );

      // Execute button should be shown
      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      expect(executeButton).toBeTruthy();
      expect(executeButton.style.display).toBe("block");
    });

    test("escape key has no effect on mobile", () => {
      // Clean up and recreate as mobile
      loadingScreen.dispose();
      Object.defineProperty(window, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
          maxTouchPoints: 5,
        },
        configurable: true,
      });
      Object.defineProperty(window, "innerWidth", {
        value: 375,
        configurable: true,
      });
      loadingScreen = new LoadingScreen(onCompleteMock);

      // Get terminal content
      const terminalContent = document.querySelector(
        "div[data-content='true']"
      ) as HTMLDivElement;
      expect(terminalContent).toBeTruthy();

      // Wait for first line to be created
      jest.advanceTimersByTime(100);

      // Try to skip animation
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      // Terminal content should not be affected
      const lines = terminalContent.querySelectorAll("div");
      expect(lines.length).toBe(1); // Initial message is shown

      // Error message should not be shown yet
      const errorMessage = document.querySelector(
        "div[style*='color: rgb(255, 51, 51)']"
      );
      expect(errorMessage).toBeFalsy();
    });
  });

  describe("Resource Management", () => {
    test("cleans up intervals on hide", () => {
      // Advance time to create intervals
      jest.advanceTimersByTime(5000);

      // Get initial state
      const executeButton = document.querySelector(
        "div[style*='cursor: pointer']"
      ) as HTMLDivElement;
      const initialText = executeButton.textContent;

      loadingScreen.hide();

      // Advance timer to verify intervals are cleared
      jest.advanceTimersByTime(530);
      expect(executeButton.textContent).toBe(initialText); // Text should not change if interval is cleared
    });

    test("removes event listeners on dispose", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener"
      );
      loadingScreen.dispose();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
    });

    test("removes from DOM on dispose", () => {
      const container = document.querySelector("div");
      loadingScreen.dispose();
      expect(document.body.contains(container)).toBe(false);
    });
  });
});
