/**
 * Logger utility for consistent logging across the application.
 * In production builds, most logs will be stripped by the build process.
 * This class provides a common interface for logging throughout the app.
 */
export class Logger {
  private static instance: Logger;
  private isProduction: boolean;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    // Check if we're in production mode
    // In Vite, we can use the define option to expose environment variables
    // The __APP_ENV__ variable is defined in vite.config.ts
    this.isProduction =
      typeof __APP_ENV__ !== "undefined" && __APP_ENV__ === "production";

    // Output initial message about logger state
    this.info(
      `Logger initialized in ${
        this.isProduction ? "PRODUCTION" : "DEVELOPMENT"
      } mode`
    );
  }

  /**
   * Gets the singleton instance of the logger.
   * @returns The logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Logs an informational message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public info(message: string, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs a debug message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public debug(message: string, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs a warning message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public warn(message: string, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs an error message.
   * These will NOT be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public error(message: string, ...optionalParams: any[]): void {
    // We always log errors, even in production
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }

  /**
   * Logs a group of related messages.
   * These will be stripped in production builds.
   * @param label The group label
   * @param logFn Function that contains the logs to group
   */
  public group(label: string, logFn: () => void): void {
    if (!this.isProduction) {
      console.group(`[GROUP] ${label}`);
      logFn();
      console.groupEnd();
    }
  }
}
