import { Logger } from "../../../src/utils/Logger";

describe("Logger", () => {
  let logger: Logger;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleGroupSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (Logger as any).instance = undefined;

    // Spy on console methods
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleGroupSpy = jest.spyOn(console, "group").mockImplementation();
    consoleGroupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation();

    // Get logger instance
    logger = Logger.getInstance();
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    test("creates only one instance", () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    test("initializes with correct environment message", () => {
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[INFO] Logger initialized in DEVELOPMENT mode"
      );
    });
  });

  describe("Development Mode Logging", () => {
    beforeEach(() => {
      // Ensure we're in development mode
      (global as any).__APP_ENV__ = "development";
    });

    test("logs info messages", () => {
      logger.info("Test info message", { data: 123 });
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] Test info message", {
        data: 123,
      });
    });

    test("logs debug messages", () => {
      logger.debug("Test debug message", { data: 456 });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        "[DEBUG] Test debug message",
        { data: 456 }
      );
    });

    test("logs warning messages", () => {
      logger.warn("Test warning message", { data: 789 });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[WARN] Test warning message",
        { data: 789 }
      );
    });

    test("logs error messages", () => {
      logger.error("Test error message", new Error("Test error"));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] Test error message",
        new Error("Test error")
      );
    });

    test("handles group logging", () => {
      logger.group("Test Group", () => {
        logger.info("Test group message");
      });

      expect(consoleGroupSpy).toHaveBeenCalledWith("[GROUP] Test Group");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] Test group message");
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    test("handles multiple parameters in log methods", () => {
      const params = [123, "test", { key: "value" }];
      logger.info("Multiple params", ...params);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[INFO] Multiple params",
        ...params
      );
    });
  });

  describe("Production Mode Logging", () => {
    beforeEach(() => {
      // Reset the singleton instance
      (Logger as any).instance = undefined;
      // Set production mode
      (global as any).__APP_ENV__ = "production";
      // Get new logger instance in production mode
      logger = Logger.getInstance();
      // Clear initialization message
      jest.clearAllMocks();
    });

    test("does not log info messages", () => {
      logger.info("Test info message");
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    test("does not log debug messages", () => {
      logger.debug("Test debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    test("does not log warning messages", () => {
      logger.warn("Test warning message");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test("still logs error messages", () => {
      logger.error("Test error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] Test error message"
      );
    });

    test("does not execute group logging", () => {
      logger.group("Test Group", () => {
        logger.info("Test group message");
      });

      expect(consoleGroupSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleGroupEndSpy).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      // Reset the singleton instance
      (Logger as any).instance = undefined;
      // Ensure we're in development mode
      (global as any).__APP_ENV__ = "development";
      // Get new logger instance
      logger = Logger.getInstance();
      // Clear initialization message
      jest.clearAllMocks();
    });

    test("handles undefined optional parameters", () => {
      logger.info("Message without params");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[INFO] Message without params"
      );
    });

    test("handles empty message", () => {
      logger.info("");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] ");
    });

    test("handles null and undefined in optional parameters", () => {
      logger.info("Test message", null, undefined);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[INFO] Test message",
        null,
        undefined
      );
    });

    test("handles nested group calls", () => {
      logger.group("Outer Group", () => {
        logger.info("Outer message");
        logger.group("Inner Group", () => {
          logger.info("Inner message");
        });
      });

      expect(consoleGroupSpy).toHaveBeenCalledWith("[GROUP] Outer Group");
      expect(consoleGroupSpy).toHaveBeenCalledWith("[GROUP] Inner Group");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] Outer message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] Inner message");
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(2);
    });
  });
});
