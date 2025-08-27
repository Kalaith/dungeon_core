import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SpeciesState {
  unlockedSpecies: string[];
  speciesExperience: Record<string, number>;
  lastUpdated: number;
  
  // Actions
  setSpeciesData: (species: string[], experience: Record<string, number>) => void;
  addUnlockedSpecies: (species: string) => void;
  shouldUpdate: (gameStateTimestamp: number) => boolean;
}

export const useSpeciesStore = create<SpeciesState>()(
  persist(
    (set, get) => ({
      unlockedSpecies: [],
      speciesExperience: {},
      lastUpdated: 0,

      setSpeciesData: (species: string[], experience: Record<string, number>) => {
        set({
          unlockedSpecies: species,
          speciesExperience: experience,
          lastUpdated: Date.now()
        });
      },

      addUnlockedSpecies: (species: string) => {
        const current = get();
        if (!current.unlockedSpecies.includes(species)) {
          set({
            unlockedSpecies: [...current.unlockedSpecies, species],
            lastUpdated: Date.now()
          });
        }
      },

      shouldUpdate: (gameStateTimestamp: number) => {
        const { lastUpdated } = get();
        return gameStateTimestamp > lastUpdated;
      }
    }),
    {
      name: 'species-store',
      version: 1
    }
  )
);
