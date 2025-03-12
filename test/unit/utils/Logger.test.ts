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
        expect.stringMatching(
          /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] Logger initialized in DEVELOPMENT mode/
        )
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
      const lastCall =
        consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] Test info message/
      );
      expect(lastCall[1]).toEqual({ data: 123 });
    });

    test("logs debug messages", () => {
      logger.debug("Test debug message", { data: 456 });
      const lastCall =
        consoleDebugSpy.mock.calls[consoleDebugSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[DEBUG\] Test debug message/
      );
      expect(lastCall[1]).toEqual({ data: 456 });
    });

    test("logs warning messages", () => {
      logger.warn("Test warning message", { data: 789 });
      const lastCall =
        consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[WARN\] Test warning message/
      );
      expect(lastCall[1]).toEqual({ data: 789 });
    });

    test("logs error messages", () => {
      const testError = new Error("Test error");
      logger.error("Test error message", testError);
      const lastCall =
        consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[ERROR\] Test error message/
      );
      expect(lastCall[1]).toBe(testError);
    });

    test("handles group logging", () => {
      logger.group("Test Group", () => {
        logger.info("Test group message");
      });

      expect(consoleGroupSpy.mock.calls[0][0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[GROUP\] Test Group/
      );
      const infoCallIndex = consoleInfoSpy.mock.calls.findIndex((call) =>
        call[0].includes("[INFO] Test group message")
      );
      expect(infoCallIndex).toBeGreaterThan(-1);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    test("handles multiple parameters in log methods", () => {
      const params = [123, "test", { key: "value" }];
      logger.info("Multiple params", ...params);

      const lastCall =
        consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] Multiple params/
      );
      expect(lastCall[1]).toBe(123);
      expect(lastCall[2]).toBe("test");
      expect(lastCall[3]).toEqual({ key: "value" });
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
      const lastCall =
        consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[ERROR\] Test error message/
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
      const lastCall =
        consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] Message without params/
      );
    });

    test("handles empty message", () => {
      logger.info("");
      const lastCall =
        consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(/\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] /);
    });

    test("handles null and undefined in optional parameters", () => {
      logger.info("Test message", null, undefined);
      const lastCall =
        consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] Test message/
      );
      expect(lastCall[1]).toBeNull();
      expect(lastCall[2]).toBeUndefined();
    });

    test("handles nested group calls", () => {
      logger.group("Outer Group", () => {
        logger.info("Outer message");
        logger.group("Inner Group", () => {
          logger.info("Inner message");
        });
      });

      const groupCalls = consoleGroupSpy.mock.calls;
      expect(groupCalls[0][0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[GROUP\] Outer Group/
      );
      expect(groupCalls[1][0]).toMatch(
        /\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[GROUP\] Inner Group/
      );

      const infoCalls = consoleInfoSpy.mock.calls;
      const outerMsgIndex = infoCalls.findIndex((call) =>
        call[0].includes("[INFO] Outer message")
      );
      const innerMsgIndex = infoCalls.findIndex((call) =>
        call[0].includes("[INFO] Inner message")
      );

      expect(outerMsgIndex).toBeGreaterThan(-1);
      expect(innerMsgIndex).toBeGreaterThan(-1);
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(2);
    });
  });
});
