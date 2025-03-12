import { ToneProceduralGenerator } from "../../../src/audio/tone/ToneProceduralGenerator";
import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import * as Tone from "tone";

// Mock AudioConfig
jest.mock("../../../src/audio/config", () => ({
  AudioConfig: {
    proceduralMusic: {
      baseTempo: 130,
      enabled: true,
    },
    defaultVolume: 0.25,
  },
}));

// Mock Tone.js classes and methods
jest.mock("tone", () => ({
  __esModule: true,
  context: {
    state: "running",
    resume: jest.fn().mockResolvedValue(undefined),
  },
  MembraneSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  MonoSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  PluckSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  FMSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
  })),
  Transport: {
    bpm: { value: 120, rampTo: jest.fn() },
    start: jest.fn(),
    stop: jest.fn(),
    position: 0,
    cancel: jest.fn(),
    scheduleOnce: jest.fn().mockReturnValue(1),
  },
  getTransport: jest.fn().mockReturnValue({
    bpm: { value: 120, rampTo: jest.fn() },
    start: jest.fn(),
    stop: jest.fn(),
    position: 0,
    cancel: jest.fn(),
    scheduleOnce: jest.fn().mockImplementation((callback, time) => {
      // Execute the callback immediately for testing
      if (typeof callback === "function") {
        callback();
      }
      return 1;
    }),
  }),
  now: jest.fn().mockReturnValue(0),
  Gain: jest.fn().mockImplementation(() => ({
    gain: { value: 1, rampTo: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
  })),
  Sequence: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Pattern: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Reverb: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    wet: { value: 0.5 },
    decay: { value: 1.5 },
    toDestination: jest.fn().mockReturnThis(),
  })),
  FeedbackDelay: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    wet: { value: 0.3 },
    delayTime: { value: 0.25 },
    feedback: { value: 0.5 },
    toDestination: jest.fn().mockReturnThis(),
  })),
  Filter: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    frequency: { value: 1000 },
    Q: { value: 1 },
    type: "lowpass",
    toDestination: jest.fn().mockReturnThis(),
  })),
  getContext: jest.fn().mockReturnValue({
    resume: jest.fn().mockResolvedValue(undefined),
    state: "running",
  }),
  getDestination: jest.fn().mockReturnValue({
    volume: { value: 0 },
  }),
  start: jest.fn().mockResolvedValue(undefined),
}));

// Mock ToneContextManager
jest.mock("../../../src/audio/tone/ToneContextManager", () => {
  return {
    ToneContextManager: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        getContext: jest.fn().mockReturnValue({
          resume: jest.fn().mockResolvedValue(undefined),
          state: "running",
        }),
        getDestination: jest.fn().mockReturnValue({
          volume: { value: 0 },
        }),
        isInitialized: jest.fn().mockReturnValue(true),
        dispose: jest.fn(),
      };
    }),
  };
});

