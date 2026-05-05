import type { Room } from '../../types/game';
import { getRoomCapacity } from '../../utils/gameFormat';

interface RoomTileProps {
  room: Room;
  selected: boolean;
  placementState: 'valid' | 'invalid' | 'idle';
  adventurerCount?: number;
  isFighting?: boolean;
  onSelect: () => void;
}

const roomTone = {
  entrance:
    'border-emerald-300/75 bg-[radial-gradient(circle_at_50%_28%,rgba(110,231,183,0.28),transparent_40%),linear-gradient(180deg,rgba(6,78,59,0.86),rgba(6,35,33,0.96))] text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.26)]',
  normal:
    'border-sky-300/55 bg-[radial-gradient(circle_at_50%_25%,rgba(125,211,252,0.16),transparent_38%),linear-gradient(180deg,rgba(30,64,89,0.88),rgba(15,23,42,0.98))] text-sky-50 shadow-[0_0_15px_rgba(56,189,248,0.14)]',
  boss:
    'border-orange-300/80 bg-[radial-gradient(circle_at_50%_28%,rgba(251,146,60,0.28),transparent_40%),linear-gradient(180deg,rgba(127,29,29,0.9),rgba(39,18,18,0.98))] text-orange-50 shadow-[0_0_22px_rgba(249,115,22,0.3)]',
  core:
    'border-violet-300/85 bg-[radial-gradient(circle_at_50%_30%,rgba(216,180,254,0.34),transparent_40%),linear-gradient(180deg,rgba(88,28,135,0.88),rgba(34,20,65,0.98))] text-violet-50 shadow-[0_0_22px_rgba(168,85,247,0.32)]',
};

const roomLabel = {
  entrance: 'Entrance',
  normal: 'Room',
  boss: 'Boss',
  core: 'Core',
};

function DoorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8">
      <path d="M18 56V18c0-6 5-10 14-10s14 4 14 10v38" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M24 56V22c0-3 3-6 8-6s8 3 8 6v34" fill="rgba(16,185,129,0.18)" stroke="currentColor" strokeWidth="4" />
      <path d="M37 35h3" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path d="M13 56h38" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
    </svg>
  );
}

function CrystalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8">
      <path d="M32 5 48 24 39 58H25L16 24 32 5Z" fill="rgba(216,180,254,0.2)" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
      <path d="M32 5v53M16 24h32M25 58l7-34 7 34" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function SwordsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8">
      <path d="M16 10 47 41M10 16l31 31" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path d="M42 36 52 46M36 42l10 10M12 52l9-3 28-28 3-9-9 3-28 28-3 9Z" fill="rgba(125,211,252,0.16)" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function SkullIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8">
      <path d="M15 31c0-13 7-22 17-22s17 9 17 22c0 8-3 13-9 16v8H24v-8c-6-3-9-8-9-16Z" fill="rgba(251,146,60,0.18)" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
      <path d="M24 31h1M39 31h1" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
      <path d="M31 39h2M25 55v-8M32 55v-8M39 55v-8" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function RoomIcon({ type }: { type: Room['type'] }) {
  if (type === 'entrance') {
    return <DoorIcon />;
  }

  if (type === 'core') {
    return <CrystalIcon />;
  }

  if (type === 'boss') {
    return <SkullIcon />;
  }

  return <SwordsIcon />;
}

function MonsterFaceIcon({ mood }: { mood: 'steady' | 'hurt' | 'down' }) {
  const mouthPath =
    mood === 'steady' ? 'M19 26q5 5 10 0' : mood === 'hurt' ? 'M19 28q5-4 10 0' : 'M19 28h10';

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-3.5 w-3.5">
      <path
        d="M8 25c0-11 7-18 16-18s16 7 16 18-7 16-16 16S8 36 8 25Z"
        fill="currentColor"
      />
      {mood === 'down' ? (
        <>
          <path d="m17 19 5 5m0-5-5 5M27 19l5 5m0-5-5 5" stroke="#020617" strokeLinecap="round" strokeWidth="3" />
          <path d={mouthPath} stroke="#020617" strokeLinecap="round" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M18 21h.1M30 21h.1" stroke="#020617" strokeLinecap="round" strokeWidth="5" />
          <path d={mouthPath} fill="none" stroke="#020617" strokeLinecap="round" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-3.5 w-3.5">
      <path d="M24 23a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" fill="currentColor" />
      <path d="M10 42c2-10 7-15 14-15s12 5 14 15" fill="currentColor" />
    </svg>
  );
}

function CombatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
      <path d="M12 10 38 36M36 10 10 36" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path d="m7 41 7-2-5-5-2 7Zm34 0-2-7-5 5 7 2Z" fill="currentColor" />
    </svg>
  );
}

function monsterMood(monster: Room['monsters'][number]): 'steady' | 'hurt' | 'down' {
  if (!monster.alive) {
    return 'down';
  }

  return monster.maxHp > 0 && monster.hp / monster.maxHp < 0.5 ? 'hurt' : 'steady';
}

interface FutureRoomTileProps {
  floorNumber: number;
  position: number;
  canBuild: boolean;
  isBuilding?: boolean;
  cost?: number;
  roomType?: 'normal' | 'boss';
  onSelect: () => void;
}

