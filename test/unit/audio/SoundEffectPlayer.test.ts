import { SoundEffectPlayer } from "../../../src/audio/effects/SoundEffectPlayer";
import { AudioContextManager } from "../../../src/audio/core/AudioContextManager";
import { BufferManager } from "../../../src/audio/core/BufferManager";
import { Logger } from "../../../src/utils/Logger";

// Mock dependencies
jest.mock("../../../src/utils/Logger", () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

describe("SoundEffectPlayer", () => {
  let soundEffectPlayer: SoundEffectPlayer;
  let contextManager: jest.Mocked<AudioContextManager>;
  let bufferManager: jest.Mocked<BufferManager>;
  let mockGainNode: any;
  let mockOscillator: any;
  let mockAudioContext: any;
  let mockBufferSource: any;
  let mockBiquadFilter: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock audio nodes
    mockGainNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    const createMockOscillator = () => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: {
        value: 440,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      set type(value) {
        this._type = value;
      },
      get type() {
        return this._type;
      },
      _type: "sine",
    });

    mockOscillator = createMockOscillator();

    mockBufferSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      loop: false,
      buffer: null,
      onended: null,
    };

    mockBiquadFilter = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      frequency: { value: 0 },
      Q: { value: 0 },
      type: "lowpass",
    };

    mockAudioContext = {
      createGain: jest.fn(() => mockGainNode),
      createOscillator: jest.fn(() => createMockOscillator()),
      createBufferSource: jest.fn(() => mockBufferSource),
      createBiquadFilter: jest.fn(() => mockBiquadFilter),
      createBuffer: jest.fn((numChannels, length, sampleRate) => ({
        getChannelData: jest.fn(() => new Float32Array(length)),
      })),
      currentTime: 0,
      sampleRate: 44100,
    };

    // Mock AudioContextManager
    contextManager = {
      tryResume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => createMockOscillator()),
      createGainNode: jest.fn(() => mockGainNode),
      createBiquadFilter: jest.fn(() => mockBiquadFilter),
      getCurrentTime: jest.fn(() => 0),
      getMainGainNode: jest.fn(() => mockGainNode),
      getMuteState: jest.fn(() => false),
      getContext: jest.fn(() => mockAudioContext),
      getSampleRate: jest.fn(() => 44100),
    } as unknown as jest.Mocked<AudioContextManager>;

    // Mock BufferManager
    bufferManager = {
      getBuffer: jest.fn(),
    } as unknown as jest.Mocked<BufferManager>;

    // Create SoundEffectPlayer instance
    soundEffectPlayer = new SoundEffectPlayer(contextManager, bufferManager);
  });

  describe("initialization", () => {
    it("should initialize correctly", () => {
      expect(soundEffectPlayer).toBeDefined();
      expect(Logger.getInstance().info).toHaveBeenCalledWith(
        "SoundEffectPlayer: Initialized"
      );
    });
  });

  describe("playTestTone", () => {
    it("should play a test tone correctly", () => {
      soundEffectPlayer.playTestTone();

      expect(contextManager.createOscillator).toHaveBeenCalled();
      const oscillator = contextManager.createOscillator.mock.results[0].value;
      expect(oscillator.frequency.value).toBe(440);
      expect(oscillator.type).toBe("sine");
      expect(oscillator.start).toHaveBeenCalled();
      expect(oscillator.stop).toHaveBeenCalled();
      expect(Logger.getInstance().info).toHaveBeenCalledWith(
        "SoundEffectPlayer: Played test tone"
      );
    });

    it("should handle errors when playing test tone", () => {
      contextManager.createOscillator.mockImplementation(() => {
        throw new Error("Test error");
      });

      soundEffectPlayer.playTestTone();

      expect(Logger.getInstance().error).toHaveBeenCalledWith(
        "SoundEffectPlayer: Error playing test tone:",
        expect.any(Error)
      );
    });
  });

  describe("playAudioSample", () => {
    const testBuffer = {} as AudioBuffer;
    const sampleId = "test-sample";

    beforeEach(() => {
      bufferManager.getBuffer.mockReturnValue(testBuffer);
    });

    it("should play an audio sample correctly", () => {
      const result = soundEffectPlayer.playAudioSample(sampleId);

      expect(result).toBeDefined();
      expect(mockBufferSource.buffer).toBe(testBuffer);
      expect(mockBufferSource.start).toHaveBeenCalled();
      expect(Logger.getInstance().info).toHaveBeenCalledWith(
        expect.stringContaining("Playing audio sample test-sample")
      );
    });

    it("should handle non-existent audio samples", () => {
      bufferManager.getBuffer.mockReturnValue(null);

      const result = soundEffectPlayer.playAudioSample("non-existent");

      expect(result).toBeNull();
      expect(Logger.getInstance().warn).toHaveBeenCalledWith(
        "SoundEffectPlayer: Audio sample non-existent not found"
      );
    });

    it("should respect volume parameter", () => {
      soundEffectPlayer.playAudioSample(sampleId, 0.75);

      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.75,
        expect.any(Number)
      );
    });

    it("should handle looping audio correctly", () => {
      soundEffectPlayer.playAudioSample(sampleId, 0.5, true);

      expect(mockBufferSource.loop).toBe(true);
    });
  });

  describe("playLaserSound", () => {
    it("should play default energy weapon sound", () => {
      soundEffectPlayer.playLaserSound();

      const oscillators = contextManager.createOscillator.mock.results;
      expect(oscillators).toHaveLength(2);

      // First oscillator should be sawtooth
      expect(oscillators[0].value.type).toBe("sawtooth");
      // Second oscillator should be sine (harmonic)
      expect(oscillators[1].value.type).toBe("sine");

      expect(oscillators[0].value.start).toHaveBeenCalled();
      expect(oscillators[0].value.stop).toHaveBeenCalled();
    });

    it("should play ballistic weapon sound", () => {
      soundEffectPlayer.playLaserSound("ballistic");

      const oscillators = contextManager.createOscillator.mock.results;
      expect(oscillators[0].value.type).toBe("square");
      expect(oscillators[1].value.type).toBe("sine");
    });

    it("should play explosive weapon sound", () => {
      soundEffectPlayer.playLaserSound("explosive");

      const oscillators = contextManager.createOscillator.mock.results;
      expect(oscillators[0].value.type).toBe("triangle");
      expect(oscillators[1].value.type).toBe("sine");
    });

    it("should not play when audio is muted", () => {
      contextManager.getMuteState.mockReturnValue(true);
      soundEffectPlayer.playLaserSound();

      expect(contextManager.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playCollisionSound", () => {
    it("should play default medium collision sound", () => {
      soundEffectPlayer.playCollisionSound();

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockBufferSource.start).toHaveBeenCalled();
      expect(Logger.getInstance().debug).toHaveBeenCalledWith(
        "SoundEffectPlayer: Playing collision sound"
      );
    });

    it("should play light collision sound", () => {
      soundEffectPlayer.playCollisionSound("light");

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it("should play heavy collision sound", () => {
      soundEffectPlayer.playCollisionSound("heavy");

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it("should not play when audio is muted", () => {
      contextManager.getMuteState.mockReturnValue(true);
      soundEffectPlayer.playCollisionSound();

      expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should dispose of all active sources", () => {
      // Setup some active sources
      const mockSource1 = { stop: jest.fn(), disconnect: jest.fn() };
      const mockSource2 = { stop: jest.fn(), disconnect: jest.fn() };

      // @ts-ignore - Accessing private property for testing
      soundEffectPlayer["activeSources"].set(
        "source1",
        mockSource1 as unknown as AudioBufferSourceNode
      );
      // @ts-ignore - Accessing private property for testing
      soundEffectPlayer["activeSources"].set(
        "source2",
        mockSource2 as unknown as AudioBufferSourceNode
      );

      soundEffectPlayer.dispose();

      expect(mockSource1.stop).toHaveBeenCalled();
      expect(mockSource1.disconnect).toHaveBeenCalled();
      expect(mockSource2.stop).toHaveBeenCalled();
      expect(mockSource2.disconnect).toHaveBeenCalled();
      expect(Logger.getInstance().info).toHaveBeenCalledWith(
        "SoundEffectPlayer: Disposed"
      );
    });

    it("should handle errors during disposal gracefully", () => {
      const mockSource = {
        stop: jest.fn().mockImplementation(() => {
          throw new Error("Stop error");
        }),
        disconnect: jest.fn(),
      };

      // @ts-ignore - Accessing private property for testing
      soundEffectPlayer["activeSources"].set(
        "source1",
        mockSource as unknown as AudioBufferSourceNode
      );

      soundEffectPlayer.dispose();

      expect(Logger.getInstance().info).toHaveBeenCalledWith(
        "SoundEffectPlayer: Disposed"
      );
    });
  });
});
