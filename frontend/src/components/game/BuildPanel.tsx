import { useEffect, useMemo, useState } from 'react';
import { fetchGameConstantsData, getRoomCost } from '../../api/gameApi';
import type { DungeonDataState } from '../../hooks/useDungeonData';
import { useBackendGameStore } from '../../stores/backendGameStore';
import type { DungeonFloor, GameConstants } from '../../types/game';
import { CommandButton } from '../ui/CommandButton';
import { Panel } from '../ui/Panel';

export interface BuildPlan {
  floorNumber: number;
  position: number;
  type: 'entrance' | 'normal' | 'boss';
  cost: number;
  label: string;
}

const combatRooms = (floor: DungeonFloor) =>
  floor.rooms.filter(room => room.type === 'normal' || room.type === 'boss');

const totalBuiltRooms = (floors: DungeonFloor[]) =>
  floors.reduce((total, floor) => total + combatRooms(floor).length, 0);

const findDeepestFloor = (floors: DungeonFloor[]) =>
  floors.find(floor => floor.isDeepest) ?? floors[floors.length - 1];

export function nextBuildPlan(floors: DungeonFloor[], constants: GameConstants | null): BuildPlan {
  const maxCombatRooms = constants?.MAX_ROOMS_PER_FLOOR ?? 5;
  const totalCombatRooms = totalBuiltRooms(floors);
  const deepestFloor = findDeepestFloor(floors);

  if (!deepestFloor) {
    return {
      floorNumber: 1,
      position: 0,
      type: 'entrance',
      cost: 0,
      label: 'Create the entrance floor',
    };
  }

  const currentCombatRooms = combatRooms(deepestFloor);
  if (currentCombatRooms.length >= maxCombatRooms) {
    const cost = getRoomCost(totalCombatRooms, 'normal');
    return {
      floorNumber: floors.length + 1,
      position: 1,
      type: 'normal',
      cost,
      label: `Open floor ${floors.length + 1}`,
    };
  }

  const position = currentCombatRooms.length + 1;
  const type = position === maxCombatRooms ? 'boss' : 'normal';
  const cost = getRoomCost(totalCombatRooms, type);
  return {
    floorNumber: deepestFloor.number,
    position,
    type,
    cost,
    label: `${type === 'boss' ? 'Boss chamber' : 'Combat room'} on floor ${deepestFloor.number}`,
  };
}

function roomCountLabel(floors: DungeonFloor[], constants: GameConstants | null): string {
  const deepestFloor = findDeepestFloor(floors);
  if (!deepestFloor) {
    return 'No floor established';
  }

  const maxCombatRooms = constants?.MAX_ROOMS_PER_FLOOR ?? 5;
  return `${combatRooms(deepestFloor).length}/${maxCombatRooms} combat rooms on deepest floor`;
}

interface BuildPanelProps {
  dungeonData: DungeonDataState;
}

export function BuildPanel({ dungeonData }: BuildPanelProps) {
  const { floors, loading, reload } = dungeonData;
  const { gameState, addRoom } = useBackendGameStore();
  const [constants, setConstants] = useState<GameConstants | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadConstants = async () => {
      setConstants(await fetchGameConstantsData());
    };

    void loadConstants();
  }, []);

  const plan = useMemo(() => nextBuildPlan(floors, constants), [constants, floors]);
  const canModify = gameState?.canModifyDungeon ?? false;
  const mana = gameState?.mana ?? 0;
  const canAfford = mana >= plan.cost;
  const canBuild = canModify && canAfford && !loading && !isBuilding;

  const blocker = !canModify
    ? 'Close the dungeon and wait for adventurers before constructing.'
    : !canAfford
      ? `Need ${plan.cost - mana} more mana.`
      : null;

  const handleBuild = async () => {
    if (!canBuild) {
      setMessage(blocker);
      return;
    }

    setIsBuilding(true);
    setMessage(null);
    const success = await addRoom(plan.floorNumber, plan.type, plan.position, plan.cost);
    await reload();
    window.dispatchEvent(new CustomEvent('dungeon-core:rooms-changed'));
    setMessage(success ? `${plan.label} added.` : 'Room construction failed.');
    setIsBuilding(false);
  };
  const roomTypes = [
    { key: 'entrance', label: 'Entrance' },
    { key: 'normal', label: 'Combat' },
    { key: 'boss', label: 'Boss' },
    { key: 'core', label: 'Core' },
  ];

  return (
    <Panel
      title="Build"
      className="flex h-full flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col gap-3 p-3"
    >
      <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
        <div className="text-xs font-semibold uppercase text-slate-400">Next</div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold leading-snug text-slate-50">{plan.label}</div>
            <div className="mt-1 text-xs text-slate-400">{roomCountLabel(floors, constants)}</div>
          </div>
          <div className="shrink-0 rounded-lg border border-sky-300/30 bg-sky-400/10 px-2.5 py-2 text-xs font-bold text-sky-100">
            {plan.cost} mana
          </div>
        </div>
        {blocker ? <p className="mt-2 text-xs text-amber-200">{blocker}</p> : null}
        {message ? <p className="mt-2 text-xs text-slate-300">{message}</p> : null}
        <CommandButton
          className="mt-3 min-h-9"
          fullWidth
          onClick={() => void handleBuild()}
          disabled={!canBuild}
          variant={canBuild ? 'primary' : 'ghost'}
        >
          {isBuilding ? 'Building...' : 'Add Room'}
        </CommandButton>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {roomTypes.map(roomType => {
          const active = roomType.key === plan.type || (plan.type === 'normal' && roomType.key === 'normal');
          return (
            <div
              key={roomType.key}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                active
                  ? 'border-amber-200 bg-amber-200 text-slate-950'
                  : 'border-slate-700/80 bg-slate-950/45 text-slate-300'
              }`}
            >
              {roomType.label}
            </div>
          );
        })}
      </div>

      <div className="mt-auto rounded-lg border border-slate-700/80 bg-slate-950/45 px-3 py-2 text-xs text-slate-300">
        {canModify ? 'Build mode ready.' : 'Build locked while the dungeon is open.'}
      </div>
    </Panel>
  );
}
