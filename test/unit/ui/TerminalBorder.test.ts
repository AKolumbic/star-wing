import { TerminalBorder } from "../../../src/ui/TerminalBorder";
import { Logger } from "../../../src/utils/Logger";

// Mock dependencies
jest.mock("../../../src/utils/Logger");

describe("TerminalBorder", () => {
  let mockLogger: jest.Mocked<Logger>;
  let terminalBorder: TerminalBorder;

  beforeEach(() => {
    // Reset singleton instance between tests
    (TerminalBorder as any).instance = null;

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

    // Get fresh instance
    terminalBorder = TerminalBorder.getInstance();
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    test("returns the same instance when getInstance is called multiple times", () => {
      const instance1 = TerminalBorder.getInstance();
      const instance2 = TerminalBorder.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("Initialization", () => {
    test("initializes only once", () => {
      terminalBorder.initialize();
      const firstContainer = document.querySelector(
        ".terminal-border-container"
      );

      // Try to initialize again
      terminalBorder.initialize();
      const containers = document.querySelectorAll(
        ".terminal-border-container"
      );

      expect(containers.length).toBe(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Initializing..."
      );
    });

    test("creates container with correct styles", () => {
      terminalBorder.initialize();
      const container = document.querySelector(
        ".terminal-border-container"
      ) as HTMLDivElement;

      expect(container).toBeTruthy();
      expect(container.style.position).toBe("fixed");
      expect(container.style.top).toBe("0px");
      expect(container.style.left).toBe("0px");
      expect(container.style.width).toBe("100%");
      expect(container.style.height).toBe("100%");
      expect(container.style.pointerEvents).toBe("none");
      expect(container.style.zIndex).toBe("9999");
    });

    test("creates all visual elements", () => {
      terminalBorder.initialize();
      const container = document.querySelector(".terminal-border-container");

      // Check frame
      const frame = container?.querySelector(".terminal-frame");
      expect(frame).toBeTruthy();

      // Check scanlines
      const scanlines = container?.querySelector(".terminal-scanlines");
      expect(scanlines).toBeTruthy();

      // Check glare effect
      const glare = container?.querySelector(".terminal-glare");
      expect(glare).toBeTruthy();

      // Check screws (all 4 corners)
      const screws = container?.querySelectorAll(".terminal-screw");
      expect(screws?.length).toBe(4);
      expect(container?.querySelector(".terminal-screw-tl")).toBeTruthy();
      expect(container?.querySelector(".terminal-screw-tr")).toBeTruthy();
      expect(container?.querySelector(".terminal-screw-bl")).toBeTruthy();
      expect(container?.querySelector(".terminal-screw-br")).toBeTruthy();

      // Check power button and LED
      const powerButton = container?.querySelector(".terminal-power-button");
      expect(powerButton).toBeTruthy();
      expect(powerButton?.querySelector(".terminal-power-led")).toBeTruthy();
    });

    test("adds styles to document head", () => {
      terminalBorder.initialize();
      const styles = document.head.querySelectorAll("style");
      const terminalStyles = Array.from(styles).find((style) =>
        style.textContent?.includes(".terminal-border-container")
      );

      expect(terminalStyles).toBeTruthy();
      expect(terminalStyles?.textContent).toContain(".terminal-frame");
      expect(terminalStyles?.textContent).toContain(".terminal-scanlines");
      expect(terminalStyles?.textContent).toContain(".terminal-glare");
      expect(terminalStyles?.textContent).toContain(".terminal-screw");
      expect(terminalStyles?.textContent).toContain(".terminal-power-button");
      expect(terminalStyles?.textContent).toContain(
        "@keyframes terminal-blink"
      );
    });
  });

  describe("Resource Management", () => {
    test("cleans up resources on dispose when initialized", () => {
      terminalBorder.initialize();
      const container = document.querySelector(".terminal-border-container");
      expect(container).toBeTruthy();

      terminalBorder.dispose();

      // Container should be removed from DOM
      expect(document.body.contains(container)).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Disposing..."
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Removing container from DOM"
      );
      expect(mockLogger.info).toHaveBeenCalledWith("[TerminalBorder] Disposed");
    });

    test("handles dispose gracefully when not initialized", () => {
      terminalBorder.dispose();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    test("can be reinitialized after disposal", () => {
      terminalBorder.initialize();
      terminalBorder.dispose();
      terminalBorder.initialize();

      const container = document.querySelector(".terminal-border-container");
      expect(container).toBeTruthy();
    });
  });

  describe("Logger Integration", () => {
    test("logs initialization steps", () => {
      terminalBorder.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Initializing..."
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Initialized, container:",
        expect.any(HTMLDivElement)
      );
    });

    test("logs disposal steps", () => {
      terminalBorder.initialize();
      terminalBorder.dispose();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Disposing..."
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[TerminalBorder] Removing container from DOM"
      );
      expect(mockLogger.info).toHaveBeenCalledWith("[TerminalBorder] Disposed");
    });
  });
});
