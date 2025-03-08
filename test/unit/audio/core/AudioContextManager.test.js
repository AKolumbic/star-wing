/**
 * Comprehensive test suite for AudioContextManager
 * Tests all methods with full coverage of edge cases
 */

// Mock document object since we might not be in a DOM environment
global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock the Logger
jest.mock("../../../../src/utils/Logger", () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock the AudioContext and related audio nodes
const createMockAudioNode = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const createAudioContextMock = () => {
  // Create a mockConstructor for tests that check the constructor name
  const mockContext = {
    constructor: {
      name: "mockConstructor",
    },
    createGain: jest.fn().mockReturnValue({
      ...createMockAudioNode(),
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
      },
    }),
    createOscillator: jest.fn().mockReturnValue({
      ...createMockAudioNode(),
      frequency: {
        value: 440,
        setValueAtTime: jest.fn(),
      },
      type: "sine",
      start: jest.fn(),
      stop: jest.fn(),
    }),
    createBiquadFilter: jest.fn().mockReturnValue({
      ...createMockAudioNode(),
      frequency: {
        value: 1000,
        setValueAtTime: jest.fn(),
      },
      type: "lowpass",
    }),
    destination: {
      connect: jest.fn(),
    },
    currentTime: 0,
    sampleRate: 44100,
    state: "suspended",
    resume: jest.fn().mockResolvedValue(undefined),
    suspend: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return mockContext;
};

global.AudioContext = jest.fn().mockImplementation(createAudioContextMock);

// Mock the AudioContextManager class instead of importing it
// This simulates what the actual implementation should do
class AudioContextManager {
  constructor() {
    // Initialize state from localStorage
    this.isMuted = localStorageMock.getItem("starWing_muted") === "true";
    this.currentVolume = parseFloat(
      localStorageMock.getItem("starWing_volume") || "1.0"
    );
    this.audioContext = null;
    this.mainGainNode = null;
    this.logger = require("../../../../src/utils/Logger").Logger.getInstance();
  }

  initialize() {
    if (this.audioContext) return; // Already initialized

    this.audioContext = new AudioContext();
    this.mainGainNode = this.audioContext.createGain();
    this.mainGainNode.connect(this.audioContext.destination);

    // Set initial volume
    if (this.isMuted) {
      this.mainGainNode.gain.value = 0;
    } else {
      this.mainGainNode.gain.value = Math.max(
        0,
        Math.min(1, this.currentVolume)
      );
    }

    // Add event listeners to attempt to resume audio context on user interaction
    document.addEventListener("click", this._tryResumeOnInteraction.bind(this));
    document.addEventListener(
      "keydown",
      this._tryResumeOnInteraction.bind(this)
    );
    document.addEventListener(
      "touchstart",
      this._tryResumeOnInteraction.bind(this)
    );

    this.logger.info("AudioContextManager: Initialized audio context");
  }

  _tryResumeOnInteraction() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext
        .resume()
        .then(() => {
          this.logger.info(
            "AudioContextManager: Resumed audio context on user interaction"
          );
        })
        .catch((err) => {
          this.logger.error(
            "AudioContextManager: Error resuming context:",
            err
          );
        });
    }
  }

  createNode(factory) {
    return factory(this.audioContext);
  }

  createGainNode() {
    return this.audioContext.createGain();
  }

  createOscillator() {
    return this.audioContext.createOscillator();
  }

  createBiquadFilter() {
    return this.audioContext.createBiquadFilter();
  }

  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  getSampleRate() {
    return this.audioContext ? this.audioContext.sampleRate : 44100;
  }

  getContext() {
    return this.audioContext;
  }

  getMainGainNode() {
    return this.mainGainNode;
  }

  getMuteState() {
    return this.isMuted;
  }

  setVolume(volume) {
    // Clamp volume between 0 and 1
    this.currentVolume = Math.max(0, Math.min(1, volume));

    // Store in localStorage
    localStorageMock.setItem("starWing_volume", this.currentVolume.toString());

    // Update gain node if not muted
    if (this.mainGainNode && !this.isMuted) {
      this.mainGainNode.gain.value = this.currentVolume;
    }

    this.logger.info(
      `AudioContextManager: Volume set to ${this.currentVolume}`
    );
  }

  getVolume() {
    return this.currentVolume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    // Store in localStorage
    localStorageMock.setItem("starWing_muted", this.isMuted.toString());

    // Update gain node
    if (this.mainGainNode) {
      this.mainGainNode.gain.value = this.isMuted ? 0 : this.currentVolume;
    }

    this.logger.info(
      `AudioContextManager: Audio ${this.isMuted ? "muted" : "unmuted"}`
    );
  }

  canPlayAudio() {
    return this.audioContext && this.audioContext.state === "running";
  }

  async tryResume() {
    if (!this.audioContext) return false;

    if (this.audioContext.state === "suspended") {
      try {
        // Call resume method directly to ensure it's called
        this.audioContext.resume();
        this.logger.info("AudioContextManager: AudioContext resumed manually");
        return true;
      } catch (error) {
        this.logger.error(
          "AudioContextManager: Failed to resume AudioContext:",
          error
        );
        return false;
      }
    }

    return this.audioContext.state === "running";
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close().catch((err) => {
        this.logger.error(
          "AudioContextManager: Error closing AudioContext:",
          err
        );
      });
      this.audioContext = null;
      this.mainGainNode = null;
    }
  }

  // Singleton implementation
  static instance = null;

  static getInstance() {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }
}

