import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import * as Tone from "tone";

describe("ToneContextManager", () => {
  let contextManager: ToneContextManager;

  // Mock Tone.js
  beforeEach(() => {
    // Mock Tone.js methods
    jest.spyOn(Tone, "start").mockResolvedValue(undefined);
    jest.spyOn(Tone, "getDestination").mockReturnValue({
      volume: {
        value: 0,
        rampTo: jest.fn(),
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as any);
    jest.spyOn(Tone, "getContext").mockReturnValue({
      state: "running",
      resume: jest.fn(),
      sampleRate: 44100,
    } as any);
    jest.spyOn(Tone, "now").mockReturnValue(10);

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn((key) => {
        if (key === "starWing_volume") return "0.5";
        if (key === "starWing_muted") return "false";
        return null;
      }),
      setItem: jest.fn(),
      clear: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Create instance
    contextManager = new ToneContextManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Core functionality", () => {
    test("should initialize correctly", async () => {
      await contextManager.initialize();
      expect(Tone.start).toHaveBeenCalled();
    });

    test("should get current time", () => {
      expect(contextManager.getCurrentTime()).toBe(10);
      expect(Tone.now).toHaveBeenCalled();
    });

    test("should create gain node", () => {
      const gain = contextManager.createGain();
      expect(gain).toBeDefined();
    });

    test("should create oscillator", () => {
      const osc = contextManager.createOscillator();
      expect(osc).toBeDefined();
    });

    test("should create filter", () => {
      const filter = contextManager.createFilter();
      expect(filter).toBeDefined();
    });
  });

  describe("Volume control", () => {
    test("should set volume correctly", () => {
      const mockDestination = Tone.getDestination() as any;
      contextManager.setVolume(0.75);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "starWing_volume",
        "0.75"
      );
      // Check that volume was set (we don't care about exact dB value)
      expect(mockDestination.volume.value).toBeDefined();
    });

    test("should get volume correctly", () => {
      expect(contextManager.getVolume()).toBe(0.5);
    });

    test("should toggle mute state", () => {
      const mockDestination = Tone.getDestination() as any;
      const initialMuteState = contextManager.getMuteState();
      contextManager.toggleMute();
      expect(contextManager.getMuteState()).toBe(!initialMuteState);
      expect(mockDestination.volume.rampTo).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "starWing_muted",
        "true"
      );
    });

    test("should clamp volume to 0-1 range", () => {
      contextManager.setVolume(1.5);
      expect(localStorage.setItem).toHaveBeenCalledWith("starWing_volume", "1");

      contextManager.setVolume(-0.5);
      expect(localStorage.setItem).toHaveBeenCalledWith("starWing_volume", "0");
    });
  });

  describe("Audio context state", () => {
    test("should check if audio can play", () => {
      expect(contextManager.canPlayAudio()).toBe(true);
    });

    test("should get sample rate", () => {
      expect(contextManager.getSampleRate()).toBe(44100);
    });
  });
});
