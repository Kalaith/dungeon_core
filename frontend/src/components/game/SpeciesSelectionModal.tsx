import React, { useState, useEffect } from "react";
import { useBackendGameStore } from "../../stores/backendGameStore";
import { getMonsterTypes, unlockMonsterSpeciesAPI } from "../../api/gameApi";
import type { MonsterType } from "../../types/game";

interface SpeciesSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export const SpeciesSelectionModal: React.FC<SpeciesSelectionModalProps> = ({ open, onClose }) => {
  const { refreshGameState } = useBackendGameStore();
  const [monsterTypes, setMonsterTypes] = useState<{[key: string]: MonsterType}>({});
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const fetchData = async () => {
      try {
        const types = await getMonsterTypes();
        setMonsterTypes(types);
      } catch (error) {
        console.error('Error loading monster data:', error);
      }
    };
    fetchData();
  }, [open]);

  // Get unique species from monster types
  const availableSpecies = React.useMemo(() => {
    const speciesMap = new Map<string, { name: string; monsters: MonsterType[]; description: string }>();
    
    Object.values(monsterTypes).forEach(monster => {
      if (monster.species) {
        if (!speciesMap.has(monster.species)) {
          speciesMap.set(monster.species, {
            name: monster.species,
            monsters: [],
            description: `A species featuring ${monster.species.toLowerCase()} creatures`
          });
        }
        speciesMap.get(monster.species)!.monsters.push(monster);
      }
    });

    // Sort monsters within each species by tier
    speciesMap.forEach(species => {
      species.monsters.sort((a, b) => (a.tier || 1) - (b.tier || 1));
    });

    return Array.from(speciesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [monsterTypes]);

  const handleConfirm = async () => {
    if (!selectedSpecies || loading) return;

    setLoading(true);
    try {
      const result = await unlockMonsterSpeciesAPI(selectedSpecies);
      if (result.success) {
        await refreshGameState();
        onClose();
      }
    } catch (error) {
      console.error('Error selecting initial species:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Starting Monster Species</h2>
          <p className="text-gray-600">
            Select one species to begin your dungeon <strong>(FREE for your first species)</strong>. You can unlock additional species later using gold.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {availableSpecies.map((species) => (
            <div
              key={species.name}
              className={`species-card p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedSpecies === species.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedSpecies(species.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">{species.name}</h3>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedSpecies === species.name
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedSpecies === species.name && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{species.description}</p>
              
              <div className="monsters-preview">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Monsters:</h4>
                <div className="flex flex-wrap gap-1">
                  {species.monsters.slice(0, 3).map((monster) => (
                    <div
                      key={monster.name}
                      className="text-xs bg-gray-100 rounded px-2 py-1"
                      title={`${monster.name} - HP: ${monster.hp}, ATK: ${monster.attack}, DEF: ${monster.defense}`}
                    >
                      {monster.name} (T{monster.tier})
                    </div>
                  ))}
                  {species.monsters.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{species.monsters.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedSpecies || loading}
            className={`px-6 py-2 rounded font-medium ${
              selectedSpecies && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Selecting...' : 'Start Dungeon'}
          </button>
        </div>
      </div>
    </div>
  );
};
