import { useEffect, useMemo, useState } from 'react';
import { fetchGameConstantsData } from '../../api/gameApi';
import { useBackendGameStore } from '../../stores/backendGameStore';
import type { GameConstants, Room } from '../../types/game';
import type { DungeonDataState } from '../../hooks/useDungeonData';
import { Panel } from '../ui/Panel';
import { nextBuildPlan } from './BuildPanel';
import { FutureRoomTile, RoomTile } from './RoomTile';

const sortByPosition = (rooms: Room[]) => [...rooms].sort((a, b) => a.position - b.position);

type BoardNode =
  | { kind: 'room'; room: Room }
  | { kind: 'future'; floorNumber: number; position: number; id: string };

const combatRooms = (rooms: Room[]) =>
  rooms.filter(room => room.type === 'normal' || room.type === 'boss');

function boardNodesForFloor(rooms: Room[], maxCombatRoomsPerFloor: number): BoardNode[] {
  const orderedRooms = sortByPosition(rooms);
  const currentCombatRooms = combatRooms(orderedRooms);
  const canShowFutureRoom = currentCombatRooms.length < maxCombatRoomsPerFloor;

  return orderedRooms.flatMap((room, index) => {
    const nodes: BoardNode[] = [{ kind: 'room', room }];
    const nextRoom = orderedRooms[index + 1];
    if (canShowFutureRoom && nextRoom?.type === 'core' && room.type !== 'core') {
      nodes.push({
        kind: 'future',
        floorNumber: room.floorNumber,
        position: currentCombatRooms.length + 1,
        id: `future-${room.floorNumber}-${currentCombatRooms.length + 1}`,
      });
    }

    return nodes;
  });
}

interface DungeonBoardProps {
  dungeonData: DungeonDataState;
  selectedRoomId: number | null;
  onSelectedRoomChange: (roomId: number) => void;
}

