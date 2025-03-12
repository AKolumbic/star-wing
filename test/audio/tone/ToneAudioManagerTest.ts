import { ToneAudioManager } from "../../../src/audio/tone/ToneAudioManager";
import { ToneBufferManager } from "../../../src/audio/tone/ToneBufferManager";
import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import { ToneMusicPlayer } from "../../../src/audio/tone/ToneMusicPlayer";
import { ToneSoundEffectPlayer } from "../../../src/audio/tone/ToneSoundEffectPlayer";
import { ToneProceduralGenerator } from "../../../src/audio/tone/ToneProceduralGenerator";
import { ToneSpatialAudio } from "../../../src/audio/tone/ToneSpatialAudio";
import { ToneEffectsChain } from "../../../src/audio/tone/ToneEffectsChain";

// Mock dependencies
jest.mock("../../../src/audio/tone/ToneBufferManager");
jest.mock("../../../src/audio/tone/ToneContextManager");
jest.mock("../../../src/audio/tone/ToneMusicPlayer");
jest.mock("../../../src/audio/tone/ToneSoundEffectPlayer");
jest.mock("../../../src/audio/tone/ToneProceduralGenerator");
jest.mock("../../../src/audio/tone/ToneSpatialAudio");
jest.mock("../../../src/audio/tone/ToneEffectsChain");

describe("ToneAudioManager", () => {
  let audioManager: ToneAudioManager;
  let mockBufferManager: jest.Mocked<ToneBufferManager>;
  let mockContextManager: jest.Mocked<ToneContextManager>;
  let mockMusicPlayer: jest.Mocked<ToneMusicPlayer>;

  beforeEach(() => {
    // Reset the singleton instance
    (ToneAudioManager as any).instance = undefined;

    // Create a fresh instance
    audioManager = ToneAudioManager.getInstance();

    // Get the mocked instances
    mockBufferManager = audioManager[
      "bufferManager"
    ] as jest.Mocked<ToneBufferManager>;
    mockContextManager = audioManager[
      "contextManager"
    ] as jest.Mocked<ToneContextManager>;
    mockMusicPlayer = audioManager[
      "musicPlayer"
    ] as jest.Mocked<ToneMusicPlayer>;

    // Reset any instance variables we're testing
    (audioManager as any)._essentialsPreloaded = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("preloadEssentialAudio", () => {
    test("should preload essential audio on first call", async () => {
      // Mock the buffer manager's preloadEssentials method
      mockBufferManager.preloadEssentials.mockResolvedValue();

      // Mock hasBuffer to return true for menu_music
      mockBufferManager.hasBuffer.mockImplementation(
        (id) => id === "menu_music"
      );

      // Call the method
      await audioManager.preloadEssentialAudio();

      // Verify bufferManager.preloadEssentials was called
      expect(mockBufferManager.preloadEssentials).toHaveBeenCalledTimes(1);

      // Verify musicPlayer.createMenuMusicPlayer was called
      expect(mockMusicPlayer.createMenuMusicPlayer).toHaveBeenCalledTimes(1);
    });

    test("should not preload essential audio on subsequent calls", async () => {
      // Mock the buffer manager's preloadEssentials method
      mockBufferManager.preloadEssentials.mockResolvedValue();

      // Mock hasBuffer to return true for menu_music
      mockBufferManager.hasBuffer.mockImplementation(
        (id) => id === "menu_music"
      );

      // Call the method twice
      await audioManager.preloadEssentialAudio();
      await audioManager.preloadEssentialAudio();

      // Verify bufferManager.preloadEssentials was called only once
      expect(mockBufferManager.preloadEssentials).toHaveBeenCalledTimes(1);

      // Verify musicPlayer.createMenuMusicPlayer was called only once
      expect(mockMusicPlayer.createMenuMusicPlayer).toHaveBeenCalledTimes(1);
    });

    test("should not create menu music player if buffer not available", async () => {
      // Mock the buffer manager's preloadEssentials method
      mockBufferManager.preloadEssentials.mockResolvedValue();

      // Mock hasBuffer to return false for menu_music
      mockBufferManager.hasBuffer.mockImplementation((id) => false);

      // Call the method
      await audioManager.preloadEssentialAudio();

      // Verify bufferManager.preloadEssentials was called
      expect(mockBufferManager.preloadEssentials).toHaveBeenCalledTimes(1);

      // Verify musicPlayer.createMenuMusicPlayer was not called
      expect(mockMusicPlayer.createMenuMusicPlayer).not.toHaveBeenCalled();
    });
  });

  describe("initialize", () => {
    test("should initialize on first call", async () => {
      // Mock dependencies
      mockContextManager.initialize.mockResolvedValue();
      mockBufferManager.preloadEssentials.mockResolvedValue();

      // Call the method
      await audioManager.initialize();

      // Verify contextManager.initialize was called
      expect(mockContextManager.initialize).toHaveBeenCalledTimes(1);

      // Verify bufferManager.preloadEssentials was called
      expect(mockBufferManager.preloadEssentials).toHaveBeenCalledTimes(1);
    });

    test("should not initialize on subsequent calls", async () => {
      // Mock dependencies
      mockContextManager.initialize.mockResolvedValue();
      mockBufferManager.preloadEssentials.mockResolvedValue();

      // Call the method twice
      await audioManager.initialize();
      await audioManager.initialize();

      // Verify contextManager.initialize was called only once
      expect(mockContextManager.initialize).toHaveBeenCalledTimes(1);

      // Verify bufferManager.preloadEssentials was called only once
      expect(mockBufferManager.preloadEssentials).toHaveBeenCalledTimes(1);
    });
  });
});
