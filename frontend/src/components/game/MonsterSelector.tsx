import React, { useState, useEffect, useMemo } from "react";
import { useBackendGameStore } from "../../stores/backendGameStore";
import { useSpeciesStore } from "../../stores/speciesStore";
import type { MonsterType } from "../../types/game";
import { getMonsterTypes, unlockMonsterSpeciesAPI } from "../../api/gameApi";

export const MonsterSelector: React.FC = React.memo(() => {
  const selectedMonster = useBackendGameStore((state) => state.selectedMonster);
  const selectMonster = useBackendGameStore((state) => state.selectMonster);
  const refreshGameState = useBackendGameStore((state) => state.refreshGameState);
  const gameState = useBackendGameStore((state) => state.gameState);
  const mana = gameState?.mana || 0;
  const gold = gameState?.gold || 0;
  const { unlockedSpecies } = useSpeciesStore();
  const [monsterTypes, setMonsterTypes] = useState<{[key: string]: MonsterType}>({});
  const [loading, setLoading] = useState(false);

  console.log('MonsterSelector render - unlockedMonsterSpecies:', unlockedSpecies);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching monster types...');
        const types = await getMonsterTypes();
        console.log('Monster types received:', types);
        setMonsterTypes(types);
      } catch (error) {
        console.error('Error loading monster data:', error);
      }
    };
    fetchData();
  }, []);

  // Get unique species from monster types
  const availableSpecies = useMemo(() => {
    const species = new Set<string>();
    Object.values(monsterTypes).forEach(monster => {
      if (monster.species) {
        species.add(monster.species);
      }
    });
    return Array.from(species).sort();
  }, [monsterTypes]);

  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(
    unlockedSpecies.length > 0 ? unlockedSpecies[0] : null
  );
  const [showSpecies, setShowSpecies] = useState(false);

  useEffect(() => {
    if (!selectedSpecies && unlockedSpecies.length > 0) {
      setSelectedSpecies(unlockedSpecies[0]);
    }
  }, [unlockedSpecies.length, selectedSpecies]);

  const handleSpeciesSelect = (speciesName: string) => {
    console.log('Selecting species:', speciesName);
    setSelectedSpecies(speciesName);
    selectMonster(null);
  };

  // Get monsters for the selected species
  const availableMonsters = useMemo((): MonsterType[] => {
    console.log('Computing availableMonsters for species:', selectedSpecies);
    console.log('monsterTypes:', monsterTypes);
    console.log('All monster species:', Object.values(monsterTypes).map(m => m.species));
    
    if (!selectedSpecies) return [];
    
    const filtered = Object.values(monsterTypes)
      .filter(monster => monster.species === selectedSpecies);
    
    console.log('Filtered monsters for', selectedSpecies, ':', filtered);
    
    return filtered.sort((a, b) => (a.tier || 1) - (b.tier || 1));
  }, [selectedSpecies, monsterTypes]);

  // Handle species unlock
  const handleUnlockSpecies = async (speciesName: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Unlocking species:', speciesName);
      const result = await unlockMonsterSpeciesAPI(speciesName);
      console.log('Unlock result:', result);
      if (result.success) {
        console.log('Species unlock successful, refreshing game state...');
        await refreshGameState(); // Refresh to get updated unlocked species
        console.log('Game state refreshed, selecting species:', speciesName);
        handleSpeciesSelect(speciesName);
      }
    } catch (error) {
      console.error('Error unlocking species:', error);
    } finally {
      setLoading(false);
    }
  };

  // Species unlock cost (hardcoded for now, could come from backend)
  const SPECIES_UNLOCK_COST = 1000;

  // Debug logging
  // Only log when species data actually changes, not on every render
  useEffect(() => {
    console.log('MonsterSelector - Species data updated:', {
      unlockedSpecies,
      selectedSpecies,
      availableMonsters: availableMonsters.length
    });
  }, [unlockedSpecies, selectedSpecies, availableMonsters.length]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-white">Monsters</h3>

      {/* Species Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowSpecies(!showSpecies)}
          className="w-full flex justify-between items-center p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-gray-200"
        >
          <span>Unlock Species</span>
          <span>{showSpecies ? '▼' : '▶'}</span>
        </button>
        
        {showSpecies && (
        <div className="flex flex-wrap gap-2">
          {availableSpecies.map((speciesName: string) => {
            const isUnlocked = unlockedSpecies.includes(speciesName);
            const canAffordUnlock = gold >= SPECIES_UNLOCK_COST;

            return (
              <button
                key={speciesName}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedSpecies === speciesName
                    ? 'bg-blue-600 text-white'
                    : isUnlocked
                      ? 'bg-blue-200 hover:bg-blue-300 text-blue-800'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                onClick={() => {
                  if (isUnlocked) {
                    handleSpeciesSelect(speciesName);
                  } else if (canAffordUnlock && !loading) {
                    handleUnlockSpecies(speciesName);
                  }
                }}
                disabled={(!isUnlocked && !canAffordUnlock) || loading}
                title={isUnlocked ? `Select ${speciesName}` : `Unlock for ${SPECIES_UNLOCK_COST} Gold`}
              >
                {speciesName} {isUnlocked ? '' : `(${SPECIES_UNLOCK_COST}🪙)`}
              </button>
            );
          })}
          </div>
        )}
      </div>

      {/* Species Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {unlockedSpecies.map((speciesName: string) => (
            <button
              key={speciesName}
              onClick={() => handleSpeciesSelect(speciesName)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedSpecies === speciesName
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              {speciesName}
            </button>
          ))}
        </div>
      </div>

      {/* Monster List for Selected Species */}
      {selectedSpecies && (
        <div className="monster-selector flex flex-col gap-2" id="monster-selector">

          {availableMonsters.map((monster: MonsterType) => {
            // Use base cost for display, actual cost calculated when placing
            const displayCost = monster.baseCost;
            const canAfford = mana >= displayCost;
            const isSelected = selectedMonster === monster.name;

            return (
              <div
                key={monster.name}
                className={`monster-type p-3 rounded cursor-pointer border-2 transition-all ${
                  isSelected
                    ? 'bg-red-800 border-red-600'
                    : canAfford
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-600 border-gray-500 cursor-not-allowed opacity-50'
                  }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: monster.color || '#gray'
                }}
                onClick={() => canAfford && selectMonster(monster.name)}
              >
                <div className="monster-type-header flex justify-between items-center mb-1">
                  <span className="monster-type-name font-bold text-gray-200">{monster.name} (Tier {monster.tier})</span>
                  <span className={`monster-type-cost text-sm font-bold ${canAfford ? 'text-blue-400' : 'text-red-400'}`}>
                    {displayCost}✨
                  </span>
                </div>
                <div className="monster-type-description text-xs text-gray-400 mb-2">
                  {monster.description}
                </div>
                <div className="monster-stats flex justify-between text-xs">
                  <span className="text-red-600">❤️ {monster.hp}</span>
                  <span className="text-orange-600">⚔️ {monster.attack}</span>
                  <span className="text-blue-600">🛡️ {monster.defense}</span>
                </div>
                {monster.traits && monster.traits.length > 0 && (
                  <div className="monster-traits mt-1">
                    <span className="font-semibold text-xs text-gray-300">Traits: </span>
                    <span className="text-xs text-purple-600 italic">
                      {monster.traits.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
        💡 Select a monster, then click on a room to spawn it. Cost may be reduced in Monster Lairs.
      </div>
    </div>
  );
});
