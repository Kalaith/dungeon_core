import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGameConstantsData,
  getMonsterTypes,
  unlockMonsterSpeciesAPI,
} from '../../api/gameApi';
import { useBackendGameStore } from '../../stores/backendGameStore';
import { useSpeciesStore } from '../../stores/speciesStore';
import type { MonsterType } from '../../types/game';
import { Panel } from '../ui/Panel';

const speciesTone = [
  'border-emerald-300/40 bg-emerald-500/10 text-emerald-100',
  'border-sky-300/40 bg-sky-500/10 text-sky-100',
  'border-violet-300/40 bg-violet-500/10 text-violet-100',
  'border-amber-300/40 bg-amber-500/10 text-amber-100',
];

export function MonsterManagementPanel() {
  const selectedMonster = useBackendGameStore(state => state.selectedMonster);
  const selectMonster = useBackendGameStore(state => state.selectMonster);
  const refreshGameState = useBackendGameStore(state => state.refreshGameState);
  const gameState = useBackendGameStore(state => state.gameState);
  const { unlockedSpecies, speciesProgress } = useSpeciesStore();
  const [monsterTypes, setMonsterTypes] = useState<Record<string, MonsterType>>({});
  const [constants, setConstants] = useState<Record<string, number | string | null> | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setMonsterTypes(await getMonsterTypes());
      setConstants((await fetchGameConstantsData()) as unknown as Record<string, number | string | null>);
    };

    void fetchData();
  }, []);

  const allSpecies = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(monsterTypes)
          .map(monster => monster.species)
          .filter((species): species is string => Boolean(species))
      )
    ).sort();
  }, [monsterTypes]);

  useEffect(() => {
    if (!selectedSpecies && unlockedSpecies.length > 0) {
      setSelectedSpecies(unlockedSpecies[0]);
    }
  }, [selectedSpecies, unlockedSpecies]);

  const getSpeciesUnlockCost = useCallback(
    (speciesName: string): number => {
      const override = constants?.[`SPECIES_COST_${speciesName.toUpperCase()}`];
      const defaultCost = constants?.SPECIES_UNLOCK_COST;
      return Number(override ?? defaultCost ?? 1000);
    },
    [constants]
  );

  const selectedMonsters = useMemo(() => {
    if (!selectedSpecies || !unlockedSpecies.includes(selectedSpecies)) {
      return [];
    }

    const unlockedTier = speciesProgress[selectedSpecies]?.unlockedTier ?? 1;
    return Object.values(monsterTypes)
      .filter(monster => monster.species === selectedSpecies)
      .filter(monster => (monster.tier || 1) <= unlockedTier)
      .sort((a, b) => (a.tier || 1) - (b.tier || 1));
  }, [monsterTypes, selectedSpecies, speciesProgress, unlockedSpecies]);

  const mana = gameState?.mana ?? 0;
  const gold = gameState?.gold ?? 0;

  const handleSpeciesClick = async (speciesName: string) => {
    const isUnlocked = unlockedSpecies.includes(speciesName);
    if (isUnlocked) {
      setSelectedSpecies(speciesName);
      selectMonster(null);
      return;
    }

    const cost = getSpeciesUnlockCost(speciesName);
    if (gold < cost || isUnlocking) {
      setMessage(`Need ${cost} gold to unlock ${speciesName}.`);
      return;
    }

    setIsUnlocking(speciesName);
    const result = await unlockMonsterSpeciesAPI(speciesName);
    if (result.success) {
      await refreshGameState();
      setSelectedSpecies(speciesName);
      setMessage(`${speciesName} unlocked.`);
    } else {
      setMessage(result.error ?? `Could not unlock ${speciesName}.`);
    }
    setIsUnlocking(null);
  };

  return (
    <Panel
      title="Monsters"
      className="flex h-full flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col gap-3 p-3"
    >
        <div className="grid grid-cols-2 gap-2">
          {allSpecies.map((speciesName, index) => {
            const isUnlocked = unlockedSpecies.includes(speciesName);
            const isSelected = selectedSpecies === speciesName;
            const cost = getSpeciesUnlockCost(speciesName);
            const disabled = !isUnlocked && (gold < cost || Boolean(isUnlocking));

            return (
              <button
                type="button"
                key={speciesName}
                onClick={() => void handleSpeciesClick(speciesName)}
                disabled={disabled}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                  isSelected
                    ? 'border-amber-200 bg-amber-200 text-slate-950'
                    : isUnlocked
                      ? speciesTone[index % speciesTone.length]
                      : 'border-slate-700 bg-slate-950/55 text-slate-400'
                }`}
                title={isUnlocked ? `Show ${speciesName}` : `Unlock for ${cost} gold`}
              >
                <span className="block truncate font-bold">{speciesName}</span>
                <span className="block text-[0.68rem] opacity-80">
                  {isUnlocked ? `Tier ${speciesProgress[speciesName]?.unlockedTier ?? 1}` : `${cost} gold`}
                </span>
              </button>
            );
          })}
        </div>

        {message ? (
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            {message}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {selectedMonsters.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3 text-sm text-slate-400">
              Select or unlock a species to reveal placeable monsters.
            </div>
          ) : (
            selectedMonsters.map(monster => {
              const canAfford = mana >= monster.baseCost;
              const isSelected = selectedMonster === monster.name;

              return (
                <button
                  type="button"
                  key={monster.name}
                  onClick={() => canAfford && selectMonster(isSelected ? null : monster.name)}
                  disabled={!canAfford}
                  className={`w-full rounded-lg border p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-amber-200 bg-amber-200 text-slate-950'
                      : 'border-slate-700 bg-slate-950/60 text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">
                        {monster.name} <span className="text-xs opacity-75">Tier {monster.tier}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs opacity-75">{monster.description}</div>
                    </div>
                    <div className="shrink-0 rounded border border-current px-2 py-1 text-xs font-bold">
                      {monster.baseCost} mana
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[0.68rem]">
                    <span>HP {monster.hp}</span>
                    <span>ATK {monster.attack}</span>
                    <span>DEF {monster.defense}</span>
                  </div>
                  {!canAfford ? (
                    <div className="mt-2 text-xs text-rose-200">Need {monster.baseCost - mana} more mana.</div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

    </Panel>
  );
}
