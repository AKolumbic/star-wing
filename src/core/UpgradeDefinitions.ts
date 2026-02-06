import { Ship } from "../entities/Ship";
import { WeaponSystem } from "../weapons/WeaponSystem";

/**
 * Categories of upgrades available in the game.
 */
export type UpgradeCategory = "weapon" | "defense" | "special" | "economy";

/**
 * Rarity levels for upgrades, affecting their appearance frequency.
 */
export type UpgradeRarity = "common" | "uncommon" | "rare";

/**
 * Defines a single upgrade that can be offered to the player.
 */
export interface UpgradeDefinition {
  /** Unique identifier for this upgrade */
  id: string;
  /** Display name shown on the upgrade card */
  name: string;
  /** Short description of the upgrade's effect */
  description: string;
  /** Category for visual grouping and filtering */
  category: UpgradeCategory;
  /** Text glyph displayed on the upgrade card */
  icon: string;
  /** Rarity affects how often this upgrade appears */
  rarity: UpgradeRarity;
  /** Whether this upgrade can be selected multiple times */
  stackable: boolean;
  /** Maximum number of times this upgrade can be selected */
  maxStacks: number;
  /** Minimum zone number before this upgrade can appear */
  minZone: number;
  /** Function that applies this upgrade's effect to the game state */
  applyEffect: (ship: Ship, weaponSystem: WeaponSystem) => void;
}

/**
 * The complete pool of upgrades available in the game.
 * Organized by category as specified in the Game Design Document.
 */
