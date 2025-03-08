import { AudioSystem } from "../../../src/core/systems/AudioSystem";
import { AudioManager } from "../../../src/audio/AudioManager";

// Mock AudioManager
jest.mock("../../../src/audio/AudioManager");

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let mockAudioManager: jest.Mocked<AudioManager>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh instance of AudioSystem for each test
    audioSystem = new AudioSystem();

    // Get the mocked AudioManager instance
    mockAudioManager = (audioSystem as any).audioManager;
  });

  describe("Initialization", () => {
    test("initializes successfully", async () => {
      await audioSystem.init();
      expect(mockAudioManager.initialize).toHaveBeenCalled();
      expect(mockAudioManager.preloadEssentialAudio).toHaveBeenCalled();
    });

    test("continues even if initialization fails", async () => {
      // Mock initialization failure
      mockAudioManager.initialize.mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      // Should not throw error
      await expect(audioSystem.init()).resolves.not.toThrow();
    });

    test("continues if preloading fails", async () => {
      mockAudioManager.preloadEssentialAudio.mockRejectedValue(
        new Error("Preload failed")
      );

      // Should not throw error
      await expect(audioSystem.init()).resolves.not.toThrow();
    });
  });

  describe("Resource Management", () => {
    test("disposes resources correctly", () => {
      audioSystem.dispose();
      expect(mockAudioManager.dispose).toHaveBeenCalled();
    });

    test("provides access to AudioManager instance", () => {
      const manager = audioSystem.getAudioManager();
      expect(manager).toBe(mockAudioManager);
    });
  });

  describe("Update Cycle", () => {
    test("update is a no-op", () => {
      // Since AudioManager handles its own timing, update should do nothing
      audioSystem.update(0.016); // 16ms frame
      expect(mockAudioManager.initialize).not.toHaveBeenCalled();
      expect(mockAudioManager.dispose).not.toHaveBeenCalled();
    });
  });

  describe("Audio Control", () => {
    describe("Menu Music", () => {
      test("plays menu thump with default parameters", () => {
        audioSystem.playMenuThump();
        expect(mockAudioManager.playMenuThump).toHaveBeenCalledWith(
          false,
          false
        );
      });

      test("plays menu thump with procedural audio", () => {
        audioSystem.playMenuThump(true);
        expect(mockAudioManager.playMenuThump).toHaveBeenCalledWith(
          true,
          false
        );
      });

      test("forces menu thump restart", () => {
        audioSystem.playMenuThump(false, true);
        expect(mockAudioManager.playMenuThump).toHaveBeenCalledWith(
          false,
          true
        );
      });
    });

    describe("Volume Control", () => {
      test("sets volume correctly", () => {
        audioSystem.setVolume(0.5);
        expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5);
      });

      test("gets current volume", () => {
        mockAudioManager.getVolume.mockReturnValue(0.7);
        const volume = audioSystem.getVolume();
        expect(volume).toBe(0.7);
        expect(mockAudioManager.getVolume).toHaveBeenCalled();
      });

      test("toggles mute state", () => {
        audioSystem.toggleMute();
        expect(mockAudioManager.toggleMute).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    test("logs error when initialization fails", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      mockAudioManager.initialize.mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      await audioSystem.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to initialize audio system:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    test("logs error when preloading fails", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      mockAudioManager.preloadEssentialAudio.mockRejectedValue(
        new Error("Preload failed")
      );

      await audioSystem.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to initialize audio system:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    test("handles volume values at boundaries", () => {
      audioSystem.setVolume(0);
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0);

      audioSystem.setVolume(1);
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(1);
    });

    test("handles rapid mute toggles", () => {
      for (let i = 0; i < 10; i++) {
        audioSystem.toggleMute();
      }
      expect(mockAudioManager.toggleMute).toHaveBeenCalledTimes(10);
    });

    test("handles multiple init calls", async () => {
      await audioSystem.init();
      await audioSystem.init();
      expect(mockAudioManager.initialize).toHaveBeenCalledTimes(2);
    });
  });
});
