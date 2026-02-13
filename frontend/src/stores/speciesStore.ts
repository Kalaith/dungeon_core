import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpeciesState {
  unlockedSpecies: string[];
  speciesExperience: Record<string, number>;
  speciesProgress: Record<string, { experience: number; unlockedTier: number }>;
  lastUpdated: number;

  // Actions
  setSpeciesData: (
    species: string[],
    experience: Record<string, number>,
    progress?: Record<string, { experience: number; unlockedTier: number }>,
  ) => void;
  addUnlockedSpecies: (species: string) => void;
  shouldUpdate: (gameStateTimestamp: number) => boolean;
}

export const useSpeciesStore = create<SpeciesState>()(
  persist(
    (set, get) => ({
      unlockedSpecies: [],
      speciesExperience: {},
      speciesProgress: {},
      lastUpdated: 0,

      setSpeciesData: (
        species: string[],
        experience: Record<string, number>,
        progress?: Record<string, { experience: number; unlockedTier: number }>,
      ) => {
        set({
          unlockedSpecies: species,
          speciesExperience: experience,
          speciesProgress: progress ?? {},
          lastUpdated: Date.now(),
        });
      },

      addUnlockedSpecies: (species: string) => {
        const current = get();
        if (!current.unlockedSpecies.includes(species)) {
          set({
            unlockedSpecies: [...current.unlockedSpecies, species],
            speciesProgress: {
              ...current.speciesProgress,
              [species]: current.speciesProgress[species] ?? {
                experience: 0,
                unlockedTier: 1,
              },
            },
            lastUpdated: Date.now(),
          });
        }
      },

      shouldUpdate: (gameStateTimestamp: number) => {
        const { lastUpdated } = get();
        return gameStateTimestamp > lastUpdated;
      },
    }),
    {
      name: "species-store",
      version: 1,
    },
  ),
);
