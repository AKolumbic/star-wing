import { Settings } from "../../../src/ui/Settings";
import { Game } from "../../../src/core/Game";
import { AudioManager } from "../../../src/audio/AudioManager";

// Mock dependencies
jest.mock("../../../src/core/Game");
jest.mock("../../../src/audio/AudioManager");

describe("Settings", () => {
  let mockGame: jest.Mocked<Game>;
  let mockAudioManager: jest.Mocked<AudioManager>;
  let settings: Settings;

  beforeEach(() => {
    // Setup AudioManager mock
    mockAudioManager = {
      getMuteState: jest.fn().mockReturnValue(false),
      toggleMute: jest.fn(),
      getVolume: jest.fn().mockReturnValue(0.5),
      setVolume: jest.fn(),
    } as unknown as jest.Mocked<AudioManager>;

    // Setup Game mock
    mockGame = {
      getAudioManager: jest.fn().mockReturnValue(mockAudioManager),
    } as unknown as jest.Mocked<Game>;

    // Create Settings instance
    settings = new Settings(mockGame);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("creates settings with correct structure", () => {
      // Check for main container
      const container = document.querySelector(
        ".terminal-overlay"
      ) as HTMLDivElement;
      expect(container).toBeTruthy();
      expect(container.className).toBe("terminal-overlay");

      // Check for settings container
      const settingsContainer = container.querySelector(".settings-container");
      expect(settingsContainer).toBeTruthy();

      // Check for header
      const header = settingsContainer?.querySelector(".settings-header");
      expect(header).toBeTruthy();
      expect(header?.textContent).toBe("SETTINGS");

      // Check for controls section
      const controlsSection =
        settingsContainer?.querySelector(".settings-section");
      expect(controlsSection).toBeTruthy();
      const controlsTitle = controlsSection?.querySelector(
        ".settings-section-title"
      );
      expect(controlsTitle?.textContent).toBe("Controls");

      // Check for audio section
      const audioSection =
        settingsContainer?.querySelectorAll(".settings-section")[1];
      expect(audioSection).toBeTruthy();
      const audioTitle = audioSection?.querySelector(".settings-section-title");
      expect(audioTitle?.textContent).toBe("Audio");

      // Check for back button
      const backButton = settingsContainer?.querySelector(
        ".settings-back-button"
      );
      expect(backButton).toBeTruthy();
      expect(backButton?.textContent).toBe("BACK TO MENU");
    });

    test("initializes with correct audio state", () => {
      const musicToggle = document.querySelector(".settings-toggle");
      expect(musicToggle).toBeTruthy();
      expect(musicToggle?.classList.contains("active")).toBe(true);

      const volumeSlider = document.querySelector(
        ".volume-slider"
      ) as HTMLInputElement;
      expect(volumeSlider).toBeTruthy();
      expect(volumeSlider?.value).toBe("50"); // 0.5 * 100

      const volumeValue = document.querySelector(".volume-value");
      expect(volumeValue?.textContent).toBe("50%");
    });
  });

  describe("Audio Controls", () => {
    test("toggles music state correctly", () => {
      const musicToggle = document.querySelector(
        ".settings-toggle"
      ) as HTMLDivElement;

      // Initial state (unmuted)
      expect(musicToggle.classList.contains("active")).toBe(true);

      // Click to mute
      mockAudioManager.getMuteState.mockReturnValueOnce(true);
      musicToggle.click();

      expect(mockAudioManager.toggleMute).toHaveBeenCalled();
      expect(musicToggle.classList.contains("active")).toBe(false);

      // Click to unmute
      mockAudioManager.getMuteState.mockReturnValueOnce(false);
      musicToggle.click();

      expect(mockAudioManager.toggleMute).toHaveBeenCalledTimes(2);
      expect(musicToggle.classList.contains("active")).toBe(true);
    });

    test("updates volume correctly", () => {
      const volumeSlider = document.querySelector(
        ".volume-slider"
      ) as HTMLInputElement;
      const volumeValue = document.querySelector(
        ".volume-value"
      ) as HTMLDivElement;

      // Simulate volume change
      volumeSlider.value = "75";
      volumeSlider.dispatchEvent(new Event("input"));

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.75);
      expect(volumeValue.textContent).toBe("75%");
    });
  });

  describe("Visibility Control", () => {
    test("shows and hides settings correctly", () => {
      const container = document.querySelector(
        ".terminal-overlay"
      ) as HTMLDivElement;

      // Initially hidden
      expect(settings.isSettingsVisible()).toBe(false);
      expect(container.style.display).toBe("none");

      // Show settings
      settings.show();
      expect(settings.isSettingsVisible()).toBe(true);
      expect(container.style.display).toBe("flex");

      // Hide settings
      settings.hide();
      expect(settings.isSettingsVisible()).toBe(false);
      expect(container.style.display).toBe("none");
    });

    test("handles ESC key to hide settings", () => {
      settings.show();
      expect(settings.isSettingsVisible()).toBe(true);

      // Press ESC key
      const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escEvent);

      expect(settings.isSettingsVisible()).toBe(false);
    });

    test("ignores ESC key when settings are hidden", () => {
      settings.hide();
      const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escEvent);

      expect(settings.isSettingsVisible()).toBe(false);
    });
  });

  describe("Callback Handling", () => {
    test("executes close callback when hiding settings", () => {
      const mockCallback = jest.fn();
      settings.setOnCloseCallback(mockCallback);

      settings.show();
      settings.hide();

      expect(mockCallback).toHaveBeenCalled();
    });

    test("executes close callback when clicking back button", () => {
      const mockCallback = jest.fn();
      settings.setOnCloseCallback(mockCallback);

      const backButton = document.querySelector(
        ".settings-back-button"
      ) as HTMLButtonElement;
      backButton.click();

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe("Resource Management", () => {
    test("cleans up resources on dispose", () => {
      const container = document.querySelector(".terminal-overlay");
      expect(container).toBeTruthy();

      settings.dispose();

      // Container should be removed from DOM
      expect(document.body.contains(container)).toBe(false);
    });
  });
});
