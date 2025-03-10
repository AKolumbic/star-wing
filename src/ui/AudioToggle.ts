/**
 * AudioToggle - A simple UI control to toggle between audio implementations
 * This allows for A/B testing between the original Web Audio API and Tone.js implementations
 */
import { AudioConfig } from "../audio/config";
import { AudioManagerFactory } from "../audio/AudioManagerFactory";
import { Logger } from "../utils/Logger";

export class AudioToggle {
  /** UI elements */
  private container!: HTMLElement;
  private toggleButton!: HTMLButtonElement;
  private statusLabel!: HTMLElement;
  private feedbackButton!: HTMLButtonElement;

  /** Current implementation */
  private usingToneJs: boolean;

  /** Logger */
  private logger = Logger.getInstance();

  /** Instance */
  private static instance: AudioToggle;

  private constructor() {
    this.usingToneJs = AudioConfig.useToneJs;
    this.createUI();
    this.updateStatus();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioToggle {
    if (!AudioToggle.instance) {
      AudioToggle.instance = new AudioToggle();
    }
    return AudioToggle.instance;
  }

  /**
   * Initializes the toggle component
   */
  public initialize(): void {
    // Add the toggle to the DOM
    document.body.appendChild(this.container);

    // Add event listeners
    this.toggleButton.addEventListener("click", () => this.toggle());
    this.feedbackButton.addEventListener("click", () =>
      this.showFeedbackForm()
    );
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Create elements
    this.container = document.createElement("div");
    this.toggleButton = document.createElement("button");
    this.statusLabel = document.createElement("span");
    this.feedbackButton = document.createElement("button");

    // Style container
    this.container.style.position = "fixed";
    this.container.style.bottom = "20px";
    this.container.style.right = "20px";
    this.container.style.padding = "10px";
    this.container.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.container.style.color = "white";
    this.container.style.borderRadius = "5px";
    this.container.style.zIndex = "1000";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.gap = "10px";

    // Style toggle button
    this.toggleButton.textContent = "Switch Audio Engine";
    this.toggleButton.style.padding = "8px 12px";
    this.toggleButton.style.backgroundColor = "#4CAF50";
    this.toggleButton.style.color = "white";
    this.toggleButton.style.border = "none";
    this.toggleButton.style.borderRadius = "4px";
    this.toggleButton.style.cursor = "pointer";

    // Style feedback button
    this.feedbackButton.textContent = "Give Feedback";
    this.feedbackButton.style.padding = "5px 10px";
    this.feedbackButton.style.backgroundColor = "#2196F3";
    this.feedbackButton.style.color = "white";
    this.feedbackButton.style.border = "none";
    this.feedbackButton.style.borderRadius = "4px";
    this.feedbackButton.style.cursor = "pointer";

    // Style status label
    this.statusLabel.style.fontSize = "14px";
    this.statusLabel.style.fontFamily = "monospace";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Audio A/B Testing";
    title.style.margin = "0 0 10px 0";
    title.style.fontSize = "16px";

    // Assemble container
    this.container.appendChild(title);
    this.container.appendChild(this.statusLabel);
    this.container.appendChild(this.toggleButton);
    this.container.appendChild(this.feedbackButton);
  }

  /**
   * Update the status label
   */
  private updateStatus(): void {
    this.usingToneJs = AudioConfig.useToneJs;
    this.statusLabel.textContent = `Current: ${
      this.usingToneJs ? "Tone.js" : "Web Audio API"
    }`;

    // Update toggle button color
    this.toggleButton.style.backgroundColor = this.usingToneJs
      ? "#4CAF50"
      : "#FF9800";
  }

  /**
   * Toggle between implementations
   */
  private toggle(): void {
    this.logger.info(
      `AudioToggle: Switching from ${
        this.usingToneJs ? "Tone.js" : "Web Audio API"
      } to ${this.usingToneJs ? "Web Audio API" : "Tone.js"}`
    );

    // Use AudioManagerFactory to switch implementations
    AudioManagerFactory.switchImplementation(!this.usingToneJs);

    // Update UI
    this.updateStatus();

    // Show feedback dialog
    this.showFeedbackPrompt();
  }

  /**
   * Show a prompt for feedback after toggling
   */
  private showFeedbackPrompt(): void {
    const prompt = document.createElement("div");
    prompt.style.position = "fixed";
    prompt.style.top = "20px";
    prompt.style.left = "50%";
    prompt.style.transform = "translateX(-50%)";
    prompt.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    prompt.style.color = "white";
    prompt.style.padding = "15px";
    prompt.style.borderRadius = "5px";
    prompt.style.zIndex = "1100";
    prompt.textContent = `Now using ${
      this.usingToneJs ? "Tone.js" : "Web Audio API"
    } implementation. Notice any differences?`;

    document.body.appendChild(prompt);

    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(prompt);
    }, 3000);
  }

  /**
   * Show a feedback form
   */
  private showFeedbackForm(): void {
    // Create modal container
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "2000";

    // Create form container
    const form = document.createElement("div");
    form.style.backgroundColor = "white";
    form.style.padding = "20px";
    form.style.borderRadius = "5px";
    form.style.width = "80%";
    form.style.maxWidth = "500px";
    form.style.maxHeight = "80%";
    form.style.overflow = "auto";

    // Create title
    const title = document.createElement("h2");
    title.textContent = "Audio Engine Feedback";
    title.style.marginTop = "0";

    // Create implementation info
    const info = document.createElement("p");
    info.textContent = `Current implementation: ${
      this.usingToneJs ? "Tone.js" : "Web Audio API"
    }`;

    // Create feedback textarea
    const textareaLabel = document.createElement("label");
    textareaLabel.textContent = "Your feedback:";
    textareaLabel.style.display = "block";
    textareaLabel.style.marginTop = "15px";

    const textarea = document.createElement("textarea");
    textarea.style.width = "100%";
    textarea.style.height = "100px";
    textarea.style.marginTop = "5px";
    textarea.style.padding = "8px";
    textarea.style.boxSizing = "border-box";

    // Create rating section
    const ratingLabel = document.createElement("label");
    ratingLabel.textContent = "Rate audio quality (1-5):";
    ratingLabel.style.display = "block";
    ratingLabel.style.marginTop = "15px";

    const ratingContainer = document.createElement("div");
    ratingContainer.style.display = "flex";
    ratingContainer.style.gap = "10px";
    ratingContainer.style.marginTop = "5px";

    for (let i = 1; i <= 5; i++) {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "rating";
      radio.value = i.toString();
      radio.id = `rating-${i}`;
      radio.style.cursor = "pointer";

      const label = document.createElement("label");
      label.htmlFor = `rating-${i}`;
      label.textContent = i.toString();
      label.style.cursor = "pointer";

      const wrapper = document.createElement("div");
      wrapper.appendChild(radio);
      wrapper.appendChild(label);

      ratingContainer.appendChild(wrapper);
    }

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "20px";

    // Create cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "8px 15px";
    cancelButton.style.backgroundColor = "#f44336";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";

    // Create submit button
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.style.padding = "8px 15px";
    submitButton.style.backgroundColor = "#4CAF50";
    submitButton.style.color = "white";
    submitButton.style.border = "none";
    submitButton.style.borderRadius = "4px";
    submitButton.style.cursor = "pointer";

    // Add event listeners
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    submitButton.addEventListener("click", () => {
      // Get selected rating
      const selectedRating = document.querySelector(
        'input[name="rating"]:checked'
      ) as HTMLInputElement;
      const rating = selectedRating ? selectedRating.value : "Not provided";

      // Get feedback text
      const feedbackText = textarea.value;

      // Log feedback
      this.logger.info(
        `AudioToggle: Feedback for ${
          this.usingToneJs ? "Tone.js" : "Web Audio API"
        } - Rating: ${rating}, Feedback: ${feedbackText}`
      );

      // In a real implementation, this would be sent to a server
      // For now, we'll just log it

      // Remove modal
      document.body.removeChild(modal);

      // Show thank you message
      this.showThankYouMessage();
    });

    // Assemble form
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);

    form.appendChild(title);
    form.appendChild(info);
    form.appendChild(textareaLabel);
    form.appendChild(textarea);
    form.appendChild(ratingLabel);
    form.appendChild(ratingContainer);
    form.appendChild(buttonContainer);

    modal.appendChild(form);
    document.body.appendChild(modal);
  }

  /**
   * Show a thank you message after submitting feedback
   */
  private showThankYouMessage(): void {
    const message = document.createElement("div");
    message.style.position = "fixed";
    message.style.top = "20px";
    message.style.left = "50%";
    message.style.transform = "translateX(-50%)";
    message.style.backgroundColor = "#4CAF50";
    message.style.color = "white";
    message.style.padding = "15px";
    message.style.borderRadius = "5px";
    message.style.zIndex = "1100";
    message.textContent = "Thanks for your feedback!";

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(message);
    }, 3000);
  }
}

// Export a function to initialize the toggle
export function initializeAudioToggle(): void {
  const toggle = AudioToggle.getInstance();
  toggle.initialize();
}
