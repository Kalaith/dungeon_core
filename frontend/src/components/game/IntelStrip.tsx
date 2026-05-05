import { useMemo } from 'react';
import type { DungeonDataState } from '../../hooks/useDungeonData';
import { useBackendGameStore } from '../../stores/backendGameStore';
import { useGameStore } from '../../stores/gameStore';

const eventTone = {
  system: 'text-sky-200',
  combat: 'text-rose-200',
  adventure: 'text-amber-200',
  building: 'text-emerald-200',
};

interface IntelStripProps {
  dungeonData: DungeonDataState;
  variant?: 'all' | 'events' | 'core';
}

export function IntelStrip({ dungeonData, variant = 'all' }: IntelStripProps) {
  const gameState = useBackendGameStore(state => state.gameState);
  const { log } = useGameStore();
  const { floors, adventurerParties } = dungeonData;

  const rooms = useMemo(() => floors.flatMap(floor => floor.rooms), [floors]);
  const monsters = rooms.flatMap(room => room.monsters);
  const aliveMonsters = monsters.filter(monster => monster.alive).length;
  const activeParties = gameState?.activeAdventurerParties ?? adventurerParties.length;
  const coreIntegrity =
    gameState?.coreIntegrity ?? (monsters.length === 0 ? 100 : Math.round((aliveMonsters / monsters.length) * 100));
  const pressure = Math.max(0, ...adventurerParties.map(party => party.boredom ?? 0));
  const threatTone = activeParties > 0 ? 'text-amber-200' : 'text-emerald-200';

  const recentEvents = log.slice(-3).reverse();
  const displayedEvents =
    recentEvents.length > 0
      ? recentEvents
      : [
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

  const eventsCard = (
    <section className="min-h-0 rounded-lg border border-slate-700/80 bg-slate-900/82 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-slate-300">Recent Events</div>
      <div className="grid gap-1.5">
        {displayedEvents.map((entry, index) => {
          const type = typeof entry === 'string' ? 'system' : entry.type;
          const message = typeof entry === 'string' ? entry : entry.message;
          return (
            <div key={`${message}-${index}`} className="flex min-w-0 gap-2 text-xs">
              <span className={`shrink-0 font-semibold uppercase ${eventTone[type] ?? eventTone.system}`}>
                {type}
              </span>
              <span className="truncate text-slate-300">{message}</span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const coreCard = (
    <section className="grid min-h-0 grid-cols-4 gap-2 rounded-lg border border-slate-700/80 bg-slate-900/82 p-3">
      <div>
        <div className="text-[0.68rem] uppercase text-slate-400">Integrity</div>
        <div className="text-lg font-bold text-emerald-100">{coreIntegrity}%</div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase text-slate-400">Pressure</div>
        <div className={`text-lg font-bold ${pressure >= 70 ? 'text-rose-200' : pressure > 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
          {pressure}%
        </div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase text-slate-400">Mana</div>
        <div className="text-lg font-bold text-sky-100">+{gameState?.manaRegen ?? 0}</div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase text-slate-400">Threat</div>
        <div className={`text-lg font-bold ${threatTone}`}>{activeParties}</div>
      </div>
    </section>
  );

  const partiesCard = (
    <section className="min-h-0 rounded-lg border border-slate-700/80 bg-slate-900/82 p-3">
      <div className="text-xs font-semibold uppercase text-slate-300">Adventurers</div>
      <div className={`mt-2 text-lg font-bold ${threatTone}`}>
        {activeParties > 0 ? `${activeParties} active` : 'None inside'}
      </div>
      <div className="mt-1 truncate text-xs text-slate-400">
        {activeParties > 0 ? `Route pressure ${pressure}%` : 'Safe to rebuild when closed'}
      </div>
    </section>
  );

  if (variant === 'events') {
    return eventsCard;
  }

  if (variant === 'core') {
    return coreCard;
  }

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[0.85fr_1.35fr_1fr]">
      {partiesCard}
      {eventsCard}
      {coreCard}
    </div>
  );
}
