import { ToneBufferManager } from "../../../src/audio/tone/ToneBufferManager";
import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import * as Tone from "tone";

// Mock ToneContextManager
jest.mock("../../../src/audio/tone/ToneContextManager");

describe("ToneBufferManager", () => {
  let bufferManager: ToneBufferManager;
  let mockContextManager: jest.Mocked<ToneContextManager>;

  // Mock for ToneAudioBuffer
  const createMockBuffer = (duration: number = 2.5) => {
    return {
      duration,
      dispose: jest.fn(),
      loaded: true,
      onload: jest.fn(),
    };
  };

  beforeEach(() => {
    // Create mock context manager
    mockContextManager =
      new ToneContextManager() as jest.Mocked<ToneContextManager>;

    // Mock Tone.ToneAudioBuffer with a simpler approach
    jest.spyOn(Tone, "ToneAudioBuffer").mockImplementation(
      // Using any to bypass type checking
      (...args: any[]) => {
        const buffer = createMockBuffer();
        // If second argument is a function, assume it's the onload callback
        const onload = typeof args[1] === "function" ? args[1] : undefined;
        if (onload) setTimeout(() => onload(), 0);
        return buffer as any;
      }
    );

    // Mock Tone.ToneAudioBuffers
    jest.spyOn(Tone, "ToneAudioBuffers").mockImplementation(() => {
      return {
        add: jest.fn(),
        get: jest.fn((id) => createMockBuffer()),
        has: jest.fn((id) => true),
        urls: {},
        dispose: jest.fn(),
        _buffers: {},
      } as any;
    });

    // Create the buffer manager
    bufferManager = new ToneBufferManager(mockContextManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Buffer management", () => {
    test("should store and retrieve buffers", () => {
      const mockBuffer = createMockBuffer() as any;
      bufferManager.storeBuffer("test_buffer", mockBuffer);

      const retrieved = bufferManager.getBuffer("test_buffer");
      expect(retrieved).toBeDefined();
    });

    test("should check if buffer exists", () => {
      const mockBuffer = createMockBuffer() as any;
      bufferManager.storeBuffer("test_buffer", mockBuffer);

      expect(bufferManager.hasBuffer("test_buffer")).toBe(true);
      expect(bufferManager.hasBuffer("nonexistent")).toBe(false);
    });

    test("should get buffer IDs", () => {
      const mockBuffer1 = createMockBuffer() as any;
      const mockBuffer2 = createMockBuffer() as any;

      bufferManager.storeBuffer("buffer1", mockBuffer1);
      bufferManager.storeBuffer("buffer2", mockBuffer2);

      const ids = bufferManager.getBufferIds();
      expect(ids).toContain("buffer1");
      expect(ids).toContain("buffer2");
      expect(ids.length).toBe(2);
    });
  });

  describe("Loading audio", () => {
    test("should load audio sample", async () => {
      await bufferManager.loadAudioSample("test.mp3", "test_sound");
      expect(Tone.ToneAudioBuffer).toHaveBeenCalled();
    });

    test("should preload essential audio", async () => {
      // Spy on loadAudioSample
      jest.spyOn(bufferManager, "loadAudioSample").mockResolvedValue();

      await bufferManager.preloadEssentials();

      // Should have called loadAudioSample for each essential sound
      expect(bufferManager.loadAudioSample).toHaveBeenCalledTimes(3);
    });
  });

  describe("Cleanup", () => {
    test("should clean up unused buffers", () => {
      // Set up a mock for ToneAudioBuffer's dispose
      const mockBuffer1 = createMockBuffer() as any;
      const mockBuffer2 = createMockBuffer() as any;

      bufferManager.storeBuffer("essential", mockBuffer1);
      bufferManager.storeBuffer("nonessential", mockBuffer2);

      // Mark essential buffer
      (bufferManager as any).essentialBuffers.add("essential");

      // Clean up non-essential buffers
      bufferManager.cleanupUnused(true);

      // The nonessential buffer should be disposed
      expect(mockBuffer2.dispose).toHaveBeenCalled();
      // The essential buffer should not be disposed
      expect(mockBuffer1.dispose).not.toHaveBeenCalled();
    });

    test("should dispose all resources", () => {
      const mockDispose = jest.fn();
      (bufferManager as any).bufferCache.dispose = mockDispose;

      bufferManager.dispose();

      expect(mockDispose).toHaveBeenCalled();
    });
  });
});
