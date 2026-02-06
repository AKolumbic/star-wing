# Level Expansion Design (Zones 2-6)

## Codebase evaluation (current demo vs intended scope)
- Current playable demo is asteroid-heavy; the only concrete gameplay entity besides the player is `Asteroid`.
- The design is not limited to asteroids. Weapons and upgrade hooks already exist, and the GDD explicitly targets multi-enemy combat with hazards and bosses.
- Zones are tracked in `Scene` (`currentZone`, `currentWave`, `totalWaves`), but waves do not drive spawns yet.
- Zone completion is hard-coded for Zone 1 only (score >= 500), then a "Zone Complete" screen appears; later zones increment in HUD only.
- Backgrounds are starfield/hyperspace; audio has only level-1 layered music routing.

## Design goals for new zones
- Expand beyond asteroids with distinct enemy types, hazards, pickups, and bosses.
- Use waves to structure pacing (6-8 waves + boss per zone).
- Keep progression data-driven so tuning is low-touch.
- Support future procedural variation (enemy mix randomization within a zone palette).

## Core entity roster (for zone design)

### Enemies
- Raider (light fighter): fast, low HP, swarm behavior.
- Striker (interceptor): very fast, short bursts, high accuracy, low HP.
- Bomber (heavy): slow, launches missiles, weak-point crit.
- Turret Drone (stationary): area denial, slow rotation, medium HP.
- Sentinel (shielded): slow, high HP, shield regen unless flanked.
- Carrier Pod (miniboss): spawns 2-3 Raiders over time until destroyed.

### Hazards
- Asteroids (existing): size and speed ranges vary by zone.
- Debris Fields: slow-moving hull fragments, block shots.
- Proximity Mines: detonate near player, clearable by shooting.
- Radiation Clouds: drain shields while inside.
- Gravity Rifts: subtle pull to constrain movement.

### Pickups
- Shield Cell: +15-25 shield.
- Hull Patch: +10-20 health.
- Overclock: 8s fire-rate boost.
- Ammo Cache: restores limited-ammo weapons (future-proof).
- Score Cache: bonus points, no combat impact.

## Proposed data-driven config (per zone)
```
ZoneConfig {
  id: number
  name: string
  scoreToClear: number
  waveCount: number
  spawnIntervalMs: { start: number, min: number }
  maxAsteroids: number
  asteroidSizeRange: [number, number]
  asteroidSpeedRange: [number, number]
  enemyPalette: EnemyType[]
  hazardPalette: HazardType[]
  pickupPalette: PickupType[]
  bossId: string
  playfield: { horizontalLimit: number, verticalLimit: number }
  background: { starColor: number, minSpeed: number, maxSpeed: number }
  audioTrackId: string
}
```

## Zone designs

### Zone 2: Shatter Belt
- Theme: unstable mining belt with pirate raiders.
- Core feel: fast swarms, light hazards, short recovery windows.
- Enemy palette: Raider, Striker, Carrier Pod (miniboss-lite in wave 6).
- Hazards: small/medium asteroids, light debris.
- Pickups: shield cells more common than hull.
- Boss: "Razorback" (light corvette) with two side cannons.
- Wave structure (8):
  - W1-2: Raider swarms + sparse asteroids
  - W3: Striker pairs + debris lanes
  - W4: Raider + Striker mix, faster spawns
  - W5: Escort Carrier Pod
  - W6: Hazard spike (dense small asteroids)
  - W7: Mixed wave, pickups
  - W8: Boss

### Zone 3: Graveyard Drift
- Theme: derelict ship graveyard with slow, heavy enemies.
- Core feel: fewer targets but higher damage, methodical targeting.
- Enemy palette: Bomber, Turret Drone, Sentinel.
- Hazards: large asteroids, drifting wrecks, proximity mines.
- Pickups: hull patches slightly more common.
- Boss: "Mortuary" (destroyer hulk) with 3 weak-point nodes.
- Wave structure (8):
  - W1: Turret Drone field + light asteroids
  - W2: Bomber + Sentinel escort
  - W3: Mines + slow debris
  - W4: Bomber pairs + shielded Sentinel
  - W5: Turret Drone clusters
  - W6: Mixed heavy wave
  - W7: Recovery/pickups
  - W8: Boss

### Zone 4: Needle Field
- Theme: narrow corridor of high-velocity fragments.
- Core feel: tight movement, precision dodging, rapid target switches.
- Enemy palette: Striker, Raider, Turret Drone.
- Hazards: "needle" asteroids (small, fast), gravity rifts (light pull).
- Pickups: overclock appears once per zone.
- Boss: "Spindle" (fast frigate) with rotating beam.
- Wave structure (8):
  - W1-2: Striker-heavy skirmishes
  - W3: Turret Drone gates (lane control)
  - W4: Needle-asteroid surge
  - W5: Mixed wave + pickups
  - W6: Striker swarms
  - W7: Calm window (recovery)
  - W8: Boss

### Zone 5: Slipstream
- Theme: turbulent currents with lateral flow reversals.
- Core feel: predictable flow then sudden reversals; positional discipline.
- Enemy palette: Raider, Bomber, Sentinel.
- Hazards: lateral drift, radiation pockets, medium asteroids.
- Pickups: shield cells during reversal moments.
- Boss: "Leviathan" (armored cruiser) with shield phases.
- Wave structure (8):
  - W1: Raider swarms (flow left)
  - W2: Sentinel escort wave
  - W3: Bomber + radiation pocket
  - W4: Flow reversal + mixed wave
  - W5: Heavy wave + pickups
  - W6: Hazard spike (radiation + asteroids)
  - W7: Mixed wave
  - W8: Boss

### Zone 6: Core Storm
- Theme: violent storm core; maximum intensity.
- Core feel: constant pressure, surge windows.
- Enemy palette: Striker, Bomber, Sentinel, Carrier Pod.
- Hazards: dense asteroids, gravity rifts, radiation clouds.
- Pickups: rare, mostly tactical (overclock or hull patch).
- Boss: "Apex" (multi-phase dreadnought) with weak-point cycling.
- Wave structure (8):
  - W1: Striker swarm + rifts
  - W2: Bomber pairs + Sentinels
  - W3: Carrier Pod + hazards
  - W4: Surge (spawn rate spike)
  - W5: Mixed wave + pickup
  - W6: Heavy wave
  - W7: Recovery window
  - W8: Boss

## Minimal implementation notes (if you want these playable)
- Add `ZoneConfig[]` (e.g., `src/core/levels/ZoneConfigs.ts`) and apply on zone start in `Scene`.
- Add an `EnemySystem` with a factory for each enemy type; wire to `Scene` update loop.
- Implement a basic wave director (score/time thresholds) that spawns enemy groups from the zone palette.
- Parameterize `spawnAsteroid()` to use per-zone ranges and hazard patterns.
- Extend `AudioManager` to handle level2+ tracks and per-zone layers.
- Use `BackgroundManager` params per zone (color/speed) to reinforce theme.
