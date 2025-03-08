import { TextCrawl } from "../../../src/ui/TextCrawl";
import { Game } from "../../../src/core/Game";
import { Logger } from "../../../src/utils/Logger";

// Mock dependencies
jest.mock("../../../src/core/Game");
jest.mock("../../../src/utils/Logger");

describe("TextCrawl", () => {
  let mockGame: jest.Mocked<Game>;
  let mockLogger: jest.Mocked<Logger>;
  let textCrawl: TextCrawl;

  beforeEach(() => {
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

    // Setup game mock
    mockGame = {} as jest.Mocked<Game>;

    // Enable fake timers
    jest.useFakeTimers();

    // Mock AnimationEvent if not available in test environment
    if (typeof AnimationEvent === "undefined") {
      (global as any).AnimationEvent = class AnimationEvent {
        animationName: string;
        constructor(type: string, options?: { animationName: string }) {
          this.animationName = options?.animationName || "";
        }
      };
    }

    // Create TextCrawl instance
    textCrawl = new TextCrawl(mockGame);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("creates text crawl with correct structure", () => {
      // Check for main container
      const container = document.querySelector(
        ".text-crawl-container"
      ) as HTMLDivElement;
      expect(container).toBeTruthy();
      expect(container.style.display).toBe("none"); // Initially hidden

      // Check for crawl content container
      const crawlContent = container.querySelector(".crawl-content");
      expect(crawlContent).toBeTruthy();

      // Check for title
      const title = crawlContent?.querySelector(".crawl-title");
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe("STAR WING");

      // Check for paragraphs
      const paragraphs = crawlContent?.querySelectorAll(".crawl-paragraph");
      expect(paragraphs?.length).toBe(4);

      // Check for end detector
      const endDetector = crawlContent?.querySelector(
        '[data-end-detector="true"]'
      );
      expect(endDetector).toBeTruthy();
    });

    test("adds styles to document head", () => {
      const styles = document.head.querySelectorAll("style");
      const crawlStyles = Array.from(styles).find((style) =>
        style.textContent?.includes(".text-crawl-container")
      );

      expect(crawlStyles).toBeTruthy();
      expect(crawlStyles?.textContent).toContain("@keyframes scroll");
      expect(crawlStyles?.textContent).toContain(".crawl-content");
      expect(crawlStyles?.textContent).toContain(".crawl-title");
      expect(crawlStyles?.textContent).toContain(".crawl-paragraph");
    });
  });

  describe("Visibility Control", () => {
    test("shows text crawl with animation", () => {
      textCrawl.show();
      const container = document.querySelector(
        ".text-crawl-container"
      ) as HTMLDivElement;
      const content = container.querySelector(
        ".crawl-content"
      ) as HTMLDivElement;

      expect(textCrawl.isTextCrawlVisible()).toBe(true);
      expect(container.style.display).toBe("flex");
      expect(content.style.animation).toContain("scroll 60s linear forwards");
    });

    test("hides text crawl", () => {
      textCrawl.show();
      textCrawl.hide();

      const container = document.querySelector(
        ".text-crawl-container"
      ) as HTMLDivElement;
      expect(textCrawl.isTextCrawlVisible()).toBe(false);
      expect(container.style.display).toBe("none");
    });

    test("ignores show call when already visible", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);
      const firstAnimation = (
        document.querySelector(".crawl-content") as HTMLDivElement
      ).style.animation;

      textCrawl.show(jest.fn()); // Try to show again
      const secondAnimation = (
        document.querySelector(".crawl-content") as HTMLDivElement
      ).style.animation;

      expect(firstAnimation).toBe(secondAnimation);
      expect(mockCallback).not.toHaveBeenCalled(); // Callback shouldn't be called yet
    });
  });

  describe("Animation and Callbacks", () => {
    test("executes callback when animation ends", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);

      // Create a custom event that mimics an animation end event
      const event = new Event("animationend");
      Object.defineProperty(event, "animationName", { value: "scroll" });

      // Trigger animation end
      const content = document.querySelector(
        ".crawl-content"
      ) as HTMLDivElement;
      content.dispatchEvent(event);

      // Fast-forward through the callback delay
      jest.advanceTimersByTime(1000);

      expect(mockCallback).toHaveBeenCalled();
      expect(textCrawl.isTextCrawlVisible()).toBe(false);
    });

    test("executes callback when all text has passed", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);

      // Mock getBoundingClientRect to simulate text passing terminal border
      const endDetector = document.querySelector(
        '[data-end-detector="true"]'
      ) as HTMLElement;
      jest.spyOn(endDetector, "getBoundingClientRect").mockReturnValue({
        bottom: 0, // Above the terminal border
        top: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Advance timers to trigger position check
      jest.advanceTimersByTime(100);

      // Fast-forward through the callback delay
      jest.advanceTimersByTime(1000);

      expect(mockCallback).toHaveBeenCalled();
      expect(textCrawl.isTextCrawlVisible()).toBe(false);
    });
  });

  describe("Skip Functionality", () => {
    test.each([["Escape"], [" "], ["Enter"]])(
      "skips animation when %s key is pressed",
      (key) => {
        const mockCallback = jest.fn();
        textCrawl.show(mockCallback);

        // Simulate key press
        document.dispatchEvent(new KeyboardEvent("keydown", { key }));

        // Fast-forward through the callback delay
        jest.advanceTimersByTime(1000);

        expect(mockCallback).toHaveBeenCalled();
        expect(textCrawl.isTextCrawlVisible()).toBe(false);
      }
    );

    test("ignores other keys", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);

      // Get initial state
      expect(textCrawl.isTextCrawlVisible()).toBe(true);

      // Simulate pressing a different key
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));

      // Verify callback wasn't called and text crawl is still visible
      expect(mockCallback).not.toHaveBeenCalled();
      expect(textCrawl.isTextCrawlVisible()).toBe(true);
    });
  });

  describe("Resource Management", () => {
    test("cleans up resources on dispose", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);

      const container = document.querySelector(".text-crawl-container");
      expect(container).toBeTruthy();

      textCrawl.dispose();

      // Container should be removed from DOM
      expect(document.body.contains(container)).toBe(false);

      // Event listeners should be cleaned up (test by trying to skip)
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      jest.advanceTimersByTime(1000);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test("handles multiple dispose calls gracefully", () => {
      textCrawl.dispose();
      expect(() => textCrawl.dispose()).not.toThrow();
    });
  });

  describe("Logger Integration", () => {
    test("logs show operation with callback status", () => {
      const mockCallback = jest.fn();
      textCrawl.show(mockCallback);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "TextCrawl: Starting text crawl with callback:",
        true
      );
    });

    test("logs animation end and cleanup", () => {
      textCrawl.show();

      // Create a custom event that mimics an animation end event
      const event = new Event("animationend");
      Object.defineProperty(event, "animationName", { value: "scroll" });

      // Trigger animation end
      const content = document.querySelector(
        ".crawl-content"
      ) as HTMLDivElement;
      content.dispatchEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "TextCrawl: Animation ended naturally (fallback), cleaning up and executing callback"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "TextCrawl: Removed all event listeners"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "TextCrawl: Finished cleanup after animation"
      );
    });
  });
});