export const UPGRADE_POOL: UpgradeDefinition[] = [
  // ===== WEAPON UPGRADES =====
  {
    id: "wpn_fire_rate",
    name: "Overclocked Trigger",
    description: "-25% weapon cooldown. Faster firing rate.",
    category: "weapon",
    icon: ">>",
    rarity: "common",
    stackable: true,
    maxStacks: 3,
    minZone: 1,
    applyEffect: (ship: Ship, weaponSystem: WeaponSystem) => {
      const primary = weaponSystem.getPrimaryWeapon();
      if (primary) {
        primary.setCooldownMultiplier(0.75);
      }
      const secondary = weaponSystem.getSecondaryWeapon();
      if (secondary) {
        secondary.setCooldownMultiplier(0.75);
      }
    },
  },
  {
    id: "wpn_damage",
    name: "Reinforced Rounds",
    description: "+20% weapon damage across all weapons.",
    category: "weapon",
    icon: "!!",
    rarity: "common",
    stackable: true,
    maxStacks: 3,
    minZone: 1,
    applyEffect: (_ship: Ship, weaponSystem: WeaponSystem) => {
      const primary = weaponSystem.getPrimaryWeapon();
      if (primary) {
        primary.upgrade();
      }
    },
  },
  {
    id: "wpn_spread",
    name: "Scatter Module",
    description: "Adds spread projectiles to primary weapon.",
    category: "weapon",
    icon: "<>",
    rarity: "uncommon",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: (_ship: Ship, weaponSystem: WeaponSystem) => {
      // RapidFireGun adds spread at upgradeLevel >= 2
      // Force the primary weapon to at least level 2
      const primary = weaponSystem.getPrimaryWeapon();
      if (primary && primary.getUpgradeLevel() < 2) {
        while (primary.getUpgradeLevel() < 2) {
          primary.upgrade();
        }
      }
    },
  },
  {
    id: "wpn_dual_wield",
    name: "Dual Weapon Link",
    description: "Activates secondary weapon system (Rapid Fire).",
    category: "weapon",
    icon: "++",
    rarity: "uncommon",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: (_ship: Ship, weaponSystem: WeaponSystem) => {
      weaponSystem.setSecondaryWeapon("rapidfire");
    },
  },
  {
    id: "wpn_projectile_speed",
    name: "Accelerated Barrels",
    description: "+30% projectile speed. Shots reach targets faster.",
    category: "weapon",
    icon: "->",
    rarity: "common",
    stackable: true,
    maxStacks: 2,
    minZone: 1,
    applyEffect: (_ship: Ship, weaponSystem: WeaponSystem) => {
      const primary = weaponSystem.getPrimaryWeapon();
      if (primary) {
        primary.setProjectileSpeedMultiplier(1.3);
      }
      const secondary = weaponSystem.getSecondaryWeapon();
      if (secondary) {
        secondary.setProjectileSpeedMultiplier(1.3);
      }
    },
  },
  {
    id: "wpn_explosive",
    name: "Volatile Payload",
    description: "+50% score from asteroid kills.",
    category: "weapon",
    icon: "**",
    rarity: "uncommon",
    stackable: false,
    maxStacks: 1,
    minZone: 2,
    applyEffect: () => {
      // Effect handled by RunState score multiplier calculation
    },
  },

  // ===== DEFENSE UPGRADES =====
  {
    id: "def_hull_plating",
    name: "Titanium Hull",
    description: "+25 max hull integrity. More hits before destruction.",
    category: "defense",
    icon: "[+]",
    rarity: "common",
    stackable: true,
    maxStacks: 3,
    minZone: 1,
    applyEffect: (ship: Ship) => {
      ship.setMaxHealth(ship.getMaxHealth() + 25);
      ship.setHealth(ship.getHealth() + 25);
    },
  },
  {
    id: "def_shield_boost",
    name: "Shield Capacitor",
    description: "+25 max shield capacity.",
    category: "defense",
    icon: "(+)",
    rarity: "common",
    stackable: true,
    maxStacks: 3,
    minZone: 1,
    applyEffect: (ship: Ship) => {
      ship.setMaxShield(ship.getMaxShield() + 25);
      ship.setShield(ship.getShield() + 25);
    },
  },
  {
    id: "def_shield_regen",
    name: "Auto-Recharge",
    description: "Shields regenerate +2 per second.",
    category: "defense",
    icon: "~~",
    rarity: "uncommon",
    stackable: true,
    maxStacks: 2,
    minZone: 1,
    applyEffect: (ship: Ship) => {
      ship.setShieldRegenRate(ship.getShieldRegenRate() + 2);
    },
  },
  {
    id: "def_repair_kit",
    name: "Emergency Repair",
    description: "Instantly restore 50 hull integrity.",
    category: "defense",
    icon: "+50",
    rarity: "common",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: (ship: Ship) => {
      ship.repair(50, 0);
    },
  },
  {
    id: "def_armor",
    name: "Reactive Armor",
    description: "-20% collision damage taken.",
    category: "defense",
    icon: "##",
    rarity: "uncommon",
    stackable: true,
    maxStacks: 2,
    minZone: 2,
    applyEffect: (ship: Ship) => {
      ship.setDamageReduction(ship.getDamageReduction() * 0.8);
    },
  },

  // ===== SPECIAL SYSTEMS =====
  {
    id: "spc_score_shield",
    name: "Point Defense",
    description: "First hit each zone absorbed if score > 100.",
    category: "special",
    icon: "<!>",
    rarity: "rare",
    stackable: false,
    maxStacks: 1,
    minZone: 2,
    applyEffect: () => {
      // Effect handled by RunState flag check in takeDamage flow
    },
  },
  {
    id: "spc_magnet",
    name: "Salvage Beacon",
    description: "+50% score from all asteroid destruction.",
    category: "special",
    icon: "$+",
    rarity: "uncommon",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: () => {
      // Effect handled by RunState score multiplier calculation
    },
  },
  {
    id: "spc_speed_boost",
    name: "Thruster Upgrade",
    description: "+20% ship movement speed.",
    category: "special",
    icon: "^",
    rarity: "common",
    stackable: true,
    maxStacks: 2,
    minZone: 1,
    applyEffect: (ship: Ship) => {
      ship.setMoveSpeed(ship.getMoveSpeed() * 1.2);
    },
  },
  {
    id: "spc_time_dilation",
    name: "Chrono Brake",
    description: "All asteroids move 15% slower.",
    category: "special",
    icon: "~~",
    rarity: "rare",
    stackable: false,
    maxStacks: 1,
    minZone: 2,
    applyEffect: () => {
      // Effect handled by RunState asteroid speed factor
    },
  },

  // ===== ECONOMY/META UPGRADES =====
  {
    id: "eco_score_mult",
    name: "Data Harvester",
    description: "+25% score from all sources.",
    category: "economy",
    icon: "x+",
    rarity: "common",
    stackable: true,
    maxStacks: 3,
    minZone: 1,
    applyEffect: () => {
      // Effect handled by RunState score multiplier calculation
    },
  },
  {
    id: "eco_extra_choice",
    name: "Intel Package",
    description: "Next zone offers 4 upgrade choices instead of 3.",
    category: "economy",
    icon: "+1",
    rarity: "rare",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: () => {
      // Effect handled by upgrade selection screen logic
    },
  },
  {
    id: "eco_reroll",
    name: "Market Access",
    description: "Reroll upgrade choices once per zone.",
    category: "economy",
    icon: "?",
    rarity: "rare",
    stackable: false,
    maxStacks: 1,
    minZone: 1,
    applyEffect: () => {
      // Effect handled by upgrade selection screen logic
    },
  },
];
