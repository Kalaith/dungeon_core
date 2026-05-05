import { useMemo } from 'react';
import { useBackendGameStore } from '../../stores/backendGameStore';
import { useGameStore } from '../../stores/gameStore';
import { useDungeonData } from '../../hooks/useDungeonData';
import { Panel } from '../ui/Panel';

const eventTone = {
  system: 'text-sky-200 border-sky-300/20 bg-sky-500/10',
  combat: 'text-rose-200 border-rose-300/20 bg-rose-500/10',
  adventure: 'text-amber-200 border-amber-300/20 bg-amber-500/10',
  building: 'text-emerald-200 border-emerald-300/20 bg-emerald-500/10',
};

interface StatusPanelsProps {
  variant?: 'all' | 'events' | 'core';
}

export function StatusPanels({ variant = 'all' }: StatusPanelsProps) {
  const gameState = useBackendGameStore(state => state.gameState);
  const selectedMonster = useBackendGameStore(state => state.selectedMonster);
  const { log, adventurerParties } = useGameStore();
  const { floors } = useDungeonData(5000);

  const rooms = useMemo(() => floors.flatMap(floor => floor.rooms), [floors]);
  const monsters = rooms.flatMap(room => room.monsters);
  const aliveMonsters = monsters.filter(monster => monster.alive).length;
  const activeParties = gameState?.activeAdventurerParties ?? adventurerParties.length;
  const coreIntegrity =
    gameState?.coreIntegrity ?? (monsters.length === 0 ? 100 : Math.round((aliveMonsters / monsters.length) * 100));

  const recentEvents = log.slice(-4).reverse();
  const fallbackEvents = [
    {
      type: 'system' as const,
      message: `Dungeon is ${gameState?.status ?? 'loading'}.`,
      timestamp: Date.now(),
    },
    {
      type: 'building' as const,
      message: `${rooms.length} rooms mapped across ${floors.length} floor${floors.length === 1 ? '' : 's'}.`,
      timestamp: Date.now(),
    },
  ];
  const displayedEvents = recentEvents.length > 0 ? recentEvents : fallbackEvents;

  const tips = [
    !gameState?.canModifyDungeon
      ? 'Close the dungeon before expanding rooms or placing monsters.'
      : 'The dungeon is closed; build or reinforce before reopening.',
    selectedMonster
      ? `Place ${selectedMonster} in a highlighted combat room.`
      : 'Select a monster to preview valid placement rooms.',
    rooms.length <= 2
      ? 'Add combat rooms before relying on the entrance and core alone.'
      : 'Boss rooms work best after the route has enough defenders.',
  ];

  const coreFlavor =
    gameState?.status === 'Open'
      ? gameState.coreDestroyed
        ? 'The Core has been destroyed by bored adventurers.'
        : 'The entrance is lit. Adventurers can test the route at any moment.'
      : gameState?.canModifyDungeon
        ? 'The halls are sealed. The Core is ready for new stone and defenders.'
        : 'The Core waits for the dungeon to stabilize before construction resumes.';

  const showEvents = variant === 'all' || variant === 'events';
  const showCore = variant === 'all' || variant === 'core';
  const gridClass =
    variant === 'all' ? 'grid gap-4 lg:grid-cols-2 xl:grid-cols-4' : 'grid gap-4';

  return (
    <div className={gridClass}>
      {showEvents ? (
        <Panel title="Adventurer Parties" subtitle="Current raid pressure.">
        {activeParties > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: activeParties }, (_, index) => (
              <div
                key={index}
                className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3"
              >
                <div className="font-semibold text-amber-100">Party {index + 1}</div>
                <div className="mt-1 text-sm text-amber-200">Exploring the active dungeon route.</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No parties are inside. This is the safest moment to rebuild once the dungeon is closed.
          </p>
        )}
        </Panel>
      ) : null}

      {showEvents ? (
        <Panel title="Recent Events" subtitle="Stable preview of the current log.">
        <div className="space-y-2">
          {displayedEvents.map((entry, index) => {
            const type = typeof entry === 'string' ? 'system' : entry.type;
            const message = typeof entry === 'string' ? entry : entry.message;
            return (
              <div
                key={`${message}-${index}`}
                className={`rounded-lg border px-3 py-2 text-sm ${eventTone[type] ?? eventTone.system}`}
              >
                <div className="text-[0.62rem] font-semibold uppercase opacity-75">{type}</div>
                <div>{message}</div>
              </div>
            );
          })}
        </div>
        </Panel>
      ) : null}

      {showCore ? (
        <Panel title="Core Status" subtitle="Progression and stability.">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
            <div className="text-xs uppercase text-slate-400">Integrity</div>
            <div className="mt-1 text-xl font-bold text-emerald-100">{coreIntegrity}%</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
            <div className="text-xs uppercase text-slate-400">Mana Rate</div>
            <div className="mt-1 text-xl font-bold text-sky-100">+{gameState?.manaRegen ?? 0}</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
            <div className="text-xs uppercase text-slate-400">Threat</div>
            <div className="mt-1 text-xl font-bold text-rose-100">{activeParties}</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
            <div className="text-xs uppercase text-slate-400">Depth</div>
            <div className="mt-1 text-xl font-bold text-violet-100">{floors.length}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-300">{coreFlavor}</p>
        </Panel>
      ) : null}

      {showCore ? (
        <Panel title="Quick Tips" subtitle="Context for the next action.">
        <div className="space-y-2">
          {tips.map(tip => (
            <div
              key={tip}
              className="rounded-lg border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-sm text-slate-300"
            >
              {tip}
            </div>
          ))}
        </div>
        </Panel>
      ) : null}
    </div>
  );
}
