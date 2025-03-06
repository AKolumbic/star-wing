/**
 * Procedural music generator for Star Wing
 * Creates synthesized soundtrack in real-time
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";

export class ProceduralMusicGenerator {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Bass oscillator */
  private bassOscillator: OscillatorNode | null = null;

  /** Hi-hat noise source */
  private noiseSource: AudioBufferSourceNode | null = null;

  /** Arpeggio oscillator */
  private arpeggioOscillator: OscillatorNode | null = null;

  /** Bass arpeggio oscillator */
  private bassArpeggioOscillator: OscillatorNode | null = null;

  /** Main gain node */
  private gainNode: GainNode | null = null;

  /** Next note time for scheduling */
  private nextNoteTime: number = 0;

  /** State tracking */
  private isPlaying: boolean = false;
  private patternMode: "menu" | "game" = "menu";

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(contextManager: AudioContextManager) {
    this.contextManager = contextManager;
    this.logger.info("ProceduralMusicGenerator: Initialized");
  }

  /**
   * Checks whether the procedural music generator is currently active
   */
  public isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Starts the procedural menu music
   */
  public startMenuMusic(): void {
    if (this.isPlaying) {
      return;
    }

    this.patternMode = "menu";
    this.isPlaying = true;

    // Set up next note time
    this.nextNoteTime = this.contextManager.getCurrentTime();

    // Start procedural audio
    this.startProceduralAudio();

    this.logger.info("ProceduralMusicGenerator: Started menu music");
  }

  /**
   * Transitions to game music by adjusting pattern parameters
   */
  public transitionToGameMusic(): void {
    if (!this.isPlaying) {
      // If not playing, just start with game mode
      this.startGameMusic();
      return;
    }

    this.logger.info("ProceduralMusicGenerator: Transitioning to game music");

    // Change pattern mode - this will affect future pattern generation
    this.patternMode = "game";

    // As patterns continue to be scheduled, they'll pick up the new pattern mode

    this.logger.info("ProceduralMusicGenerator: Transitioned to game music");
  }

  /**
   * Starts the game music with more intense patterns
   */
  public startGameMusic(): void {
    if (this.isPlaying) {
      this.stop();
    }

    this.patternMode = "game";
    this.isPlaying = true;

    // Set up next note time
    this.nextNoteTime = this.contextManager.getCurrentTime();

    // Start procedural audio with game mode patterns
    this.startProceduralAudio();

    this.logger.info("ProceduralMusicGenerator: Started game music");
  }

  /**
   * Starts all procedural audio patterns
   */
  private startProceduralAudio(): void {
    // Try to resume audio context if needed
    this.contextManager.tryResume().catch((err) => {
      this.logger.error(
        "ProceduralMusicGenerator: Error resuming audio context:",
        err
      );
    });

    // Create a common gain node for all patterns
    this.gainNode = this.contextManager.createNode((ctx) => ctx.createGain());

    // Different volume based on pattern mode
    const volumeLevel = this.patternMode === "menu" ? 0.15 : 0.2;
    this.gainNode.gain.value = volumeLevel;

    // Connect to main output
    this.gainNode.connect(this.contextManager.getMainGainNode());

    // Start all patterns
    this.schedulePatterns();
  }

  /**
   * Schedule all music patterns
   */
  private schedulePatterns(): void {
    if (this.contextManager.getMuteState()) {
      return; // Don't play if muted
    }

    // Create and schedule different patterns
    this.createBassPattern();
    this.createHihatPattern();
    this.createArpeggioPattern();
    this.createBassArpeggioPattern();
  }

  /**
   * Creates the bass drum pattern
   */
  private createBassPattern(): void {
    try {
      // Bass parameters based on current pattern mode
      const bassFreq = this.patternMode === "menu" ? 73.42 : 110.0; // D2 for menu, A2 for game

      // Create oscillator
      this.bassOscillator = this.contextManager.createNode((ctx) =>
        ctx.createOscillator()
      );
      this.bassOscillator.type = "triangle";
      this.bassOscillator.frequency.value = bassFreq;

      // Create bass-specific gain node for envelope
      const bassGain = this.contextManager.createNode((ctx) =>
        ctx.createGain()
      );
      bassGain.gain.value = 0;

      // Connect nodes
      this.bassOscillator.connect(bassGain);
      bassGain.connect(this.gainNode!);

      // Start oscillator
      this.bassOscillator.start();

      // Create rhythm pattern
      const bassBeatDuration = 0.5; // 120 BPM
      const scheduleAheadTime = 0.1;

      // Bass pattern (will repeat)
      const menuBassPattern = [1, 0, 0, 0, 1, 0, 0, 0]; // Simple for menu
      const gameBassPattern = [1, 0, 0, 1, 1, 0, 1, 0]; // More complex for game

      let bassStep = 0;
      let nextBassNoteTime = this.contextManager.getCurrentTime();

      // Schedule the bass pattern
      const scheduleBassDrum = () => {
        const currentTime = this.contextManager.getCurrentTime();

        // Schedule ahead
        while (nextBassNoteTime < currentTime + scheduleAheadTime) {
          // Get the current pattern based on mode
          const bassPattern =
            this.patternMode === "menu" ? menuBassPattern : gameBassPattern;

          // Check if we should play a note in this step
          const shouldPlay = bassPattern[bassStep] === 1;

          if (shouldPlay) {
            // Set up envelope for this beat
            bassGain.gain.cancelScheduledValues(nextBassNoteTime);
            bassGain.gain.setValueAtTime(0, nextBassNoteTime);
            bassGain.gain.linearRampToValueAtTime(0.7, nextBassNoteTime + 0.01);
            bassGain.gain.linearRampToValueAtTime(0, nextBassNoteTime + 0.4);
          }

          // Move to next step
          bassStep = (bassStep + 1) % bassPattern.length;
          nextBassNoteTime += bassBeatDuration;
        }

        // Only continue if still playing
        if (this.isPlaying) {
          setTimeout(scheduleBassDrum, 25);
        }
      };

      // Start the scheduler
      scheduleBassDrum();
    } catch (error) {
      this.logger.error("Error creating bass pattern:", error);
    }
  }

  /**
   * Creates the hi-hat pattern
   */
  private createHihatPattern(): void {
    // Similar pattern-based scheduling using noise source for hi-hats
    // Implementation will follow the pattern established in createBassPattern
    // but with appropriate adjustments for hi-hat sound
  }

  /**
   * Creates the arpeggio pattern
   */
  private createArpeggioPattern(): void {
    // Implementation for melodic arpeggios following same pattern-based approach
    // but with melodic note sequences that vary based on patternMode
  }

  /**
   * Creates the bass arpeggio pattern
   */
  private createBassArpeggioPattern(): void {
    // Implementation for bass arpeggios similar to above
  }

  /**
   * Stops all procedural audio
   */
  public stop(): void {
    this.isPlaying = false;

    // Stop and disconnect all audio nodes
    const nodeList = [
      this.bassOscillator,
      this.noiseSource,
      this.arpeggioOscillator,
      this.bassArpeggioOscillator,
      this.gainNode,
    ];

    for (const node of nodeList) {
      if (node) {
        try {
          if (
            node instanceof OscillatorNode ||
            node instanceof AudioBufferSourceNode
          ) {
            node.stop();
          }
          node.disconnect();
        } catch (error) {
          // Ignore errors when stopping
        }
      }
    }

    // Clear references
    this.bassOscillator = null;
    this.noiseSource = null;
    this.arpeggioOscillator = null;
    this.bassArpeggioOscillator = null;
    this.gainNode = null;

    this.logger.info("ProceduralMusicGenerator: Stopped");
  }

  /**
   * Disposes of the procedural music generator and releases all resources
   */
  public dispose(): void {
    this.logger.info("ProceduralMusicGenerator: Disposing resources");
    this.stop();
    // Any additional cleanup beyond stop() if needed in the future
  }
}