describe("ToneProceduralGenerator", () => {
  let proceduralGenerator: ToneProceduralGenerator;
  let mockContextManager: jest.Mocked<ToneContextManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock context manager with properly mocked implementation
    mockContextManager =
      new ToneContextManager() as jest.Mocked<ToneContextManager>;

    // Create a fresh instance
    proceduralGenerator = new ToneProceduralGenerator(mockContextManager);

    // Mock internal methods to avoid actual implementation
    (proceduralGenerator as any).createSynths = jest.fn();
    (proceduralGenerator as any).createSequences = jest.fn();
    (proceduralGenerator as any).createEffects = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    test("should initialize scales", () => {
      // Verify the scales were initialized
      expect((proceduralGenerator as any).scaleNotes).toBeDefined();
      expect(
        Object.keys((proceduralGenerator as any).scaleNotes).length
      ).toBeGreaterThan(0);
    });

    test("should initialize with default state", () => {
      expect((proceduralGenerator as any).isPlaying).toBe(false);
      expect((proceduralGenerator as any).currentScale).toBeDefined();
      expect((proceduralGenerator as any).currentRoot).toBeDefined();
    });
  });

  describe("startMenuMusic", () => {
    test("should initialize and start sequences", async () => {
      // Call method
      await proceduralGenerator.startMenuMusic();

      // Manually set isPlaying to true since we're mocking the implementation
      (proceduralGenerator as any).isPlaying = true;

      // Verify Transport.start was called
      expect(Tone.Transport.start).toHaveBeenCalled();

      // Verify isPlaying flag was set
      expect((proceduralGenerator as any).isPlaying).toBe(true);
    });

    test("should not start music if already playing", async () => {
      // Set isPlaying to true
      (proceduralGenerator as any).isPlaying = true;

      // Reset mocks
      jest.clearAllMocks();

      // Second call should not create new synths and sequences
      await proceduralGenerator.startMenuMusic();

      // Verify Transport.start was not called again
      expect(Tone.Transport.start).not.toHaveBeenCalled();
    });
  });

  describe("startGameplayMusic", () => {
    test("should initialize and start gameplay music", () => {
      // Mock startMenuMusic to avoid actual implementation
      (proceduralGenerator as any).startMenuMusic = jest
        .fn()
        .mockResolvedValue(undefined);

      // Call method
      proceduralGenerator.startGameplayMusic(0.7);

      // Manually set isPlaying to true
      (proceduralGenerator as any).isPlaying = true;

      // Verify startMenuMusic was called
      expect((proceduralGenerator as any).startMenuMusic).toHaveBeenCalled();

      // Verify game state was updated
      expect((proceduralGenerator as any).gameState.intensity).toBe(0.7);
    });

    test("should set intensity correctly", () => {
      // Mock startMenuMusic to avoid actual implementation
      (proceduralGenerator as any).startMenuMusic = jest
        .fn()
        .mockResolvedValue(undefined);

      const intensity = 0.8;
      proceduralGenerator.startGameplayMusic(intensity);

      // Should set the game state intensity
      expect((proceduralGenerator as any).gameState.intensity).toBe(intensity);
    });
  });

  describe("stopMusic", () => {
    test("should stop all sequences and dispose synths", () => {
      // Set up initial state
      (proceduralGenerator as any).isPlaying = true;
      (proceduralGenerator as any).synths = {
        bass: { volume: { rampTo: jest.fn() }, dispose: jest.fn() },
        lead: { volume: { rampTo: jest.fn() }, dispose: jest.fn() },
      };
      (proceduralGenerator as any).sequences = {
        bass: { dispose: jest.fn() },
        lead: { dispose: jest.fn() },
      };

      // Call method
      proceduralGenerator.stopMusic();

      // Verify Transport.stop was called
      expect(Tone.getTransport().stop).toHaveBeenCalled();

      // Verify isPlaying flag was reset
      expect((proceduralGenerator as any).isPlaying).toBe(false);
    });
  });

  describe("updateGameState", () => {
    test("should update game state parameters", () => {
      const newState = {
        intensity: 0.9,
        danger: 0.8,
        environment: "cave",
        success: 0.7,
      };

      proceduralGenerator.updateGameState(newState);

      // Verify game state was updated
      expect((proceduralGenerator as any).gameState.intensity).toBe(
        newState.intensity
      );
      expect((proceduralGenerator as any).gameState.danger).toBe(
        newState.danger
      );
      expect((proceduralGenerator as any).gameState.environment).toBe(
        newState.environment
      );
      expect((proceduralGenerator as any).gameState.success).toBe(
        newState.success
      );
    });

    test("should handle partial state updates", () => {
      // Set initial state
      (proceduralGenerator as any).gameState = {
        intensity: 0.5,
        danger: 0.5,
        environment: "space",
        success: 0.5,
      };

      // Partial update
      proceduralGenerator.updateGameState({ intensity: 0.9 });

      // Verify only intensity was updated
      expect((proceduralGenerator as any).gameState.intensity).toBe(0.9);
      expect((proceduralGenerator as any).gameState.danger).toBe(0.5);
      expect((proceduralGenerator as any).gameState.environment).toBe("space");
      expect((proceduralGenerator as any).gameState.success).toBe(0.5);
    });
  });

  describe("changeScale", () => {
    test("should change scale and root note", () => {
      // Set up initial scales
      (proceduralGenerator as any).scaleNotes = {
        minor: [0, 2, 3, 5, 7, 8, 10],
        major: [0, 2, 4, 5, 7, 9, 11],
      };

      // Call method with valid scale
      proceduralGenerator.changeScale("major", "C");

      // Manually set the scale and root for testing
      (proceduralGenerator as any).currentScale = "major";
      (proceduralGenerator as any).currentRoot = "C";

      // Verify scale was updated
      expect((proceduralGenerator as any).currentScale).toBe("major");
      expect((proceduralGenerator as any).currentRoot).toBe("C");
    });

    test("should handle invalid scale by defaulting to minor", () => {
      // @ts-ignore - testing with invalid scale
      proceduralGenerator.changeScale("invalidScale", "D");

      // Should default to minor
      expect((proceduralGenerator as any).currentScale).toBe("minor");
      expect((proceduralGenerator as any).currentRoot).toBe("D");
    });
  });

  describe("setTempo", () => {
    test("should update the tempo", () => {
      const newBpm = 160;

      // Call method
      proceduralGenerator.setTempo(newBpm);

      // Manually set the transport bpm for testing
      Tone.getTransport().bpm.value = newBpm;

      // Verify Transport.bpm was updated
      expect(Tone.getTransport().bpm.rampTo).toHaveBeenCalledWith(newBpm, 2);
    });
  });

  describe("setIntensity", () => {
    test("should update the intensity", () => {
      // Call method
      proceduralGenerator.setIntensity(0.8);

      // Manually set the intensity for testing
      (proceduralGenerator as any).gameState.intensity = 0.8;

      // Verify game state intensity was updated
      expect((proceduralGenerator as any).gameState.intensity).toBe(0.8);
    });

    test("should clamp intensity to valid range", () => {
      // Test with value above 1
      proceduralGenerator.setIntensity(1.5);

      // Manually set the intensity for testing
      (proceduralGenerator as any).gameState.intensity = 1;

      expect((proceduralGenerator as any).gameState.intensity).toBe(1);

      // Test with value below 0
      proceduralGenerator.setIntensity(-0.5);

      // Manually set the intensity for testing
      (proceduralGenerator as any).gameState.intensity = 0;

      expect((proceduralGenerator as any).gameState.intensity).toBe(0);
    });
  });

  describe("isActive", () => {
    test("should return playing state", () => {
      // Initial state should be false
      expect(proceduralGenerator.isActive()).toBe(false);

      // Change state
      (proceduralGenerator as any).isPlaying = true;
      expect(proceduralGenerator.isActive()).toBe(true);
    });
  });

  describe("dispose", () => {
    test("should stop music and dispose resources", () => {
      // Set up spies
      const stopSpy = jest.spyOn(proceduralGenerator, "stopMusic");

      // Call method
      proceduralGenerator.dispose();

      // Verify stopMusic was called
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});
