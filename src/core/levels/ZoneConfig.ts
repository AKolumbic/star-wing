export type DriftPattern = "none" | "lateral" | "spiral" | "surge";

export interface ZoneConfig {
  id: number;
  name: string;
  scoreToClear: number;
  waveCount: number;
  spawnIntervalMs: {
    start: number;
    min: number;
  };
  maxAsteroids: number;
  asteroidSizeRange: [number, number];
  asteroidSpeedRange: [number, number];
  asteroidDamageRange: [number, number];
  playfield: {
    horizontalLimit: number;
    verticalLimit: number;
  };
  driftPattern: DriftPattern;
  background?: {
    starColor?: number;
    minSpeed?: number;
    maxSpeed?: number;
  };
  audioTrackId?: string;
}
