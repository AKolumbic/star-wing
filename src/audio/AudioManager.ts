export class AudioManager {
  private audioContext: AudioContext;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private mainGainNode: GainNode;
  private nextNoteTime: number = 0;
  private schedulerTimer: number | null = null;

  // D minor scale frequencies
  private dFrequency: number = 73.42; // D2
  private fFrequency: number = 87.31; // F2
  private aFrequency: number = 110.0; // A2
  private cFrequency: number = 130.81; // C3

  // Kavinsky-inspired patterns - simple and driving
  private bassPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  // D minor arpeggio pattern: D, F, A, C, A, F
  private arpeggioPattern = [
    0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1, 0, -1, 1, -1, 2,
    -1, 3, -1, 2, -1, 1, -1, 0, 2, 3, 1,
  ];

  // Frequency lookup for arpeggios
  private arpeggioNotes = [
    this.dFrequency * 2, // D3
    this.fFrequency * 2, // F3
    this.aFrequency * 2, // A3
    this.cFrequency * 2, // C4
  ];

  private synthArpPattern = [
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 0],
    [0, 1],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 0],
    [0, 1],
    [0, 0],
    [0, 0],
    [1, 1],
  ]; // [D, A] notes

  private currentBeat: number = 0;
  private tempo: number = 120; // Increased from 50 to 120 BPM

  constructor() {
    // Create audio context
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Create main gain node for volume control
    this.mainGainNode = this.audioContext.createGain();

    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem("starWing_muted");
    this.isMuted = savedMuteState ? savedMuteState === "true" : false;

    // Set default volume to 25% if nothing is stored
    if (!localStorage.getItem("starWing_volume")) {
      localStorage.setItem("starWing_volume", "0.25");
    }

    // Set initial volume
    const volume = this.isMuted ? 0 : this.getVolume() * 0.6;
    this.mainGainNode.gain.value = volume;

    this.mainGainNode.connect(this.audioContext.destination);

    console.log("AudioManager: Constructor completed, audio context created");
  }

  // Play a simple test tone to verify audio is working
  playTestTone(): void {
    if (!this.audioContext) {
      console.error("AudioManager: Cannot play test tone - no audio context");
      return;
    }

    if (this.audioContext.state === "suspended") {
      console.log("AudioManager: Resuming audio context");
      this.audioContext.resume();
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440; // A4

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.05; // Much lower gain - 5% volume

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.3); // Shorter duration - just 0.3 seconds
    } catch (error) {
      console.error("AudioManager: Error playing test tone:", error);
    }
  }

  public initialize(): void {
    if (this.isInitialized) return;

    console.log("AudioManager: Initializing");

    try {
      if (!this.audioContext) {
        // Fix typing for webkitAudioContext
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        // Create main gain node (master volume) with much lower volume
        this.mainGainNode = this.audioContext.createGain();
        this.mainGainNode.gain.value = 0.1; // Reduced from 0.6 to 0.1
        this.mainGainNode.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
          console.log(
            "AudioManager: Audio context is suspended, will resume on user interaction"
          );
        }
      }
    } catch (error) {
      console.error("AudioManager: Error initializing audio context:", error);
    }
  }

  public playMenuThump(): void {
    if (!this.isInitialized) {
      console.log("AudioManager: Not initialized, initializing now");
      this.initialize();
    }

    if (this.isPlaying) {
      return;
    }

    try {
      this.isPlaying = true;
      this.nextNoteTime = this.audioContext.currentTime;
      this.scheduleBeats();
    } catch (err) {
      console.error("AudioManager: Error starting audio playback:", err);
    }
  }

  public stopMusic(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number): void {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // If not muted, apply the volume directly
    if (!this.isMuted) {
      this.mainGainNode.gain.value = clampedVolume * 0.6; // Scale to max 0.6
    }

    // Store the volume setting for when unmuted
    localStorage.setItem("starWing_volume", clampedVolume.toString());
  }

  public getVolume(): number {
    // Get volume from localStorage or use default (0.25 = 25%)
    const storedVolume = localStorage.getItem("starWing_volume");
    return storedVolume ? parseFloat(storedVolume) : 0.25;
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;

    // When muted, set volume to 0, otherwise restore to saved volume
    const volume = this.isMuted ? 0 : this.getVolume() * 0.6;
    this.mainGainNode.gain.value = volume;

    // Store mute state in localStorage
    localStorage.setItem("starWing_muted", this.isMuted.toString());
  }

  private scheduleBeats(): void {
    // Schedule several beats ahead
    while (this.nextNoteTime < this.audioContext.currentTime + 0.2) {
      // Play bass
      if (this.bassPattern[this.currentBeat]) {
        this.playBass(this.nextNoteTime);
      }

      // Play arpeggio
      const arpeggioNote = this.arpeggioPattern[this.currentBeat];
      if (arpeggioNote >= 0) {
        this.playArpeggio(this.nextNoteTime, this.arpeggioNotes[arpeggioNote]);
      }

      // Advance to next beat
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += secondsPerBeat / 4; // 16th notes for synth wave feel
      this.currentBeat = (this.currentBeat + 1) % this.arpeggioPattern.length;
    }

    // Schedule next batch of beats
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleBeats();
    }, 50); // Check more frequently
  }

  private playBass(time: number): void {
    // Simplified bass - just use a sine wave at higher volume
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = this.dFrequency;

    // Bass gain with MUCH lower volume
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0;

    // Connect through main gain node for volume control
    bassOsc.connect(bassGain);
    bassGain.connect(this.mainGainNode);

    // Start the oscillator
    bassOsc.start(time);

    // Simple envelope with reduced volume
    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(0.15, time + 0.01); // Reduced from 0.7 to 0.15
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    // Stop the oscillator
    bassOsc.stop(time + 0.6);
  }

  private playArpeggio(time: number, frequency: number): void {
    // Simplified arpeggio - use square wave for more presence
    const arpeggioOsc = this.audioContext.createOscillator();
    arpeggioOsc.type = "square";
    arpeggioOsc.frequency.value = frequency;

    // Gain with MUCH lower volume
    const arpeggioGain = this.audioContext.createGain();
    arpeggioGain.gain.value = 0;

    // Connect through main gain node
    arpeggioOsc.connect(arpeggioGain);
    arpeggioGain.connect(this.mainGainNode);

    // Start oscillator
    arpeggioOsc.start(time);

    // Simple envelope with reduced volume
    arpeggioGain.gain.setValueAtTime(0, time);
    arpeggioGain.gain.linearRampToValueAtTime(0.1, time + 0.01); // Reduced from 0.5 to 0.1
    arpeggioGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    // Stop oscillator
    arpeggioOsc.stop(time + 0.25);
  }

  private playSynth(time: number, frequency: number): void {
    // Classic 80s synth sound - PWM-like
    const synthOsc = this.audioContext.createOscillator();
    synthOsc.type = "square";
    synthOsc.frequency.value = frequency;

    // Create slight detune for thickness
    const detuneOsc = this.audioContext.createOscillator();
    detuneOsc.type = "square";
    detuneOsc.frequency.value = frequency * 1.003; // Slight detune

    // Create gain for envelope
    const synthGain = this.audioContext.createGain();
    synthGain.gain.value = 0;

    // Create filter for that 80s sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    filter.Q.value = 5;

    // Create chorus effect with delay
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.03;
    const delayGain = this.audioContext.createGain();
    delayGain.gain.value = 0.2;

    // Connect everything
    synthOsc.connect(synthGain);
    detuneOsc.connect(synthGain);
    synthGain.connect(filter);
    filter.connect(this.mainGainNode);

    // Chorus effect connection
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.mainGainNode);

    // Start oscillators
    synthOsc.start(time);
    detuneOsc.start(time);

    // Classic synth ADSR envelope (shortened for faster tempo)
    synthGain.gain.setValueAtTime(0, time);
    synthGain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Attack
    synthGain.gain.linearRampToValueAtTime(0.2, time + 0.15); // Decay to sustain
    synthGain.gain.setValueAtTime(0.2, time + 0.2); // Sustain
    synthGain.gain.linearRampToValueAtTime(0, time + 0.4); // Release

    // Stop oscillators
    synthOsc.stop(time + 0.5);
    detuneOsc.stop(time + 0.5);
  }
}
