import type { GameState } from '../../stores/backendGameStore';
import { formatGameTime, statusTone } from '../../utils/gameFormat';

interface TopHudProps {
  gameState: GameState;
  playerName: string;
  isGuest: boolean;
  linkUrl?: string;
}

export function TopHud({ gameState, playerName, isGuest, linkUrl }: TopHudProps) {
  const manaPercent = gameState.maxMana > 0 ? (gameState.mana / gameState.maxMana) * 100 : 0;

  return (
    <div className="grid items-center gap-2 lg:grid-cols-[210px_minmax(0,1fr)_310px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-violet-300/35 bg-violet-500/15 text-2xl">
          DC
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight text-slate-50">Dungeon Core</h1>
          <div className="truncate text-xs text-slate-400">
            {playerName}
            {isGuest ? ' (Guest)' : ''}
            {isGuest && linkUrl ? (
              <a className="ml-2 text-amber-200 hover:text-amber-100" href={linkUrl}>
                Link
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-3 gap-2">
        <div className="rounded-lg border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sky-100">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[0.68rem] font-semibold uppercase opacity-75">Mana</span>
            <span className="text-[0.68rem] opacity-80">+{gameState.manaRegen}/tick</span>
          </div>
          <div className="mt-1 text-lg font-bold leading-none">
            {gameState.mana}/{gameState.maxMana}
          </div>
          <progress
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/35 accent-current"
            value={Math.max(0, Math.min(100, manaPercent))}
            max={100}
            aria-label="Mana meter"
          />
        </div>
        <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-amber-100">
          <div className="text-[0.68rem] font-semibold uppercase opacity-75">Gold</div>
          <div className="mt-1 text-lg font-bold leading-none">{gameState.gold}</div>
        </div>
        <div className="rounded-lg border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-violet-100">
          <div className="text-[0.68rem] font-semibold uppercase opacity-75">Souls</div>
          <div className="mt-1 text-lg font-bold leading-none">{gameState.souls}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-2">
        <div className="rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 py-2 text-slate-100">
          <div className="text-[0.68rem] font-semibold uppercase opacity-75">Time</div>
          <div className="mt-1 truncate text-sm font-bold">
            Day {gameState.day} · {formatGameTime(gameState.hour)}
          </div>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 ${statusTone(gameState.status)}`}
          aria-label={`Dungeon status ${gameState.status}`}
        >
          <div className="text-[0.68rem] font-semibold uppercase opacity-75">Status</div>
          <div className="mt-1 truncate text-sm font-bold">{gameState.status}</div>
        </div>
        <div className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-emerald-100">
          <div className="text-[0.68rem] font-semibold uppercase opacity-75">Parties</div>
          <div className="mt-1 text-sm font-bold">{gameState.activeAdventurerParties}</div>
        </div>
      </div>

    </div>
  );
}
