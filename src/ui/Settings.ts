import { Game } from "../core/Game";

export class Settings {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private game: Game;
  private onCloseCallback: (() => void) | null = null;
  private musicToggle: HTMLDivElement | null = null;

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";
    this.setupStyles();
    this.setupSettings();
    this.hide(); // Initially hidden

    // Add keyboard event listener for ESC key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .settings-container {
        position: relative;
        width: calc(100% - 100px);
        max-width: 800px;
        height: calc(100% - 100px);
        background-color: rgba(0, 0, 0, 0.9);
        border: 2px solid #33ff33;
        border-radius: 5px;
        padding: 20px;
        color: #33ff33;
        font-family: 'PressStart2P', monospace;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 20px rgba(51, 255, 51, 0.3);
      }

      .settings-header {
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        padding-bottom: 10px;
        border-bottom: 1px solid #33ff33;
      }

      .settings-section {
        margin-bottom: 30px;
      }

      .settings-section-title {
        font-size: 18px;
        margin-bottom: 15px;
        text-transform: uppercase;
        position: relative;
      }

      .settings-section-title::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -5px;
        width: 50px;
        height: 2px;
        background-color: #33ff33;
      }

      .settings-option {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        font-size: 14px;
      }

      .settings-label {
        flex: 1;
      }

      .settings-toggle {
        width: 60px;
        height: 30px;
        background-color: #111;
        border: 2px solid #33ff33;
        border-radius: 15px;
        position: relative;
        cursor: pointer;
      }

      .settings-toggle.active::after {
        left: 30px;
      }

      .settings-toggle::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 26px;
        height: 26px;
        background-color: #33ff33;
        border-radius: 50%;
        transition: left 0.2s;
      }
      
      .volume-slider-container {
        display: flex;
        flex-direction: column;
        margin-top: 10px;
      }
      
      .volume-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 20px;
        background: #111;
        border: 2px solid #33ff33;
        border-radius: 10px;
        margin-top: 10px;
        overflow: hidden;
      }
      
      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #33ff33;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: -100vw 0 0 100vw rgba(51, 255, 51, 0.2);
      }
      
      .volume-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #33ff33;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: -100vw 0 0 100vw rgba(51, 255, 51, 0.2);
      }
      
      .volume-value {
        margin-top: 5px;
        text-align: center;
        font-size: 12px;
      }

      .settings-back-button {
        cursor: pointer;
        background-color: #000;
        color: #33ff33;
        border: 2px solid #33ff33;
        padding: 10px 20px;
        font-family: 'PressStart2P', monospace;
        margin-top: auto;
        align-self: center;
        transition: background-color 0.2s;
      }

      .settings-back-button:hover {
        background-color: rgba(51, 255, 51, 0.2);
      }

      /* Digital scan line effect */
      .settings-container::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          rgba(18, 16, 16, 0) 50%, 
          rgba(0, 0, 0, 0.25) 50%
        );
        background-size: 100% 4px;
        z-index: 1005;
        pointer-events: none;
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
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
      <div style="margin-bottom: 8px;"><strong>Movement:</strong></div>
      <div>W / UP ARROW: Move Up</div>
      <div>S / DOWN ARROW: Move Down</div>
      <div>A / LEFT ARROW: Move Left</div>
      <div>D / RIGHT ARROW: Move Right</div>
      <div style="margin-top: 15px; margin-bottom: 8px;"><strong>Combat:</strong></div>
      <div>LEFT MOUSE BUTTON: Fire Primary Weapon</div>
      <div style="margin-top: 15px; margin-bottom: 8px;"><strong>Game Controls:</strong></div>
      <div>ESC: Pause / In-game Menu</div>
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

    this.musicToggle = document.createElement("div");
    this.musicToggle.className =
      "settings-toggle" +
      (!this.game.getAudioManager().getMuteState() ? " active" : "");
    this.musicToggle.addEventListener("click", () => {
      this.game.getAudioManager().toggleMute();
      this.syncMusicToggleState();
    });

    musicOption.appendChild(this.musicToggle);
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

    // Always sync the music toggle state when showing settings
    // This ensures the UI matches the actual audio state
    this.syncMusicToggleState();
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
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.body.removeChild(this.container);
  }

  public setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Synchronizes the music toggle state with the actual mute state
   */
  private syncMusicToggleState(): void {
    if (this.musicToggle) {
      const isMuted = this.game.getAudioManager().getMuteState();
      // Remove the active class first
      this.musicToggle.classList.remove("active");
      // Then add it only if not muted
      if (!isMuted) {
        this.musicToggle.classList.add("active");
      }
    }
  }
}
