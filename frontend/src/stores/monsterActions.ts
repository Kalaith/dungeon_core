import type { GameState, Monster, MonsterType, LogEntry, DungeonFloor, Room } from '../types/game';
import { placeMonsterAPI, unlockMonsterSpeciesAPI, gainMonsterExperienceAPI, getAvailableMonstersAPI } from '../api/gameApi';

// Define a type for the full GameStore actions that will be passed to these functions
// This avoids circular dependency with the main gameStore.ts file
interface GameStoreActions {
  spendMana: (amount: number) => boolean;
  spendGold: (amount: number) => boolean;
}

// Combine GameState and GameStoreActions for the GetState/SetState types
type FullGameStore = GameState & GameStoreActions;

export const placeMonster = async (set: (partial: Partial<FullGameStore>) => void, get: () => FullGameStore, floorNumber: number, roomPosition: number, monsterName: string, addLog: (entry: LogEntry | string) => void) => {
  try {
    const result = await placeMonsterAPI(floorNumber, roomPosition, monsterName);
    
    if (!result.success) {
      addLog(result.error || "Failed to place monster");
      return false;
    }

    // Update local state with the validated result from backend
    const updatedFloors = get().floors.map((f: DungeonFloor) => {
      if (f.number === floorNumber) {
        return {
          ...f,
          rooms: f.rooms.map((r: Room) => {
            if (r.position === roomPosition) {
              const newMonster: Monster = {
                id: result.monster!.id,
                type: result.monster!.type,
                hp: result.monster!.hp,
                maxHp: result.monster!.maxHp,
                alive: true,
                isBoss: result.monster!.isBoss,
                floorNumber,
                scaledStats: result.monster!.scaledStats
              };
              return {
                ...r,
                monsters: [...r.monsters, newMonster]
              };
            }
            return r;
          })
        };
      }
      return f;
    });

    // Update mana based on server response
    set({ 
      floors: updatedFloors,
      mana: result.remainingMana || get().mana
    });
    
    addLog(`Spawned ${result.monster!.type}${result.monster!.isBoss ? ' (Boss)' : ''} on floor ${floorNumber}, room ${roomPosition} for ${result.costPaid} mana`);
    
    return true;
  } catch (error) {
    addLog("Network error: Could not place monster");
    return false;
  }
};

export const unlockMonsterSpecies = async (set: (updater: (state: FullGameStore) => Partial<FullGameStore>) => void, _get: () => FullGameStore, speciesName: string, addLog: (entry: LogEntry | string) => void) => {
  try {
    const result = await unlockMonsterSpeciesAPI(speciesName);
    
    if (!result.success) {
      if (result.required) {
        addLog(`Not enough gold to unlock ${speciesName}. Need ${result.required} gold.`);
      } else {
        addLog(result.error || "Failed to unlock species");
      }
      return;
    }

    // Update local state with validated result from backend
    set((state: FullGameStore) => ({
      unlockedMonsterSpecies: [...state.unlockedMonsterSpecies, speciesName],
      gold: result.remainingGold || state.gold
    }));
    
    addLog(`Unlocked new monster species: ${speciesName}!`);
  } catch (error) {
    addLog("Network error: Could not unlock species");
  }
};

export const gainMonsterExperience = async (set: (updater: (state: FullGameStore) => Partial<FullGameStore>) => void, _get: () => FullGameStore, monsterName: string, exp: number, addLog: (entry: LogEntry | string) => void) => {
  try {
    const result = await gainMonsterExperienceAPI(monsterName, exp);
    
    if (!result.success) {
      addLog(result.error || "Failed to gain experience");
      return;
    }

    // Update local state with validated result from backend
    set((state: FullGameStore) => ({
      monsterExperience: {
        ...state.monsterExperience,
        [monsterName]: result.newExp || 0
      }
    }));

    // Log tier unlocks if any
    if (result.tierUnlocks && result.tierUnlocks.length > 0) {
      result.tierUnlocks.forEach(unlock => {
        addLog(`Unlocked new tier (${unlock.tier}) for ${unlock.species} monsters!`);
      });
    }
  } catch (error) {
    addLog("Network error: Could not gain experience");
  }
};

export const getAvailableMonsters = async (_set: (partial: Partial<FullGameStore>) => void, _get: () => FullGameStore) => {
  try {
    const result = await getAvailableMonstersAPI();
    
    if (!result.success || !result.monsters) {
      return [];
    }

    // Convert backend response to frontend MonsterType format
    const availableMonsters: MonsterType[] = result.monsters.map(monster => ({
      name: monster.name,
      baseCost: 10, // Will be calculated server-side when placing
      hp: monster.hp,
      attack: monster.attack,
      defense: monster.defense,
      color: '#808080', // Default color, could be enhanced
      description: `Tier ${monster.tier} monster`,
      species: 'Unknown', // Will be filled by backend
      tier: monster.tier,
      traits: []
    }));

    return availableMonsters.sort((a, b) => a.tier - b.tier);
  } catch (error) {
    console.error("Network error: Could not fetch available monsters", error);
    return [];
  }
};