// API Response Types
export interface GameStateResponse {
  game: {
    id: number;
    mana: number;
    maxMana: number;
    manaRegen: number;
    gold: number;
    souls: number;
    day: number;
    hour: number;
    status: string;
    unlockedMonsterSpecies: string[];
    speciesExperience: Record<string, number>;
    monsterExperience: Record<string, number>;
    activeAdventurerParties: number;
    canModifyDungeon: boolean;
    speciesProgress: Record<string, { experience: number; unlockedTier: number }>;
  };
  floors?: Array<{
    id: number;
    number: number;
    rooms: Array<{
      id: number;
      type: 'entrance' | 'normal' | 'boss' | 'core';
      position: number;
      floorNumber: number;
      monsters: Array<{
        id: number;
        type: string;
        hp: number;
        maxHp: number;
        alive: boolean;
        isBoss: boolean;
      }>;
      roomUpgrade: null;
      explored: boolean;
      loot: number;
    }>;
    isDeepest: boolean;
  }>;
  monsters: Array<{
    id: number;
    roomId: number;
    type: string;
    hp: number;
    maxHp: number;
    alive: boolean;
    isBoss: boolean;
  }>;
}

export interface DungeonStateResponse {
  floors: Array<{
    id: number;
    number: number;
    isDeepest: boolean;
    rooms: Array<{
      id: number;
      type: 'entrance' | 'normal' | 'boss' | 'core';
      position: number;
      floorNumber: number;
      explored: boolean;
      loot: number;
      roomUpgrade: null;
      monsters: Array<{
        id: number;
        type: string;
        hp: number;
        maxHp: number;
        alive: boolean;
        isBoss: boolean;
      }>;
    }>;
  }>;
  monsters: Array<{
    id: number;
    type: string;
    hp: number;
    maxHp: number;
    roomId: number;
    alive: boolean;
    isBoss: boolean;
  }>;
}

export interface PlaceMonsterRequest {
  floorNumber: number;
  roomPosition: number;
  monsterType: string;
}

export interface PlaceMonsterResponse {
  success: boolean;
  error?: string;
  monster?: {
    id: number;
    type: string;
    hp: number;
    maxHp: number;
    isBoss: boolean;
    scaledStats: {
      hp: number;
      attack: number;
      defense: number;
    };
  };
  costPaid?: number;
  remainingMana?: number;
}

export interface UnlockMonsterSpeciesRequest {
  speciesName: string;
}

export interface UnlockMonsterSpeciesResponse {
  success: boolean;
  error?: string;
  speciesName?: string;
  costPaid?: number;
  remainingGold?: number;
  required?: number;
  unlockedSpecies?: string[];
  speciesExperience?: Record<string, number>;
}

export interface GainMonsterExperienceRequest {
  monsterName: string;
  experience: number;
}

export interface GainMonsterExperienceResponse {
  success: boolean;
  error?: string;
  monsterName?: string;
  previousExp?: number;
  newExp?: number;
  expGained?: number;
  tierUnlocks?: Array<{
    species: string;
    tier: number;
  }>;
  speciesExperience?: Record<string, number>;
  monsterExperience?: Record<string, number>;
}

export interface GetAvailableMonstersResponse {
  success: boolean;
  error?: string;
  monsters?: Array<{
    name: string;
    hp: number;
    attack: number;
    defense: number;
    tier: number;
    species: string;
    baseCost: number;
    traits: string[];
  }>;
  species?: Record<
    string,
    {
      experience: number;
      unlockedTier: number;
      monsters: Array<{
        name: string;
        hp: number;
        attack: number;
        defense: number;
        tier: number;
        species: string;
        baseCost: number;
        traits: string[];
      }>;
    }
  >;
}

export interface AddRoomRequest {
  floorNumber: number;
  roomType: string;
  position: number;
  cost: number;
}

export interface AddRoomResponse {
  success: boolean;
  error?: string;
  roomId?: number;
  type?: string;
  position?: number;
  status?: string;
  activeAdventurerParties?: number;
}

export interface UpdateDungeonStatusResponse {
  success: boolean;
  error?: string;
  status?: string;
  activeAdventurerParties?: number;
  canModifyDungeon?: boolean;
}

export interface InitializeGameResponse {
  game: {
    id: number;
    mana: number;
    maxMana: number;
    manaRegen: number;
    gold: number;
    souls: number;
    day: number;
    hour: number;
    status: string;
    speed: number;
    selectedRoom: null;
    selectedMonster: null;
    modalOpen: boolean;
    dungeonLevel: number;
    adventurerParties: unknown[];
    nextPartySpawn: number;
    totalFloors: number;
    deepCoreBonus: number;
    unlockedMonsterSpecies: string[];
    speciesExperience: Record<string, number>;
    monsterExperience: Record<string, number>;
    activeAdventurerParties: number;
    canModifyDungeon: boolean;
    speciesProgress: Record<string, { experience: number; unlockedTier: number }>;
    log: Array<{
      message: string;
      type: string;
      timestamp: number;
    }>;
  };
  floors: Array<{
    id: number;
    number: number;
    rooms: Array<{
      id: number;
      type: 'entrance' | 'normal' | 'boss' | 'core';
      position: number;
      floorNumber: number;
      monsters: Array<{
        id: number;
        type: string;
        hp: number;
        maxHp: number;
        alive: boolean;
        isBoss: boolean;
      }>;
      roomUpgrade: null;
      explored: boolean;
      loot: number;
    }>;
    isDeepest: boolean;
  }>;
  monsters: Array<{
    id: number;
    roomId: number;
    type: string;
    hp: number;
    maxHp: number;
    alive: boolean;
    isBoss: boolean;
  }>;
}
