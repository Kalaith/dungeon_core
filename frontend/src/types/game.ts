// Game types for Dungeon Core Simulator v1.2 - Floor-based system

export interface LogEntry {
  message: string;
  type: 'system' | 'combat' | 'adventure' | 'building';
  timestamp?: number; // Optional, will be auto-added by addLog if missing
}

export interface GameState {
  mana: number;
  maxMana: number;
  manaRegen: number;
  gold: number;
  souls: number;
  day: number;
  hour: number; // 0-23 hour format
  status: 'Open' | 'Closing' | 'Closed' | 'Maintenance';
  speed: number;
  selectedRoom: number | null;
  selectedMonster: string | null;
  log: LogEntry[];
  modalOpen: boolean;
  dungeonLevel: number;
  adventurerParties: AdventurerParty[];
  nextPartySpawn: number; // Hour when next party will spawn
  floors: DungeonFloor[];
  totalFloors: number;
  deepCoreBonus: number; // Percentage mana regen bonus
  unlockedMonsterSpecies: string[];
  monsterExperience: Record<string, number>;
}

export interface DungeonFloor {
  id: number;
  number: number; // Floor number (1, 2, 3, etc.)
  rooms: Room[];
  isDeepest: boolean;
}

export interface Room {
  id: number;
  type: 'entrance' | 'normal' | 'boss' | 'core';
  position: number; // Position in the floor (0 = entrance, 1-4 = normal/boss, 5 = core)
  floorNumber: number;
  monsters: Monster[];
  roomUpgrade: RoomUpgrade | null;
  explored: boolean;
  loot: number;
}

export interface RoomUpgrade {
  type: 'trap' | 'treasure' | 'reinforcement' | 'evolution';
  name: string;
  effect: string;
  multiplier: number;
}

export interface Monster {
  id: number;
  type: string; // Monster name (e.g., "Goblin", "False Chest")
  hp: number;
  maxHp: number;
  alive: boolean;
  lastRespawn?: number;
  isBoss: boolean;
  floorNumber: number;
  scaledStats: {
    hp: number;
    attack: number;
    defense: number;
  };
}

export interface Adventurer {
  id: number;
  classIdx: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  experience: number;
  gold: number;
  equipment: Equipment;
  conditions: string[]; // Status effects
  scaledStats: {
    hp: number;
    attack: number;
    defense: number;
  };
}

export interface AdventurerParty {
  id: number;
  members: Adventurer[];
  currentFloor: number;
  currentRoom: number;
  retreating: boolean;
  casualties: number;
  loot: number;
  entryTime: number;
  targetFloor: number; // How deep they plan to go
}

export interface Equipment {
  weapon: string;
  armor: string;
  accessory: string;
}

export interface RoomType {
  name: string;
  cost: number;
  description: string;
  color: string;
  spawnCostReduction: number;
  special?: string; // Special property
}

export interface MonsterType {
  name: string;
  baseCost: number;
  hp: number;
  attack: number;
  defense: number;
  color: string;
  description: string;
  special?: string;
  bossAbility?: string; // Special ability when in boss room
  species: string; // e.g., "Mimetic", "Amorphous"
  tier: number; // e.g., 1, 2, 3
  traits: string[]; // Array of trait names
}

export interface MonsterTrait {
  description: string;
  trait_type: string;
  target_type: string;
  applies_to: string;
  mana_cost?: number;
  cooldown_turns?: number;
  [key: string]: any; // Allow for other properties
}

export interface AdventurerClass {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  color: string;
  special?: string;
}

export interface FloorScaling {
  manaCostMultiplier: number;
  monsterBoostPercentage: number;
  adventurerLevelRange: [number, number];
}

// New interfaces for JSON data and game constants

export interface MonsterInfo {
  traits: string[];
  description: string;
}

export interface TierData {
  [monsterName: string]: MonsterInfo;
}

export interface MonsterLine {
  [tier: string]: TierData; // e.g., "Tier 1", "Tier 2"
}

export interface SpeciesEvolutionTrees {
  [monsterLineName: string]: MonsterLine; // e.g., "False Chest", "Shelf Crawler"
}

export interface MonsterList {
  evolution_trees: {
    [speciesName: string]: SpeciesEvolutionTrees; // e.g., "Mimetic", "Amorphous"
  };
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
}

export interface GrowthFactor {
  hp: number;
  attack: number;
  defense: number;
}

export interface MonsterSpecies {
  description: string;
  starting_monster: string;
  unlock_cost: number;
  base_stats: BaseStats;
  growth_factor: GrowthFactor;
}

export interface MonsterSpeciesList {
  species: {
    [speciesName: string]: MonsterSpecies;
  };
}

export interface RoomUpgradeData {
  type: 'trap' | 'treasure' | 'reinforcement' | 'evolution';
  name: string;
  effect: string;
  multiplier: number;
}

export interface DeepFloorScaling {
  manaCostMultiplierIncrease: number;
  monsterBoostPercentageIncrease: number;
  adventurerLevelIncrease: number;
}

export interface EquipmentData {
  weapons: string[];
  armor: string[];
  accessories: string[];
}

export interface GameConstants {
  MAX_ROOMS_PER_FLOOR: number;
  MAX_LOG_ENTRIES: number;
  BASE_ROOM_COST: number;
  BOSS_ROOM_EXTRA_COST: number;
  MANA_REGEN_INTERVAL: number;
  TIME_ADVANCE_INTERVAL: number;
  ADVENTURER_SPAWN_CHANCE: number;
  MAX_PARTY_SIZE: number;
  MIN_PARTY_SIZE: number;
  RETREAT_THRESHOLD: number;
  BOSS_ROOM_LOOT_MULTIPLIER: number;
  BOSS_STAT_MULTIPLIER: number;
  BOSS_ROOM_COST_MULTIPLIER: number;
  CORE_ROOM_MANA_BONUS: number;
  LEVEL_SCALING_FORMULA: number;
  RETREAT_CHANCE_UNDERLEVELED: number;
}