export function DungeonBoard({
  dungeonData,
  selectedRoomId,
  onSelectedRoomChange,
}: DungeonBoardProps) {
  const { floors, adventurerParties, loading, error, reload } = dungeonData;
  const { selectedMonster, selectMonster, placeMonster, gameState } = useBackendGameStore();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [constants, setConstants] = useState<GameConstants | null>(null);

  useEffect(() => {
    if (floors.length > 0 && selectedFloor === null) {
      setSelectedFloor(floors[0].number);
    }
  }, [floors, selectedFloor]);

  useEffect(() => {
    const loadConstants = async () => {
      setConstants(await fetchGameConstantsData());
    };

    void loadConstants();
  }, []);

  const sortedFloors = useMemo(
    () => [...floors].sort((a, b) => a.number - b.number),
    [floors]
  );
  const rooms = useMemo(() => floors.flatMap(floor => floor.rooms), [floors]);
  const buildPlan = useMemo(() => nextBuildPlan(floors, constants), [constants, floors]);
  const maxCombatRoomsPerFloor = constants?.MAX_ROOMS_PER_FLOOR ?? 5;
  const canModify = gameState?.canModifyDungeon ?? false;
  const mana = gameState?.mana ?? 0;
  const canAffordBuildPlan = mana >= buildPlan.cost;
  const canBuildPlan = canModify && canAffordBuildPlan && !loading;
  const buildBlocker = !canModify
    ? 'Close the dungeon and wait for adventurers to leave before constructing.'
    : !canAffordBuildPlan
      ? `Need ${buildPlan.cost - mana} more mana.`
      : null;
  const aliveMonsters = rooms.reduce(
    (total, room) => total + room.monsters.filter(monster => monster.alive).length,
    0
  );
  const canPlaceInRoom = (room: Room) => {
    return (
      Boolean(selectedMonster) &&
      Boolean(gameState?.canModifyDungeon) &&
      (room.type === 'normal' || room.type === 'boss')
    );
  };

  const activityForRoom = (room: Room) => {
    const parties = adventurerParties.filter(
      party =>
        party.currentFloor === room.floorNumber &&
        party.currentRoom === room.position &&
        !party.retreating
    );
    const adventurerCount = parties.reduce(
      (total, party) => total + party.members.filter(member => member.alive).length,
      0
    );

    return {
      adventurerCount,
      isFighting: adventurerCount > 0 && room.monsters.some(monster => monster.alive),
    };
  };

  const handleRoomSelect = async (room: Room) => {
    onSelectedRoomChange(room.id);
    setSelectedFloor(room.floorNumber);
    setActionError(null);

    if (!selectedMonster) {
      return;
    }

    if (!gameState?.canModifyDungeon) {
      setActionError('Close the dungeon and wait for adventurers to leave before placing monsters.');
      return;
    }

    if (room.type === 'entrance' || room.type === 'core') {
      setActionError('Monsters cannot be placed in entrance or core rooms.');
      return;
    }

    const success = await placeMonster(room.floorNumber, room.position, selectedMonster);
    await reload();
    if (success) {
      selectMonster(null);
      setActionError(null);
    }
  };

  const handleFutureRoomSelect = (floorNumber: number, position: number) => {
    setSelectedFloor(floorNumber);
    setActionError(buildBlocker);
    window.dispatchEvent(
      new CustomEvent('dungeon-core:open-build-menu', {
        detail: { floorNumber, position },
      })
    );
  };

  if (loading) {
    return (
      <Panel className="flex h-full flex-col" contentClassName="grid min-h-0 flex-1 place-items-center p-6">
        <div className="text-slate-300">Loading dungeon...</div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="flex h-full flex-col" contentClassName="grid min-h-0 flex-1 place-items-center p-6">
        <div className="text-rose-200">{error}</div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Dungeon"
      className="flex h-full flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col gap-2 p-2"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden text-slate-400 xl:inline">
            {sortedFloors.length}F / {rooms.length}R / {aliveMonsters}M
          </span>
          {selectedMonster ? (
            <span className="rounded-md border border-violet-300/30 bg-violet-500/10 px-2 py-1 font-semibold text-violet-100">
              Placing {selectedMonster}
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 font-semibold text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
          >
            Heatmap: Off
          </button>
        </div>
      }
    >
      {actionError ? (
        <div className="rounded-md border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {actionError}
        </div>
      ) : null}
      <div className="dungeon-board-surface dense-dungeon-board min-h-0 flex-1 overflow-auto rounded-lg border border-slate-700/80 p-2">
        <div className="grid gap-2">
          {sortedFloors.map(floor => (
            <section
              key={floor.id}
              className={`dungeon-floor-row rounded-lg border p-2 ${
                selectedFloor === floor.number
                  ? 'border-amber-200/45 bg-amber-200/5'
                  : 'border-slate-700/70 bg-slate-950/30'
              }`}
            >
              <div className="relative z-10 grid min-w-0 grid-cols-[3rem_1fr] items-center gap-2">
                <div className="grid h-full min-h-[74px] place-items-center rounded-md border border-slate-700/75 bg-slate-950/52 px-1 text-center">
                  <div>
                    <div className="text-[0.62rem] font-semibold uppercase text-slate-500">Floor</div>
                    <div className="text-base font-black leading-none text-slate-100">{floor.number}</div>
                    <div className="mt-1 text-[0.58rem] font-semibold text-slate-500">{floor.rooms.length}R</div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center overflow-x-auto overflow-y-visible px-1 py-1">
                  {boardNodesForFloor(floor.rooms, maxCombatRoomsPerFloor).map((node, index, orderedNodes) => {
                    if (node.kind === 'future') {
                      return (
                        <div key={node.id} className="relative z-10 flex shrink-0 items-center">
                          <FutureRoomTile
                            floorNumber={node.floorNumber}
                            position={node.position}
                            canBuild={canBuildPlan}
                            cost={buildPlan.cost}
                            roomType={buildPlan.type === 'boss' ? 'boss' : 'normal'}
                            onSelect={() => handleFutureRoomSelect(node.floorNumber, node.position)}
                          />
                          {index < orderedNodes.length - 1 ? (
                            <div className="dungeon-corridor dungeon-corridor--ghost" aria-hidden="true">
                              <span />
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    const { room } = node;
                    const placementState = selectedMonster
                      ? canPlaceInRoom(room)
                        ? 'valid'
                        : 'invalid'
                      : 'idle';
                    const activity = activityForRoom(room);

                    return (
                      <div key={room.id} className="flex shrink-0 items-center">
                        <RoomTile
                          room={room}
                          selected={selectedRoomId === room.id}
                          placementState={placementState}
                          adventurerCount={activity.adventurerCount}
                          isFighting={activity.isFighting}
                          onSelect={() => void handleRoomSelect(room)}
                        />
                        {index < orderedNodes.length - 1 ? (
                          <div className="dungeon-corridor" aria-hidden="true">
                            <span />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </Panel>
  );
}
