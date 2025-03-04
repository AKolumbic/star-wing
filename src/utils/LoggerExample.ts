import { Logger } from "./Logger";

/**
 * Example of how to use the Logger utility.
 * In any file, use this pattern to log messages.
 */
export class LoggerExample {
  // Get a reference to the logger
  private logger = Logger.getInstance();

  constructor() {
    // Different log levels will be treated differently
    this.logger.info("This is an information message");
    this.logger.debug("This message is for debugging");
    this.logger.warn("This is a warning message");
    this.logger.error("This is an error message"); // This will show in production

    // Group related logs together
    this.logger.group("Operation Details", () => {
      this.logger.info("Step 1 completed");
      this.logger.info("Step 2 completed");
      this.logger.debug("Details about step 2", { value: 42 });
    });
  }

  /**
   * Example method showing logging during an operation
   */
  public doSomething(): void {
    this.logger.info("Starting operation");

    try {
      // Simulated operation
      this.logger.debug("Operation details", { status: "in-progress" });

      // Simulated success
      this.logger.info("Operation completed successfully");
    } catch (error) {
      // Errors will always be logged, even in production
      this.logger.error("Operation failed", error);
    }
  }
}
