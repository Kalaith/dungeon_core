import { create } from 'zustand';
import { initializeGame, getGameState, placeMonsterAPI, addRoomAPI, resetGameAPI, updateDungeonStatus } from '../api/gameApi';
import { useSpeciesStore } from './speciesStore';

// Export the GameState type for use in components
export interface GameState {
  day: number;
  gold: number;
  hour: number;
  mana: number;
  manaRegen: number;
  maxMana: number;
  souls: number;
  status: string;
  canModifyDungeon: boolean;
  activeAdventurerParties: number;
}

interface BackendGameState {
  // Minimal game state from backend - only core game properties
  gameState: GameState | null;
  
  loading: boolean;
  error: string | null;
  
  // UI state
  selectedMonster: string | null;
  
  // Actions
  initializeGame: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  resetGame: () => Promise<void>;
  selectMonster: (monster: string | null) => void;
  placeMonster: (floorNumber: number, roomPosition: number, monsterType: string) => Promise<boolean>;
  addRoom: (floorNumber: number, roomType: string, position: number) => Promise<boolean>;
  updateStatus: (status: string) => Promise<boolean>;
}

export const useBackendGameStore = create<BackendGameState>()((set, get) => ({
  gameState: null,
  loading: false,
  error: null,
  selectedMonster: null,

  initializeGame: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Starting game initialization...');
      const initialData = await initializeGame();
      console.log('Initialize game response received:', initialData);
      
      // Only store the minimal game state
      set({ 
        gameState: {
          day: initialData.game.day,
          gold: initialData.game.gold,
          hour: initialData.game.hour,
          mana: initialData.game.mana,
          manaRegen: initialData.game.manaRegen,
          maxMana: initialData.game.maxMana,
          souls: initialData.game.souls,
          status: initialData.game.status,
          canModifyDungeon: initialData.game.canModifyDungeon,
          activeAdventurerParties: initialData.game.activeAdventurerParties,
        },
        loading: false
      });

      // Update species store with initial data
      if (initialData.game.unlockedMonsterSpecies) {
        useSpeciesStore.getState().setSpeciesData(
          initialData.game.unlockedMonsterSpecies,
          initialData.game.speciesExperience || {},
          initialData.game.speciesProgress || {}
        );
      }
      
      console.log('Game state initialized successfully');
    } catch (error) {
      console.error('Error during game initialization:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize game', loading: false });
    }
  },

  refreshGameState: async () => {
    set({ error: null });
    try {
      // Get current game state from backend (only minimal data)
      const newGameData = await getGameState();
      const currentState = get();
      
      // Only update if the core game state actually changed
      const currentGame = currentState.gameState;
      const newGame = newGameData.game;
      
      const needsUpdate = !currentGame ||
        currentGame.mana !== newGame.mana ||
        currentGame.gold !== newGame.gold ||
        currentGame.souls !== newGame.souls ||
        currentGame.day !== newGame.day ||
        currentGame.hour !== newGame.hour ||
        currentGame.status !== newGame.status ||
        currentGame.canModifyDungeon !== newGame.canModifyDungeon ||
        currentGame.activeAdventurerParties !== newGame.activeAdventurerParties;

      if (needsUpdate) {
        console.log('Game state changed, updating...');
        set({
          gameState: {
            day: newGame.day,
            gold: newGame.gold,
            hour: newGame.hour,
            mana: newGame.mana,
            manaRegen: newGame.manaRegen,
            maxMana: newGame.maxMana,
            souls: newGame.souls,
            status: newGame.status,
            canModifyDungeon: newGame.canModifyDungeon,
            activeAdventurerParties: newGame.activeAdventurerParties,
          }
        });
      } else {
        console.log('Game state unchanged, skipping update');
      }

      if (newGame.unlockedMonsterSpecies) {
        useSpeciesStore.getState().setSpeciesData(
          newGame.unlockedMonsterSpecies,
          newGame.speciesExperience || {},
          newGame.speciesProgress || {}
        );
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh game state' });
    }
  },

  selectMonster: (monster) => set({ selectedMonster: monster }),

  placeMonster: async (floorNumber: number, roomPosition: number, monsterType: string) => {
    try {
      const result = await placeMonsterAPI(floorNumber, roomPosition, monsterType);

      if (result.success) {
        // Refresh minimal game state (mana, gold, etc.)
        await get().refreshGameState();
        return true;
      } else {
        set({ error: result.error || 'Failed to place monster' });
        await get().refreshGameState();
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to place monster' });
      await get().refreshGameState();
      return false;
    }
  },

  addRoom: async (floorNumber: number, roomType: string, position: number) => {
    const cost = 20 + (position * 5); // Basic cost calculation

    try {
      const result = await addRoomAPI(floorNumber, roomType, position, cost);
      if (result.success) {
        // Only refresh minimal game state (mana will be reduced)
        await get().refreshGameState();
        return true;
      } else {
        const errorMessage = result.error || 'Failed to add room';
        set({ error: errorMessage });
        await get().refreshGameState();
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add room' });
      return false;
    }
  },

  updateStatus: async (status: string) => {
    try {
      const result = await updateDungeonStatus(status);

      if (result.success) {
        await get().refreshGameState();
        return true;
      }

      set({ error: result.error || 'Failed to update dungeon status' });
      return false;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update dungeon status' });
      return false;
    }
  },

  resetGame: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Resetting game...');
      const result = await resetGameAPI();

      if (result.success && result.gameData) {
        console.log('Game reset successful');
        set({
          gameState: {
            day: result.gameData.game.day,
            gold: result.gameData.game.gold,
            hour: result.gameData.game.hour,
            mana: result.gameData.game.mana,
            manaRegen: result.gameData.game.manaRegen,
            maxMana: result.gameData.game.maxMana,
            souls: result.gameData.game.souls,
            status: result.gameData.game.status,
            canModifyDungeon: result.gameData.game.canModifyDungeon,
            activeAdventurerParties: result.gameData.game.activeAdventurerParties,
          },
          loading: false,
          error: null,
          selectedMonster: null
        });

        useSpeciesStore.getState().setSpeciesData(
          result.gameData.game.unlockedMonsterSpecies || [],
          result.gameData.game.speciesExperience || {},
          result.gameData.game.speciesProgress || {}
        );
        console.log('Game reset complete');
      } else {
        set({ error: result.error || 'Failed to reset game', loading: false });
      }
    } catch (error) {
      console.error('Error during game reset:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to reset game', loading: false });
    }
  },
}));