export function FutureRoomTile({
  floorNumber,
  position,
  canBuild,
  isBuilding = false,
  cost,
  roomType = 'normal',
  onSelect,
}: FutureRoomTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isBuilding}
      aria-disabled={isBuilding}
      data-testid={`future-room-${floorNumber}-${position}`}
      className={`future-room-tile relative z-10 flex h-[74px] w-[68px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed text-center transition duration-150 hover:-translate-y-0.5 hover:border-amber-100/80 hover:bg-amber-200/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${
        canBuild
          ? 'border-amber-200/80 bg-amber-200/12 text-amber-100'
          : 'border-slate-600/80 bg-slate-950/35 text-slate-500'
      } ${isBuilding ? 'cursor-wait opacity-75' : ''}`}
      aria-label={`Choose room to build on floor ${floorNumber}, position ${position}`}
      title={`Choose room to build - floor ${floorNumber}, position ${position}`}
    >
      <span className="absolute inset-1 rounded-md border border-slate-700/50" />
      <span className="relative z-10 grid h-8 w-8 place-items-center rounded-md border border-current/45 bg-slate-950/70 text-lg font-black">
        +
      </span>
      <span className="relative z-10 mt-1 max-w-full px-1 text-[0.55rem] font-black uppercase leading-none">
        {isBuilding ? 'Build' : cost ? `${cost}M` : roomType === 'boss' ? 'Boss' : 'Room'}
      </span>
    </button>
  );
}

export function RoomTile({
  room,
  selected,
  placementState,
  adventurerCount = 0,
  isFighting = false,
  onSelect,
}: RoomTileProps) {
  const aliveMonsters = room.monsters.filter(monster => monster.alive);
  const aliveCount = aliveMonsters.length;
  const deadCount = room.monsters.length - aliveCount;
  const capacity = getRoomCapacity(room);
  const occupied = room.monsters.length > 0;
  const damaged = deadCount > 0;
  const danger = room.type === 'boss' || damaged;
  const displayedMonsters = room.monsters.slice(0, 3);
  const extraMonsterCount = Math.max(0, room.monsters.length - displayedMonsters.length);
  const displayedAdventurers = Math.min(adventurerCount, 3);

  const stateClass = selected
    ? 'scale-[1.04] border-amber-200 ring-4 ring-amber-200/35 shadow-[0_0_0_3px_rgba(251,191,36,0.28),0_12px_24px_rgba(0,0,0,0.4)]'
    : placementState === 'valid'
      ? 'ring-4 ring-emerald-300/45 shadow-[0_0_0_3px_rgba(110,231,183,0.16),0_0_22px_rgba(16,185,129,0.22)]'
      : placementState === 'invalid'
        ? 'opacity-55 grayscale'
        : '';
  const activityClass = isFighting ? 'room-tile-combat' : danger ? 'room-tile-danger' : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`room-tile relative grid h-[74px] w-[94px] shrink-0 place-items-center overflow-hidden rounded-lg border-2 p-1.5 text-center shadow-inner transition duration-150 hover:-translate-y-0.5 hover:scale-[1.03] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${roomTone[room.type]} ${stateClass} ${activityClass}`}
      aria-pressed={selected}
      aria-label={`${roomLabel[room.type]} on floor ${room.floorNumber}, position ${room.position}, ${aliveCount} monsters, ${adventurerCount} adventurers`}
      title={`${roomLabel[room.type]} - floor ${room.floorNumber}, ${aliveCount} monsters, ${adventurerCount} adventurers`}
    >
      <span className="pointer-events-none absolute inset-x-3 top-1.5 h-4 rounded-[50%] bg-white/10 blur-md" />
      <div className="absolute left-1.5 top-1.5 z-20 flex items-center gap-0.5">
        {displayedMonsters.map(monster => (
          <span
            key={monster.id}
            className={`grid h-4 w-4 place-items-center rounded-full border border-black/35 ${
              monster.alive
                ? monster.maxHp > 0 && monster.hp / monster.maxHp < 0.5
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-emerald-200 text-emerald-950'
                : 'bg-rose-300 text-rose-950'
            }`}
          >
            <MonsterFaceIcon mood={monsterMood(monster)} />
          </span>
        ))}
        {extraMonsterCount > 0 ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-slate-100 px-1 text-[0.5rem] font-black text-slate-950">
            +{extraMonsterCount}
          </span>
        ) : null}
      </div>
      <div className="absolute right-1.5 top-1.5 z-20 flex items-center gap-0.5">
        {isFighting ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-300 text-orange-950 shadow-[0_0_14px_rgba(251,146,60,0.85)]">
            <CombatIcon />
          </span>
        ) : null}
        {Array.from({ length: displayedAdventurers }).map((_, index) => (
          <span
            key={index}
            className="grid h-4 w-4 place-items-center rounded-full border border-black/35 bg-sky-200 text-sky-950"
          >
            <PersonIcon />
          </span>
        ))}
        {adventurerCount > displayedAdventurers ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sky-100 px-1 text-[0.5rem] font-black text-sky-950">
            +{adventurerCount - displayedAdventurers}
          </span>
        ) : null}
      </div>
      <div className="relative z-10 grid place-items-center rounded-md border border-white/15 bg-black/18 p-1.5 text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
        <RoomIcon type={room.type} />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between gap-1">
        <span className="rounded border border-white/15 bg-black/38 px-1.5 py-0.5 text-[0.56rem] font-bold shadow-inner">
          {capacity ? `C${capacity}` : '-'}
        </span>
        {occupied ? (
          <span className={`rounded border border-white/15 px-1.5 py-0.5 text-[0.56rem] font-bold shadow-inner ${damaged ? 'bg-orange-900/80 text-orange-100' : 'bg-black/38'}`}>
            {aliveCount}
          </span>
        ) : null}
      </div>
      {placementState === 'valid' ? (
        <span className="absolute right-1 top-1/2 z-20 grid min-h-5 min-w-5 -translate-y-1/2 place-items-center rounded-full bg-emerald-200 px-1 text-[0.56rem] font-black uppercase text-emerald-950 shadow-[0_0_12px_rgba(110,231,183,0.95)]">
          Place
        </span>
      ) : null}
    </button>
  );
}
