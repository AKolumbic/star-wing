import { BufferManager } from "../../../../src/audio/core/BufferManager.js";
import { Logger } from "../../../../src/utils/Logger.js";
import { AudioContextManager } from "../../../../src/audio/core/AudioContextManager.js";
import { jest, expect } from "@jest/globals";

describe("BufferManager", () => {
  let bufferManager: BufferManager;
  let mockContextManager: jest.Mocked<AudioContextManager>;
  let mockLogger: ReturnType<typeof jest.spyOn>;
  let mockAudioContext: jest.Mocked<AudioContext>;
  let mockAudioBuffer: AudioBuffer;

  beforeEach(() => {
    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
      },
      writable: true,
    });

    // Setup mock audio buffer
    mockAudioBuffer = {
      duration: 2.5,
      length: 110250, // 2.5 seconds at 44.1kHz
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: jest.fn(() => new Float32Array(110250)),
    } as unknown as AudioBuffer;

    // Setup mock audio context
    mockAudioContext = {
      decodeAudioData: jest
        .fn()
        .mockImplementation((arrayBuffer) => Promise.resolve(mockAudioBuffer)),
    } as unknown as jest.Mocked<AudioContext>;

    // Setup mock context manager
    mockContextManager = {
      getContext: jest.fn(() => mockAudioContext),
    } as unknown as jest.Mocked<AudioContextManager>;

    // Setup mock logger
    const mockLoggerInstance = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      group: jest.fn(),
      isProduction: false,
      severity: 1,
    } as unknown as Logger;

    // Mock Logger.getInstance
    mockLogger = jest
      .spyOn(Logger, "getInstance")
      .mockReturnValue(mockLoggerInstance);

    // Create BufferManager instance
    bufferManager = new BufferManager(mockContextManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should initialize with empty buffer cache", () => {
      expect(bufferManager.getBufferIds()).toHaveLength(0);
      expect(mockLogger).toHaveBeenCalled();
    });

    test("should store context manager reference", () => {
      expect(mockContextManager.getContext).toBeDefined();
    });
  });

  describe("Buffer Cache Operations", () => {
    test("should store and retrieve buffers correctly", () => {
      bufferManager.storeBuffer("test-sound", mockAudioBuffer);

      expect(bufferManager.hasBuffer("test-sound")).toBe(true);
      expect(bufferManager.getBuffer("test-sound")).toBe(mockAudioBuffer);
      expect(mockLogger).toHaveBeenCalled();
    });

    test("should return null for non-existent buffers", () => {
      expect(bufferManager.getBuffer("non-existent")).toBeNull();
    });

    test("should return correct list of buffer IDs", () => {
      bufferManager.storeBuffer("sound1", mockAudioBuffer);
      bufferManager.storeBuffer("sound2", mockAudioBuffer);

      const ids = bufferManager.getBufferIds();
      expect(ids).toContain("sound1");
      expect(ids).toContain("sound2");
      expect(ids).toHaveLength(2);
    });
  });

  describe("Audio Sample Loading", () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response)
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("should load audio sample successfully", async () => {
      await bufferManager.loadAudioSample("test.mp3", "test-sound");

      expect(global.fetch).toHaveBeenCalledWith("test.mp3");
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
      expect(bufferManager.hasBuffer("test-sound")).toBe(true);
    });

    test("should handle fetch errors gracefully", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        } as Response)
      );

      await expect(
        bufferManager.loadAudioSample("missing.mp3", "test-sound")
      ).rejects.toThrow("Failed to fetch audio file");

      expect(mockLogger).toHaveBeenCalled();
    });

    test("should handle decode errors gracefully", async () => {
      mockAudioContext.decodeAudioData.mockRejectedValueOnce(
        new Error("Decode failed")
      );

      await expect(
        bufferManager.loadAudioSample("test.mp3", "test-sound")
      ).rejects.toThrow("Decode failed");

      expect(mockLogger).toHaveBeenCalled();
    });

    test("should apply loop optimization for menu music", async () => {
      await bufferManager.loadAudioSample("menu.mp3", "menuMusic", true);
      expect(mockLogger).toHaveBeenCalled();
    });
  });

  describe("Essential Audio Preloading", () => {
    test("should preload essential audio files", async () => {
      await bufferManager.preloadEssentials();

      expect(bufferManager.hasBuffer("menuMusic")).toBe(true);
      expect(bufferManager.hasBuffer("gameMusic")).toBe(true);
      expect(mockLogger).toHaveBeenCalled();
    });

    test("should not reload already cached essential audio", async () => {
      bufferManager.storeBuffer("menuMusic", mockAudioBuffer);
      bufferManager.storeBuffer("gameMusic", mockAudioBuffer);

      const fetchSpy = jest.spyOn(global, "fetch");
      await bufferManager.preloadEssentials();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup and Disposal", () => {
    test("should preserve essential buffers during cleanup", () => {
      bufferManager.storeBuffer("menuMusic", mockAudioBuffer);
      bufferManager.storeBuffer("gameMusic", mockAudioBuffer);
      bufferManager.storeBuffer("effect1", mockAudioBuffer);

      bufferManager.cleanupUnused(true);

      expect(bufferManager.hasBuffer("menuMusic")).toBe(true);
      expect(bufferManager.hasBuffer("gameMusic")).toBe(true);
      expect(bufferManager.hasBuffer("effect1")).toBe(false);
    });

    test("should remove all buffers when preserveEssential is false", () => {
      bufferManager.storeBuffer("menuMusic", mockAudioBuffer);
      bufferManager.storeBuffer("gameMusic", mockAudioBuffer);
      bufferManager.storeBuffer("effect1", mockAudioBuffer);

      bufferManager.cleanupUnused(false);

      expect(bufferManager.getBufferIds()).toHaveLength(0);
    });

    test("should clear all buffers on dispose", () => {
      bufferManager.storeBuffer("sound1", mockAudioBuffer);
      bufferManager.storeBuffer("sound2", mockAudioBuffer);

      bufferManager.dispose();

      expect(bufferManager.getBufferIds()).toHaveLength(0);
      expect(mockLogger).toHaveBeenCalled();
    });
  });
});
