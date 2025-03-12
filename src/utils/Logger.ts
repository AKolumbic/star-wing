/**
 * Logger utility for consistent logging across the application.
 * In production builds, most logs will be stripped by the build process.
 * This class provides a common interface for logging throughout the app.
 */

// LogLevel enum to control logging verbosity
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static instance: Logger;
  private isProduction: boolean;
  // Default log level is INFO
  private globalLogLevel: LogLevel = LogLevel.INFO;
  // Component-specific log levels to control verbosity per component
  private componentLogLevels: Map<string, LogLevel> = new Map();

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    // Check if we're in production mode
    // In Vite, we can use the define option to expose environment variables
    // The __APP_ENV__ variable is defined in vite.config.ts
    this.isProduction =
      typeof __APP_ENV__ !== "undefined" && __APP_ENV__ === "production";

    // Set up default component log levels
    this.setupDefaultComponentLogLevels();

    // Output initial message about logger state
    this.info(
      `Logger initialized in ${
        this.isProduction ? "PRODUCTION" : "DEVELOPMENT"
      } mode`
    );
  }

  /**
   * Sets up default log levels for specific components to reduce noise
   */
  private setupDefaultComponentLogLevels(): void {
    // Lower log level for noisy components
    this.componentLogLevels.set("ToneContextManager", LogLevel.WARN);
    this.componentLogLevels.set("ToneMusicPlayer", LogLevel.INFO);
    this.componentLogLevels.set("Menu", LogLevel.INFO);
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
   * Sets the global log level
   * @param level The log level to set
   */
  public setGlobalLogLevel(level: LogLevel): void {
    this.globalLogLevel = level;
  }

  /**
   * Sets a component-specific log level
   * @param componentName The name of the component
   * @param level The log level to set
   */
  public setComponentLogLevel(componentName: string, level: LogLevel): void {
    this.componentLogLevels.set(componentName, level);
  }

  /**
   * Gets the log level for a component
   * @param message The log message (used to extract component name)
   * @returns The log level for the component
   */
  private getComponentLogLevel(message: string): LogLevel {
    // Try to extract component name from message (format: "ComponentName: Message")
    const colonIndex = message.indexOf(":");
    if (colonIndex > 0) {
      const componentName = message.substring(0, colonIndex).trim();
      const componentLevel = this.componentLogLevels.get(componentName);
      if (componentLevel !== undefined) {
        return componentLevel;
      }
    }
    return this.globalLogLevel;
  }

  /**
   * Formats the current timestamp with millisecond precision
   * @returns Formatted timestamp string in [HH:MM:SS.mmm] format
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
  }

  /**
   * Logs an informational message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public info(message: string, ...optionalParams: any[]): void {
    if (
      !this.isProduction &&
      this.getComponentLogLevel(message) >= LogLevel.INFO
    ) {
      console.info(
        `${this.getTimestamp()} [INFO] ${message}`,
        ...optionalParams
      );
    }
  }

  /**
   * Logs a debug message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public debug(message: string, ...optionalParams: any[]): void {
    if (
      !this.isProduction &&
      this.getComponentLogLevel(message) >= LogLevel.DEBUG
    ) {
      console.debug(
        `${this.getTimestamp()} [DEBUG] ${message}`,
        ...optionalParams
      );
    }
  }

  /**
   * Logs a warning message.
   * These will be stripped in production builds.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public warn(message: string, ...optionalParams: any[]): void {
    if (
      !this.isProduction &&
      this.getComponentLogLevel(message) >= LogLevel.WARN
    ) {
      console.warn(
        `${this.getTimestamp()} [WARN] ${message}`,
        ...optionalParams
      );
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
    console.error(
      `${this.getTimestamp()} [ERROR] ${message}`,
      ...optionalParams
    );
  }

  /**
   * Logs a group of related messages.
   * These will be stripped in production builds.
   * @param label The group label
   * @param logFn Function that contains the logs to group
   */
  public group(label: string, logFn: () => void): void {
    if (
      !this.isProduction &&
      this.getComponentLogLevel(label) >= LogLevel.INFO
    ) {
      console.group(`${this.getTimestamp()} [GROUP] ${label}`);
      logFn();
      console.groupEnd();
    }
  }
}
