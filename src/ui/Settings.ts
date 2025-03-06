import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";
import { StyleManager } from "../styles/StyleManager";
import { settingsStyles } from "../styles/SettingsStyles";

export class Settings {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private game: Game;
  private onCloseCallback: (() => void) | null = null;
  private logger = Logger.getInstance();

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";

    // Apply styles
    StyleManager.applyStyles("settings", settingsStyles);

    this.setupSettings();
    this.hide(); // Initially hidden

    // Add keyboard event listener for ESC key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private setupSettings(): void {
    // Create settings container
    const settingsContainer = document.createElement("div");
    settingsContainer.className = "settings-container";

    // Header
    const header = document.createElement("div");
    header.className = "settings-header";
    header.textContent = "SETTINGS";
    settingsContainer.appendChild(header);

    // Controls Section
    const controlsSection = document.createElement("div");
    controlsSection.className = "settings-section";

    const controlsTitle = document.createElement("div");
    controlsTitle.className = "settings-section-title";
    controlsTitle.textContent = "Controls";
    controlsSection.appendChild(controlsTitle);

    const controlsInfo = document.createElement("div");
    controlsInfo.style.marginTop = "15px";
    controlsInfo.innerHTML = `
      <div>ARROW KEYS: Move ship</div>
      <div>SPACE: Fire weapons</div>
      <div>ESC: Pause game</div>
    `;
    controlsSection.appendChild(controlsInfo);

    settingsContainer.appendChild(controlsSection);

    // Audio Section
    const audioSection = document.createElement("div");
    audioSection.className = "settings-section";

    const audioTitle = document.createElement("div");
    audioTitle.className = "settings-section-title";
    audioTitle.textContent = "Audio";
    audioSection.appendChild(audioTitle);

    // Music toggle
    const musicOption = document.createElement("div");
    musicOption.className = "settings-option";

    const musicLabel = document.createElement("div");
    musicLabel.className = "settings-label";
    musicLabel.textContent = "Music";
    musicOption.appendChild(musicLabel);

    const musicToggle = document.createElement("div");
    musicToggle.className =
      "settings-toggle" +
      (!this.game.getAudioManager().getMuteState() ? " active" : "");
    musicToggle.addEventListener("click", () => {
      this.game.getAudioManager().toggleMute();
      musicToggle.classList.toggle("active");
    });

    musicOption.appendChild(musicToggle);
    audioSection.appendChild(musicOption);

    // Volume slider
    const volumeOption = document.createElement("div");
    volumeOption.className = "settings-option";

    const volumeLabel = document.createElement("div");
    volumeLabel.className = "settings-label";
    volumeLabel.textContent = "Volume";
    volumeOption.appendChild(volumeLabel);

    // Create slider container
    const volumeSliderContainer = document.createElement("div");
    volumeSliderContainer.className = "volume-slider-container";

    // Create slider
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "100";
    volumeSlider.className = "volume-slider";

    // Get the current volume and set the slider value
    const currentVolume = this.game.getAudioManager().getVolume();
    volumeSlider.value = (currentVolume * 100).toString();

    // Create volume value display
    const volumeValue = document.createElement("div");
    volumeValue.className = "volume-value";
    volumeValue.textContent = `${Math.round(currentVolume * 100)}%`;

    // Add event listener
    volumeSlider.addEventListener("input", (event) => {
      const newVolume =
        parseInt((event.target as HTMLInputElement).value) / 100;
      // Update volume
      this.game.getAudioManager().setVolume(newVolume);
      // Update volume value display
      volumeValue.textContent = `${Math.round(newVolume * 100)}%`;
    });

    // Add slider and value to container
    volumeSliderContainer.appendChild(volumeSlider);
    volumeSliderContainer.appendChild(volumeValue);

    // Add to volume option
    volumeOption.appendChild(volumeSliderContainer);

    // Add to audio section
    audioSection.appendChild(volumeOption);

    settingsContainer.appendChild(audioSection);

    // Back button
    const backButton = document.createElement("button");
    backButton.className = "settings-back-button";
    backButton.textContent = "BACK TO MENU";
    backButton.addEventListener("click", () => {
      this.hide(); // This will trigger the onCloseCallback
    });

    settingsContainer.appendChild(backButton);

    // Add to container
    this.container.appendChild(settingsContainer);
    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.display = "none";
    this.isVisible = false;

    // Call the callback if provided
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  isSettingsVisible(): boolean {
    return this.isVisible;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    if (event.key === "Escape") {
      this.hide();
    }
  }

  dispose(): void {
    // Remove styles
    StyleManager.removeStyles("settings");

    document.removeEventListener("keydown", this.handleKeyDown.bind(this));

    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.logger.info("Settings: Disposed");
  }

  public setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }
}