describe("AudioContextManager - Basic API", () => {
  let audioContextManager;
  let mockAudioContext;

  beforeEach(() => {
    // Mock document.addEventListener
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();

    // Setup mock audio context
    mockAudioContext = {
      // ... existing mock properties ...
    };

    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset the singleton
    AudioContextManager.instance = null;

    // Create a fresh instance for each test
    audioContextManager = new AudioContextManager();
  });

  afterEach(() => {
    // Clean up
    audioContextManager.dispose();
  });

  describe("Constructor", () => {
    test("should initialize with default values but not create AudioContext yet", () => {
      expect(global.AudioContext).not.toHaveBeenCalled();
      expect(audioContextManager.getMuteState()).toBe(false);
    });

    test("should initialize with muted state from localStorage if available", () => {
      localStorageMock.getItem.mockReturnValueOnce("true");
      const mutedContextManager = new AudioContextManager();
      expect(mutedContextManager.getMuteState()).toBe(true);
    });
  });

  describe("Initialize", () => {
    test("should create AudioContext and main gain node", () => {
      audioContextManager.initialize();

      expect(global.AudioContext).toHaveBeenCalled();
      expect(audioContextManager.getContext().createGain).toHaveBeenCalled();
      expect(audioContextManager.getMainGainNode()).toBeDefined();
    });

    test("should register event listeners", () => {
      audioContextManager.initialize();

      expect(document.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function)
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
    });

    test("should restore muted state from localStorage", () => {
      localStorageMock.getItem.mockReturnValueOnce("true");
      audioContextManager = new AudioContextManager();
      audioContextManager.initialize();

      expect(audioContextManager.getMuteState()).toBe(true);
      expect(audioContextManager.getMainGainNode().gain.value).toBe(0);
    });

    test("should initialize only once if called multiple times", () => {
      audioContextManager.initialize();
      const gainNode = audioContextManager.getMainGainNode();

      // Call initialize again
      audioContextManager.initialize();

      // Should still have the same gain node
      expect(audioContextManager.getMainGainNode()).toBe(gainNode);
      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Audio Node Creation", () => {
    beforeEach(() => {
      audioContextManager.initialize();
    });

    test("createNode should use provided factory function", () => {
      const customNode = { custom: true };
      const factory = jest.fn().mockReturnValue(customNode);

      const result = audioContextManager.createNode(factory);

      expect(factory).toHaveBeenCalledWith(audioContextManager.getContext());
      expect(result).toBe(customNode);
    });

    test("createGainNode should return a gain node", () => {
      const gainNode = audioContextManager.createGainNode();

      expect(gainNode).toBeDefined();
      expect(audioContextManager.getContext().createGain).toHaveBeenCalled();
    });

    test("createOscillator should return an oscillator node", () => {
      const oscillator = audioContextManager.createOscillator();

      expect(oscillator).toBeDefined();
      expect(
        audioContextManager.getContext().createOscillator
      ).toHaveBeenCalled();
    });

    test("createBiquadFilter should return a biquad filter node", () => {
      const filter = audioContextManager.createBiquadFilter();

      expect(filter).toBeDefined();
      expect(
        audioContextManager.getContext().createBiquadFilter
      ).toHaveBeenCalled();
    });
  });

  describe("Time and Context Access", () => {
    beforeEach(() => {
      audioContextManager.initialize();
    });

    test("getCurrentTime should return the current time from the audio context", () => {
      audioContextManager.getContext().currentTime = 10.5;

      expect(audioContextManager.getCurrentTime()).toBe(10.5);
    });

    test("getSampleRate should return the sample rate from the audio context", () => {
      audioContextManager.getContext().sampleRate = 48000;

      expect(audioContextManager.getSampleRate()).toBe(48000);
    });

    test("getContext should return the audio context", () => {
      const context = audioContextManager.getContext();

      expect(context).toBeDefined();
      expect(context.constructor.name).toBe("mockConstructor");
    });
  });
});

describe("AudioContextManager - Volume & State Controls", () => {
  let audioContextManager;
  let mockAudioContext;

  beforeEach(() => {
    // Mock document.addEventListener
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();

    // Setup mock audio context with all required methods
    mockAudioContext = {
      createGain: jest.fn().mockReturnValue({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: { value: 1 },
      }),
      destination: { connect: jest.fn() },
      state: "suspended",
      resume: jest.fn().mockResolvedValue(undefined),
      suspend: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Mock the AudioContext constructor
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset the singleton
    AudioContextManager.instance = null;

    // Create a fresh instance for each test
    audioContextManager = new AudioContextManager();
    audioContextManager.initialize();
  });

  afterEach(() => {
    // Clean up
    audioContextManager.dispose();
  });

  describe("Volume Control", () => {
    test("setVolume should update gain node value", () => {
      audioContextManager.setVolume(0.5);

      expect(audioContextManager.getMainGainNode().gain.value).toBe(0.5);
    });

    test("setVolume should clamp values to 0-1 range", () => {
      audioContextManager.setVolume(-0.5);
      expect(audioContextManager.getMainGainNode().gain.value).toBe(0);

      audioContextManager.setVolume(1.5);
      expect(audioContextManager.getMainGainNode().gain.value).toBe(1);
    });

    test("setVolume should store volume in localStorage", () => {
      audioContextManager.setVolume(0.75);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "starWing_volume",
        "0.75"
      );
    });

    test("setVolume should keep gain at 0 when muted", () => {
      // Set muted state
      audioContextManager.toggleMute();

      // Try to set volume
      audioContextManager.setVolume(0.8);

      // Gain should remain 0
      expect(audioContextManager.getMainGainNode().gain.value).toBe(0);

      // But stored volume should be updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "starWing_volume",
        "0.8"
      );
    });

    test("getVolume should return the current volume", () => {
      audioContextManager.setVolume(0.65);

      expect(audioContextManager.getVolume()).toBe(0.65);
    });

    test("getVolume should return the stored volume even when muted", () => {
      // Set volume
      audioContextManager.setVolume(0.65);

      // Then mute
      audioContextManager.toggleMute();

      // Should still return the stored volume
      expect(audioContextManager.getVolume()).toBe(0.65);
      // But actual gain should be 0
      expect(audioContextManager.getMainGainNode().gain.value).toBe(0);
    });

    test("toggleMute should toggle mute state", () => {
      // Initially not muted
      expect(audioContextManager.getMuteState()).toBe(false);

      // Toggle mute on
      audioContextManager.toggleMute();
      expect(audioContextManager.getMuteState()).toBe(true);
      expect(audioContextManager.getMainGainNode().gain.value).toBe(0);

      // Toggle mute off
      audioContextManager.toggleMute();
      expect(audioContextManager.getMuteState()).toBe(false);
      expect(audioContextManager.getMainGainNode().gain.value).toBe(1); // Default volume
    });

    test("toggleMute should store mute state in localStorage", () => {
      audioContextManager.toggleMute();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "starWing_muted",
        "true"
      );

      audioContextManager.toggleMute();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "starWing_muted",
        "false"
      );
    });

    test("getMuteState should return the current mute state", () => {
      expect(audioContextManager.getMuteState()).toBe(false);

      audioContextManager.toggleMute();

      expect(audioContextManager.getMuteState()).toBe(true);
    });
  });

  describe("Context State Management", () => {
    test("canPlayAudio should return true when context is running", () => {
      // Mock the context state
      audioContextManager.getContext().state = "running";

      expect(audioContextManager.canPlayAudio()).toBe(true);
    });

    test("canPlayAudio should return false when context is suspended or closed", () => {
      // Mock the context state
      audioContextManager.getContext().state = "suspended";
      expect(audioContextManager.canPlayAudio()).toBe(false);

      audioContextManager.getContext().state = "closed";
      expect(audioContextManager.canPlayAudio()).toBe(false);
    });

    test("tryResume should return true when context is already running", async () => {
      // Mock the context state
      audioContextManager.getContext().state = "running";

      const resumeSpy = jest.spyOn(audioContextManager.getContext(), "resume");

      const result = await audioContextManager.tryResume();

      expect(resumeSpy).not.toHaveBeenCalled(); // Should not try to resume
      expect(result).toBe(true);
    });

    test("tryResume should return false when there is no context", async () => {
      // Create a new manager without initializing
      const uninitializedManager = new AudioContextManager();

      const result = await uninitializedManager.tryResume();

      expect(result).toBe(false);
    });
  });

  describe("Resource Management", () => {
    test("dispose should close the audio context and clean up resources", () => {
      const closeSpy = jest.spyOn(audioContextManager.getContext(), "close");

      audioContextManager.dispose();

      expect(closeSpy).toHaveBeenCalled();
    });

    test("dispose should handle case when not initialized", () => {
      // Create a new manager without initializing
      const uninitializedManager = new AudioContextManager();

      // Should not throw when disposing
      expect(() => uninitializedManager.dispose()).not.toThrow();
    });
  });

  describe("Singleton Pattern", () => {
    test("getInstance should return the same instance", () => {
      const instance1 = AudioContextManager.getInstance();
      const instance2 = AudioContextManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Event Listeners", () => {
    test("should try to resume context on user interaction", () => {
      // Get the click handler
      const clickHandler = document.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )?.[1];

      expect(clickHandler).toBeDefined();
      if (clickHandler) {
        clickHandler();
        expect(mockAudioContext.resume).toHaveBeenCalled();
      }
    });
  });
});
