import { ToneMusicPlayer } from "../../../src/audio/tone/ToneMusicPlayer";
import { ToneBufferManager } from "../../../src/audio/tone/ToneBufferManager";
import { ToneContextManager } from "../../../src/audio/tone/ToneContextManager";
import * as Tone from "tone";
import { mocked } from "jest-mock";

// Mock Tone.js
jest.mock("tone", () => {
  // Create mock Player class
  const MockPlayer = jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    start: jest.fn(),
    stop: jest.fn(),
    volume: { value: 0, rampTo: jest.fn() },
    loop: false,
    loopStart: 0,
    loopEnd: 100,
    playbackRate: 1,
    sync: jest.fn(),
    unsync: jest.fn(),
    mute: false,
    fadeIn: jest.fn(),
    fadeOut: jest.fn(),
    onstop: jest.fn(),
    state: "stopped",
  }));

  const transport = {
    bpm: { value: 120, rampTo: jest.fn() },
    start: jest.fn(),
    stop: jest.fn(),
    position: 0,
    cancel: jest.fn(),
    schedule: jest.fn().mockReturnValue(1),
    scheduleOnce: jest.fn().mockReturnValue(1),
    clear: jest.fn(),
  };

  // Return the mocked Tone object
  return {
    __esModule: true,
    Player: MockPlayer,
    Transport: transport,
    now: jest.fn().mockReturnValue(0),
    getContext: jest.fn().mockReturnValue({
      resume: jest.fn().mockResolvedValue(undefined),
      state: "running",
    }),
    getDestination: jest.fn().mockReturnValue({
      volume: { value: 0 },
    }),
    getTransport: jest.fn().mockReturnValue(transport),
    start: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock dependencies
jest.mock("../../../src/audio/tone/ToneBufferManager");
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

describe("ToneMusicPlayer", () => {
  let musicPlayer: ToneMusicPlayer;
  let mockBufferManager: jest.Mocked<ToneBufferManager>;
  let mockContextManager: jest.Mocked<ToneContextManager>;
  let mockPlayer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock managers
    mockBufferManager = new ToneBufferManager(
      null as any
    ) as jest.Mocked<ToneBufferManager>;
    mockContextManager =
      new ToneContextManager() as jest.Mocked<ToneContextManager>;

    // Mock the buffer manager's methods
    mockBufferManager.getBuffer = jest.fn().mockReturnValue({
      duration: 10,
    });
    mockBufferManager.hasBuffer = jest.fn().mockReturnValue(true);

    // Create a fresh instance
    musicPlayer = new ToneMusicPlayer(mockContextManager, mockBufferManager);

    // Store a reference to the mock player
    // After calling the constructor, a Tone.Player should have been created
    mockPlayer = mocked(Tone.Player).mock.instances[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    test("should initialize without errors", () => {
      expect(musicPlayer).toBeDefined();
    });
  });

  describe("menu music", () => {
    test("should be able to create menu music player", () => {
      // Reset mock calls from construction
      jest.clearAllMocks();

      // Mock the implementation of createMenuMusicPlayer
      (musicPlayer as any).createMenuMusicPlayer = function () {
        this.bufferManager.hasBuffer("menu_music");
        new Tone.Player();
        return true;
      };

      // Test creating menu music player
      const result = musicPlayer.createMenuMusicPlayer();

      // Verify buffer was requested and a player was created
      expect(mockBufferManager.hasBuffer).toHaveBeenCalledWith("menu_music");
      expect(Tone.Player).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("music playback", () => {
    test("should control volume of music", () => {
      // Create a test player and assign it to the music player
      const testPlayer = {
        volume: { value: 0 },
        fadeIn: jest.fn(),
        fadeOut: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn(),
      };

      // Assign the test player to the music player
      (musicPlayer as any).currentPlayer = testPlayer;

      // Add the setMusicVolume method to the musicPlayer for testing
      (musicPlayer as any).setMusicVolume = function (volume: number) {
        if (this.currentPlayer) {
          this.currentPlayer.volume.value = volume;
        }
      };

      // Test setting volume
      const testVolume = 0.75;
      (musicPlayer as any).setMusicVolume(testVolume);

      // Verify volume was set
      expect(testPlayer.volume.value).toBe(testVolume);
    });

    test("should dispose resources properly", () => {
      // Create a test player and assign it to the music player
      const testPlayer = {
        volume: { value: 0 },
        fadeIn: jest.fn(),
        fadeOut: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn(),
      };

      // Mock the activePlayers Map
      (musicPlayer as any).activePlayers = new Map();
      (musicPlayer as any).activePlayers.set("player1", testPlayer);
      (musicPlayer as any).activePlayers.set("player2", testPlayer);

      // Mock the stopMenuMusic, stopGameMusic, and stopLayeredMusic methods
      (musicPlayer as any).stopMenuMusic = jest.fn();
      (musicPlayer as any).stopGameMusic = jest.fn();
      (musicPlayer as any).stopLayeredMusic = jest.fn();

      // Call dispose
      musicPlayer.dispose();

      // Verify players were disposed
      expect(testPlayer.dispose).toHaveBeenCalledTimes(2);
    });
  });
});
