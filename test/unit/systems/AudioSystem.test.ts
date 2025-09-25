import { AudioSystem } from "../../../src/core/systems/AudioSystem";
import { AudioManager } from "../../../src/audio/AudioManager";

// Mock AudioManager to provide a controllable singleton instance
jest.mock("../../../src/audio/AudioManager", () => {
  const mockInstance = {
    initialize: jest.fn(),
    preloadEssentialAudio: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn(),
    playMenuThump: jest.fn(),
    setVolume: jest.fn(),
    getVolume: jest.fn().mockReturnValue(1),
    toggleMute: jest.fn(),
    getMuteState: jest.fn().mockReturnValue(false),
    isAudioPlaying: jest.fn().mockReturnValue(false),
  } as unknown as jest.Mocked<AudioManager>;

  const getInstanceMock = jest.fn(() => mockInstance);

  return {
    AudioManager: class MockAudioManager {
      static getInstance = getInstanceMock;
    },
  };
});

// Mock Logger to capture error output
jest.mock("../../../src/utils/Logger", () => {
  const loggerMock = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    Logger: {
      getInstance: jest.fn(() => loggerMock),
    },
  };
});

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let mockAudioManager: jest.Mocked<AudioManager>;
  let mockLogger: { error: jest.Mock };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh instance of AudioSystem for each test
    audioSystem = new AudioSystem();

    // Get the mocked AudioManager instance
    mockAudioManager = (audioSystem as any).audioManager;
    mockLogger = (audioSystem as any).logger;

    mockAudioManager.initialize.mockImplementation(() => {});
    mockAudioManager.preloadEssentialAudio.mockResolvedValue(undefined);
  });

  describe("Initialization", () => {
    test("initializes successfully", async () => {
      await audioSystem.init();
      expect(mockAudioManager.initialize).toHaveBeenCalled();
      expect(mockAudioManager.preloadEssentialAudio).toHaveBeenCalled();
    });

    test("propagates errors when initialization fails", async () => {
      // Mock initialization failure
      mockAudioManager.initialize.mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      await expect(audioSystem.init()).rejects.toThrow("Initialization failed");
    });

    test("propagates errors if preloading fails", async () => {
      mockAudioManager.preloadEssentialAudio.mockRejectedValue(
        new Error("Preload failed")
      );

      await expect(audioSystem.init()).rejects.toThrow("Preload failed");
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
      mockAudioManager.initialize.mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      await expect(audioSystem.init()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize audio system",
        expect.any(Error)
      );
    });

    test("logs error when preloading fails", async () => {
      mockAudioManager.preloadEssentialAudio.mockRejectedValue(
        new Error("Preload failed")
      );

      await expect(audioSystem.init()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize audio system",
        expect.any(Error)
      );
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
