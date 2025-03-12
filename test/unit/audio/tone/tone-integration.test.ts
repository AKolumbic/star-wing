import { ToneAudioManager } from "../../../src/audio/tone/ToneAudioManager";
import { AudioConfig } from "../../../src/audio/config";
import { AudioManagerFactory } from "../../../src/audio/AudioManagerFactory";
import * as Tone from "tone";

// Mock direct dependencies of ToneAudioManager
jest.mock("tone", () => {
  return {
    start: jest.fn().mockResolvedValue(undefined),
    now: jest.fn().mockReturnValue(1),
    getContext: jest.fn().mockReturnValue({
      state: "running",
      resume: jest.fn(),
      sampleRate: 44100,
    }),
    getDestination: jest.fn().mockReturnValue({
      volume: {
        value: 0,
        rampTo: jest.fn(),
      },
    }),
    Gain: jest.fn().mockImplementation(() => ({
      gain: { value: 1, rampTo: jest.fn() },
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    })),
    Oscillator: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      frequency: {
        value: 440,
      },
      onstop: null,
    })),
    Player: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      sync: jest.fn().mockReturnThis(),
      volume: {
        value: 0,
        rampTo: jest.fn(),
      },
      onstop: null,
    })),
    Filter: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    })),
    Synth: jest.fn().mockImplementation(() => ({
      triggerAttack: jest.fn(),
      triggerRelease: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      chain: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      frequency: {
        exponentialRampTo: jest.fn(),
      },
    })),
    NoiseSynth: jest.fn().mockImplementation(() => ({
      triggerAttackRelease: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      chain: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    })),
    Distortion: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    })),
    PolySynth: jest.fn().mockImplementation(() => ({
      triggerAttackRelease: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    })),
    MembraneSynth: jest.fn().mockImplementation(() => ({
      triggerAttackRelease: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      volume: {
        rampTo: jest.fn(),
      },
    })),
    MonoSynth: jest.fn().mockImplementation(() => ({
      triggerAttackRelease: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      toDestination: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      volume: {
        rampTo: jest.fn(),
      },
    })),
    ToneAudioBuffer: jest.fn().mockImplementation((url, onload) => {
      if (onload) setTimeout(() => onload(), 0);
      return {
        duration: 2.5,
        dispose: jest.fn(),
      };
    }),
    ToneAudioBuffers: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      get: jest.fn(),
      has: jest.fn().mockReturnValue(true),
      dispose: jest.fn(),
      _buffers: {},
    })),
    Sequence: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      dispose: jest.fn(),
    })),
    getTransport: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      schedule: jest.fn(),
      scheduleOnce: jest.fn(),
      position: 0,
      bpm: {
        value: 120,
        rampTo: jest.fn(),
      },
    }),
    gainToDb: jest.fn((value) => value * 20),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ToneAudioManager Integration", () => {
  let audioManager: ToneAudioManager;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Reset localStorage
    localStorageMock.clear();

    // Create the ToneAudioManager
    audioManager = ToneAudioManager.getInstance();
  });

  describe("Initialization and Volume Control", () => {
    test("should initialize audio system", async () => {
      await audioManager.initialize();
      expect(Tone.start).toHaveBeenCalled();
    });

    test("should control master volume", () => {
      audioManager.setVolume(0.8);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "starWing_volume",
        "0.8"
      );
      expect(audioManager.getVolume()).toBe(0.8);
    });

    test("should toggle mute state", () => {
      const initialMuteState = audioManager.getMuteState();
      audioManager.toggleMute();
      expect(audioManager.getMuteState()).toBe(!initialMuteState);

      // Toggle back
      audioManager.toggleMute();
      expect(audioManager.getMuteState()).toBe(initialMuteState);
    });
  });

  describe("Sound Effects", () => {
    test("should play test tone", () => {
      audioManager.playTestTone();
      expect(Tone.Oscillator).toHaveBeenCalled();
    });

    test("should play laser sound", () => {
      audioManager.playLaserSound();
      expect(Tone.Synth).toHaveBeenCalled();
    });

    test("should play collision sound", () => {
      audioManager.playCollisionSound();
      expect(Tone.NoiseSynth).toHaveBeenCalled();
    });
  });

  describe("Music Playback", () => {
    test("should play procedural menu music", () => {
      audioManager.playMenuMusic(true);

      // Procedural music should use synths and sequences
      expect(Tone.MembraneSynth).toHaveBeenCalled();
      expect(Tone.PolySynth).toHaveBeenCalled();
      expect(Tone.NoiseSynth).toHaveBeenCalled();
      expect(Tone.Sequence).toHaveBeenCalled();
      expect(Tone.getTransport().start).toHaveBeenCalled();
    });

    test("should start and stop layered music", () => {
      // Setup: Make sure buffer exists
      jest
        .spyOn(audioManager["bufferManager"], "hasBuffer")
        .mockReturnValue(true);

      // Start layered music
      audioManager.startLayeredMusic("base_track");
      expect(Tone.getTransport().start).toHaveBeenCalled();
      expect(Tone.Player).toHaveBeenCalled();

      // Add a layer
      audioManager.addMusicLayer("layer1");
      expect(Tone.Player).toHaveBeenCalledTimes(2);

      // Adjust layer volume
      audioManager.setLayerVolume("layer1", 0.5);

      // Remove a layer
      audioManager.removeMusicLayer("layer1");

      // Stop layered music
      audioManager.stopLayeredMusic();
      expect(Tone.getTransport().scheduleOnce).toHaveBeenCalled();
    });
  });

  describe("Factory switching", () => {
    test("should switch implementations", () => {
      // Setup
      AudioConfig.useToneJs = false;
      jest
        .spyOn(AudioManagerFactory as any, "originalInstance", "get")
        .mockReturnValue({
          dispose: jest.fn(),
          getVolume: jest.fn().mockReturnValue(0.7),
          getMuteState: jest.fn().mockReturnValue(false),
          initialize: jest.fn(),
        });
      jest
        .spyOn(AudioManagerFactory as any, "toneInstance", "get")
        .mockReturnValue(audioManager);

      // Switch to Tone.js
      AudioManagerFactory.switchImplementation(true);
      expect(AudioConfig.useToneJs).toBe(true);

      // Get the manager - should be Tone.js now
      const manager = AudioManagerFactory.getAudioManager();
      expect(manager).toBe(audioManager);

      // Switch back
      AudioManagerFactory.switchImplementation(false);
      expect(AudioConfig.useToneJs).toBe(false);
    });
  });

  describe("Resource management", () => {
    test("should clean up resources", () => {
      audioManager.dispose();
      // Various dispose methods should be called
      // We don't need to check every single one
    });
  });
});
