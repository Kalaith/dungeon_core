import type { MonsterType, GameConstants, EquipmentData, FloorScaling, DeepFloorScaling, MonsterTrait } from '../types/game';
import { apiClient } from './client';
import type { GameStateResponse, InitializeGameResponse, DungeonStateResponse } from './types';

// Cache for static data
let gameConstantsCache: GameConstants | null = null;
let monsterTypesCache: { [key: string]: MonsterType } | null = null;
let monsterTraitsCache: { [key: string]: MonsterTrait } | null = null;
let equipmentDataCache: EquipmentData | null = null;
let floorScalingCache: { regular: FloorScaling[]; deep: DeepFloorScaling } | null = null;

// Initialize game from backend
export const initializeGame = async (): Promise<InitializeGameResponse> => {
  return apiClient.initializeGame();
};

// Game state from backend
export const getGameState = async (): Promise<GameStateResponse> => {
  return apiClient.getGameState();
};

// Get dungeon state (floors and monsters) from backend
export const getDungeonState = async (): Promise<DungeonStateResponse> => {
  return apiClient.getDungeonState();
};

// Place monster via backend (secure)
export const placeMonsterAPI = async (floorNumber: number, roomPosition: number, monsterType: string) => {
  return apiClient.placeMonster({ floorNumber, roomPosition, monsterType });
};

// Unlock monster species via backend (secure)
export const unlockMonsterSpeciesAPI = async (speciesName: string) => {
  return apiClient.unlockMonsterSpecies({ speciesName });
};

// Gain monster experience via backend (secure)
export const gainMonsterExperienceAPI = async (monsterName: string, experience: number) => {
  return apiClient.gainMonsterExperience({ monsterName, experience });
};

// Get available monsters via backend (secure)
export const getAvailableMonstersAPI = async () => {
  return apiClient.getAvailableMonsters();
};

// Add room via backend
export const addRoomAPI = async (floorNumber: number, roomType: string, position: number, cost: number) => {
  return apiClient.addRoom({ floorNumber, roomType, position, cost });
};

// Reset game via backend
export const resetGameAPI = async () => {
  return apiClient.resetGame();
};

// Game constants from backend (cached)
export const fetchGameConstantsData = async () => {
  if (gameConstantsCache === null) {
    gameConstantsCache = await apiClient.getGameConstants();
  }
  return gameConstantsCache;
};

// Monster data from backend (cached)
export const fetchMonsterList = async () => {
  if (monsterTypesCache === null) {
    monsterTypesCache = await apiClient.getMonsterTypes();
  }
  return monsterTypesCache;
};

export const fetchMonsterSpeciesList = async () => {
  if (monsterTypesCache === null) {
    monsterTypesCache = await apiClient.getMonsterTypes();
  }
  return monsterTypesCache;
};

export const getMonsterTypes = async (): Promise<{ [key: string]: MonsterType }> => {
  if (monsterTypesCache === null) {
    monsterTypesCache = await apiClient.getMonsterTypes();
  }
  return monsterTypesCache!;
};

export const fetchMonsterTraits = async () => {
  if (monsterTraitsCache === null) {
    monsterTraitsCache = await apiClient.getMonsterTraits();
  }
  return monsterTraitsCache!;
};

export const fetchEquipmentData = async () => {
  if (equipmentDataCache === null) {
    equipmentDataCache = await apiClient.getEquipmentData();
  }
  return equipmentDataCache!;
};

export const fetchFloorScaling = async () => {
  if (floorScalingCache === null) {
    floorScalingCache = await apiClient.getFloorScaling();
  }
  return floorScalingCache!.regular;
};

export const fetchDeepFloorScaling = async () => {
  if (floorScalingCache === null) {
    floorScalingCache = await apiClient.getFloorScaling();
  }
  return floorScalingCache!.deep;
};

// Clear cache (useful for development or if data changes)
export const clearDataCache = () => {
  gameConstantsCache = null;
  monsterTypesCache = null;
  monsterTraitsCache = null;
  equipmentDataCache = null;
  floorScalingCache = null;
};

// Simplified local calculations - these can remain client-side for performance
export const getScaledMonsterStats = (baseStats: { hp: number; attack: number; defense: number }, floorNumber: number, isBoss: boolean = false): { hp: number; attack: number; defense: number } => {
  const floorMultiplier = 1 + ((floorNumber - 1) * 0.2);
  const bossMultiplier = isBoss ? 1.5 : 1;
  
  return {
    hp: Math.floor(baseStats.hp * floorMultiplier * bossMultiplier),
    attack: Math.floor(baseStats.attack * floorMultiplier * bossMultiplier),
    defense: Math.floor(baseStats.defense * floorMultiplier * bossMultiplier)
  };
};

export const getMonsterManaCost = (baseCost: number, floorNumber: number, isBossRoom: boolean = false): number => {
  const floorMultiplier = 1 + ((floorNumber - 1) * 0.5);
  const bossMultiplier = isBossRoom ? 2.0 : 1.0;
  return Math.floor(baseCost * floorMultiplier * bossMultiplier);
};

export const getRoomCost = (totalRoomCount: number, roomType: 'normal' | 'boss'): number => {
  const baseCost = 20;
  const linearIncrease = totalRoomCount * 5;
  let totalCost = baseCost + linearIncrease;
  
  if (roomType === 'boss') {
    totalCost += 30;
  }
  
  return Math.max(5, Math.round(totalCost / 5) * 5);
};
