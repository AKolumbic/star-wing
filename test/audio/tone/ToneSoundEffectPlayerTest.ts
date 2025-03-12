import { ToneSoundEffectPlayer } from "../../../src/audio/tone/ToneSoundEffectPlayer";
import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import { ToneBufferManager } from "../../../src/audio/tone/ToneBufferManager";
import * as Tone from "tone";

// Mock dependencies
jest.mock("../../../src/audio/tone/ToneContextManager");
jest.mock("../../../src/audio/tone/ToneBufferManager");

describe("ToneSoundEffectPlayer", () => {
  let soundEffectPlayer: ToneSoundEffectPlayer;
  let mockContextManager: jest.Mocked<ToneContextManager>;
  let mockBufferManager: jest.Mocked<ToneBufferManager>;

  beforeEach(() => {
    // Create mock dependencies
    mockContextManager =
      new ToneContextManager() as jest.Mocked<ToneContextManager>;
    mockBufferManager = new ToneBufferManager(
      mockContextManager
    ) as jest.Mocked<ToneBufferManager>;

    // Setup buffer manager mocks
    mockBufferManager.hasBuffer = jest.fn().mockReturnValue(true);
    mockBufferManager.getBuffer = jest.fn().mockReturnValue({
      duration: 2.5,
      loaded: true,
    });

    // Mock Tone.js classes
    jest.spyOn(Tone, "Player").mockImplementation(() => {
      return {
        toDestination: jest.fn().mockReturnThis(),
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn(),
        volume: {
          value: 0,
          rampTo: jest.fn(),
        },
        onstop: null,
      } as any;
    });

    jest.spyOn(Tone, "Oscillator").mockImplementation(() => {
      return {
        toDestination: jest.fn().mockReturnThis(),
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn(),
        frequency: {
          value: 440,
        },
        onstop: null,
      } as any;
    });

    jest.spyOn(Tone, "Synth").mockImplementation(() => {
      return {
        toDestination: jest.fn().mockReturnThis(),
        triggerAttack: jest.fn(),
        triggerRelease: jest.fn(),
        dispose: jest.fn(),
        chain: jest.fn().mockReturnThis(),
        frequency: {
          exponentialRampTo: jest.fn(),
        },
      } as any;
    });

    jest.spyOn(Tone, "NoiseSynth").mockImplementation(() => {
      return {
        toDestination: jest.fn().mockReturnThis(),
        triggerAttackRelease: jest.fn(),
        dispose: jest.fn(),
        chain: jest.fn().mockReturnThis(),
      } as any;
    });

    jest.spyOn(Tone, "Filter").mockImplementation(() => {
      return {
        dispose: jest.fn(),
      } as any;
    });

    jest.spyOn(Tone, "Distortion").mockImplementation(() => {
      return {
        dispose: jest.fn(),
      } as any;
    });

    // Mock setTimeout
    jest.useFakeTimers();

    // Create the sound effect player
    soundEffectPlayer = new ToneSoundEffectPlayer(
      mockContextManager,
      mockBufferManager
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Basic sound playback", () => {
    test("should play test tone", () => {
      soundEffectPlayer.playTestTone();
      expect(Tone.Oscillator).toHaveBeenCalled();
      const oscillator = (Tone.Oscillator as unknown as jest.Mock).mock
        .results[0].value;
      expect(oscillator.start).toHaveBeenCalled();
    });

    test("should play audio sample", () => {
      const player = soundEffectPlayer.playAudioSample("test_sound");
      expect(mockBufferManager.hasBuffer).toHaveBeenCalledWith("test_sound");
      expect(mockBufferManager.getBuffer).toHaveBeenCalledWith("test_sound");
      expect(Tone.Player).toHaveBeenCalled();
      expect(player).toBeDefined();

      const tonePlayer = (Tone.Player as unknown as jest.Mock).mock.results[0]
        .value;
      expect(tonePlayer.start).toHaveBeenCalled();
    });

    test("should return null if buffer not found", () => {
      mockBufferManager.hasBuffer = jest.fn().mockReturnValue(false);
      const player = soundEffectPlayer.playAudioSample("nonexistent");
      expect(player).toBeNull();
    });
  });

  describe("Special sound effects", () => {
    test("should play laser sound", () => {
      soundEffectPlayer.playLaserSound();
      expect(Tone.Synth).toHaveBeenCalled();
      expect(Tone.Filter).toHaveBeenCalled();
      expect(Tone.Distortion).toHaveBeenCalled();

      const synth = (Tone.Synth as unknown as jest.Mock).mock.results[0].value;
      expect(synth.triggerAttack).toHaveBeenCalled();
      expect(synth.frequency.exponentialRampTo).toHaveBeenCalled();
      expect(synth.triggerRelease).toHaveBeenCalled();
    });

    test("should play collision sound", () => {
      soundEffectPlayer.playCollisionSound();
      expect(Tone.NoiseSynth).toHaveBeenCalled();
      expect(Tone.Filter).toHaveBeenCalled();
      expect(Tone.Distortion).toHaveBeenCalled();

      const noiseSynth = (Tone.NoiseSynth as unknown as jest.Mock).mock
        .results[0].value;
      expect(noiseSynth.triggerAttackRelease).toHaveBeenCalled();
    });

    test("should play different laser types", () => {
      soundEffectPlayer.playLaserSound("energy");
      expect(Tone.Synth).toHaveBeenCalled();

      // Clear mocks
      jest.clearAllMocks();

      soundEffectPlayer.playLaserSound("rapid");
      expect(Tone.Synth).toHaveBeenCalled();

      // Different types should have different configurations
      // We don't need to test exact values, just that it's making unique sounds
    });

    test("should play different collision sizes", () => {
      soundEffectPlayer.playCollisionSound("small");
      expect(Tone.NoiseSynth).toHaveBeenCalled();

      // Clear mocks
      jest.clearAllMocks();

      soundEffectPlayer.playCollisionSound("large");
      expect(Tone.NoiseSynth).toHaveBeenCalled();

      // Different sizes should have different configurations
    });
  });

  describe("Resource management", () => {
    test("should stop all effects", () => {
      // First play some samples
      const player1 = soundEffectPlayer.playAudioSample("sound1");
      const player2 = soundEffectPlayer.playAudioSample("sound2");

      // Then stop them all
      soundEffectPlayer.stopAllEffects();

      // Check that volume ramps were called
      const tonePlayer1 = (Tone.Player as unknown as jest.Mock).mock.results[0]
        .value;
      const tonePlayer2 = (Tone.Player as unknown as jest.Mock).mock.results[1]
        .value;
      expect(tonePlayer1.volume.rampTo).toHaveBeenCalled();
      expect(tonePlayer2.volume.rampTo).toHaveBeenCalled();

      // Advance timers to trigger stop
      jest.advanceTimersByTime(200);

      // Players should be stopped
      expect(tonePlayer1.stop).toHaveBeenCalled();
      expect(tonePlayer2.stop).toHaveBeenCalled();
    });

    test("should dispose resources", () => {
      // First play some samples
      soundEffectPlayer.playAudioSample("sound1");
      soundEffectPlayer.playAudioSample("sound2");

      // Then dispose
      soundEffectPlayer.dispose();

      // Players should be stopped and disposed
      const tonePlayer1 = (Tone.Player as unknown as jest.Mock).mock.results[0]
        .value;
      const tonePlayer2 = (Tone.Player as unknown as jest.Mock).mock.results[1]
        .value;
      expect(tonePlayer1.stop).toHaveBeenCalled();
      expect(tonePlayer2.stop).toHaveBeenCalled();
      expect(tonePlayer1.dispose).toHaveBeenCalled();
      expect(tonePlayer2.dispose).toHaveBeenCalled();
    });
  });
});
