import type { GameState } from '../types/game';

// Define a type for the full GameStore actions that will be passed to these functions
// This avoids circular dependency with the main gameStore.ts file
interface GameStoreActions {
  addLog: (entry: any) => void;
}

// Combine GameState and GameStoreActions for the GetState/SetState types
type FullGameStore = GameState & GameStoreActions;

export const spendMana = (set: (partial: Partial<FullGameStore>) => void, get: () => FullGameStore, amount: number) => {
  const state = get();
  if (state.mana >= amount) {
    set({ mana: state.mana - amount });
    return true;
  }
  return false;
};

export const spendGold = (set: (partial: Partial<FullGameStore>) => void, get: () => FullGameStore, amount: number) => {
  const state = get();
  if (state.gold >= amount) {
    set({ gold: state.gold - amount });
    return true;
  }
  return false;
};

export const gainGold = (set: (updater: (state: FullGameStore) => Partial<FullGameStore>) => void, _get: () => FullGameStore, amount: number) => set((state: FullGameStore) => ({
  gold: state.gold + amount
}));

export const gainSouls = (set: (updater: (state: FullGameStore) => Partial<FullGameStore>) => void, _get: () => FullGameStore, amount: number) => set((state: FullGameStore) => ({
  souls: state.souls + amount
}));