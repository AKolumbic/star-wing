import {
  EnvironmentPresets,
  GameplayPresets,
  blendPresets,
  getEnvironmentPreset,
  getGameplayPreset,
} from "../../../src/audio/tone/ToneEffectPresets";

describe("ToneEffectPresets", () => {
  describe("EnvironmentPresets", () => {
    test("should contain space preset", () => {
      expect(EnvironmentPresets.space).toBeDefined();
      expect(EnvironmentPresets.space.name).toBe("Space");
      expect(EnvironmentPresets.space.effects).toHaveLength(2);
      expect(EnvironmentPresets.space.effects[0].type).toBe("reverb");
      expect(EnvironmentPresets.space.effects[1].type).toBe("filter");
    });

    test("should contain cave preset", () => {
      expect(EnvironmentPresets.cave).toBeDefined();
      expect(EnvironmentPresets.cave.name).toBe("Cave");
      expect(
        EnvironmentPresets.cave.effects.some((e) => e.type === "delay")
      ).toBe(true);
      expect(
        EnvironmentPresets.cave.effects.some((e) => e.type === "reverb")
      ).toBe(true);
    });
  });

  describe("getEnvironmentPreset", () => {
    test("should return space preset when space is requested", () => {
      const preset = getEnvironmentPreset("space");
      expect(preset).toEqual(EnvironmentPresets.space);
    });

    test("should return space preset for unknown environment", () => {
      const preset = getEnvironmentPreset("unknown");
      expect(preset).toEqual(EnvironmentPresets.space);
    });

    test("should return correct preset case-insensitively", () => {
      const preset = getEnvironmentPreset("SpAcE");
      expect(preset).toEqual(EnvironmentPresets.space);
    });
  });

  describe("getGameplayPreset", () => {
    test("should return null for unknown gameplay preset", () => {
      const preset = getGameplayPreset("unknown");
      expect(preset).toBeNull();
    });
  });

  describe("blendPresets", () => {
    test("should blend two presets with default ratio", () => {
      const preset1 = EnvironmentPresets.space;
      const preset2 = EnvironmentPresets.cave;

      const blended = blendPresets(preset1, preset2);

      expect(blended.name).toBe("Blend: Space + Cave");
      expect(blended.effects.length).toBeGreaterThanOrEqual(
        Math.max(preset1.effects.length, preset2.effects.length)
      );
    });

    test("should favor preset1 with ratio close to 0", () => {
      const preset1 = EnvironmentPresets.space;
      const preset2 = EnvironmentPresets.cave;

      const blended = blendPresets(preset1, preset2, 0.1);

      // The blended preset should more closely resemble preset1
      // We'll check a specific parameter as an example
      const reverbEffect = blended.effects.find((e) => e.type === "reverb");
      const preset1Reverb = preset1.effects.find((e) => e.type === "reverb");

      expect(reverbEffect).toBeDefined();
      expect(preset1Reverb).toBeDefined();

      if (reverbEffect && preset1Reverb) {
        // The wet parameter should be closer to preset1's value
        const wetDifferenceToPreset1 = Math.abs(
          (reverbEffect.params?.wet || 0) - (preset1Reverb.params?.wet || 0)
        );

        expect(wetDifferenceToPreset1).toBeLessThan(0.2);
      }
    });

    test("should handle presets with different effect types", () => {
      // Create test presets with different effects
      const preset1 = {
        name: "Test1",
        description: "Test preset 1",
        effects: [
          {
            type: "reverb" as const,
            params: { wet: 0.5, decay: 2 },
          },
        ],
      };

      const preset2 = {
        name: "Test2",
        description: "Test preset 2",
        effects: [
          {
            type: "delay" as const,
            params: { delayTime: 0.3, feedback: 0.4 },
          },
        ],
      };

      const blended = blendPresets(preset1, preset2);

      // Should contain both effect types
      expect(blended.effects.some((e) => e.type === "reverb")).toBe(true);
      expect(blended.effects.some((e) => e.type === "delay")).toBe(true);
      expect(blended.effects).toHaveLength(2);
    });
  });
});
