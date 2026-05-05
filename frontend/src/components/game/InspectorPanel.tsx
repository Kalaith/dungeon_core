import { useEffect, useMemo, useState } from 'react';
import { getMonsterTypes } from '../../api/gameApi';
import type { DungeonDataState } from '../../hooks/useDungeonData';
import { useBackendGameStore } from '../../stores/backendGameStore';
import { useGameStore } from '../../stores/gameStore';
import type { MonsterType, Room } from '../../types/game';
import { getRoomCapacity } from '../../utils/gameFormat';
import { CommandButton } from '../ui/CommandButton';
import { Panel } from '../ui/Panel';

const roomTypeName = {
  entrance: 'Entrance',
  normal: 'Combat Room',
  boss: 'Boss Chamber',
  core: 'Core',
};

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/42 px-2 py-1.5">
      <div className="text-[0.58rem] uppercase text-slate-400">{label}</div>
      <div className="text-xs font-bold text-slate-100">{value}</div>
    </div>
  );
}

function InspectorPortrait({ tone }: { tone: 'monster' | 'room' | 'idle' }) {
  const className =
    tone === 'monster'
      ? 'border-amber-300/50 bg-amber-300/16 text-amber-100'
      : tone === 'room'
        ? 'border-violet-300/50 bg-violet-300/14 text-violet-100'
        : 'border-slate-600 bg-slate-950/55 text-slate-400';

  return (
    <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-lg border ${className}`}>
      {tone === 'monster' ? (
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10">
          <path d="M8 25c0-11 7-18 16-18s16 7 16 18-7 16-16 16S8 36 8 25Z" fill="currentColor" />
          <path d="M17 21h.1M31 21h.1" stroke="#020617" strokeLinecap="round" strokeWidth="5" />
          <path d="M18 29q6 5 12 0" fill="none" stroke="#020617" strokeLinecap="round" strokeWidth="3" />
        </svg>
      ) : tone === 'room' ? (
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10">
          <path d="M7 38V14l17-8 17 8v24H7Z" fill="currentColor" opacity="0.85" />
          <path
            d="M15 38V21h18v17M7 14h34"
            fill="none"
            stroke="#020617"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10">
          <path d="M24 7v34M7 24h34" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
        </svg>
      )}
    </div>
  );
}

interface InspectorPanelProps {
  dungeonData: DungeonDataState;
  selectedRoom: Room | null;
}

export function InspectorPanel({ dungeonData, selectedRoom }: InspectorPanelProps) {
  const gameState = useBackendGameStore(state => state.gameState);
  const selectedMonster = useBackendGameStore(state => state.selectedMonster);
  const selectMonster = useBackendGameStore(state => state.selectMonster);
  const placeMonster = useBackendGameStore(state => state.placeMonster);
  const { adventurerParties } = useGameStore();
  const { floors } = dungeonData;
  const [monsterTypes, setMonsterTypes] = useState<Record<string, MonsterType>>({});
  const [inspectorMessage, setInspectorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadMonsterTypes = async () => {
      setMonsterTypes(await getMonsterTypes());
    };

    void loadMonsterTypes();
  }, []);

  const rooms = useMemo(() => floors.flatMap(floor => floor.rooms), [floors]);
  const selectedMonsterDetails = selectedMonster ? monsterTypes[selectedMonster] : null;
  const selectedRoomCapacity = selectedRoom ? getRoomCapacity(selectedRoom) : 0;
  const selectedAliveMonsters = selectedRoom?.monsters.filter(monster => monster.alive) ?? [];
  const selectedDeadMonsters = selectedRoom
    ? selectedRoom.monsters.length - selectedAliveMonsters.length
    : 0;
  const selectedRoomAdventurers = selectedRoom
    ? adventurerParties
        .filter(
          party =>
            party.currentFloor === selectedRoom.floorNumber &&
            party.currentRoom === selectedRoom.position &&
            !party.retreating
        )
        .reduce((total, party) => total + party.members.filter(member => member.alive).length, 0)
    : 0;
  const selectedRoomParties = selectedRoom
    ? adventurerParties.filter(
        party =>
          party.currentFloor === selectedRoom.floorNumber &&
          party.currentRoom === selectedRoom.position &&
          !party.retreating
      ).length
    : 0;
  const selectedRoomCombat = selectedRoomAdventurers > 0 && selectedAliveMonsters.length > 0;
  const validPlacementRooms = rooms.filter(
    room => room.type === 'normal' || room.type === 'boss'
  );
  const canModify = Boolean(gameState?.canModifyDungeon);
  const mana = gameState?.mana ?? 0;
  const selectedMonsterCost = selectedMonsterDetails?.baseCost ?? 0;
  const selectedRoomCanHost =
    Boolean(selectedRoom) && (selectedRoom?.type === 'normal' || selectedRoom?.type === 'boss');
  const canSpawnInSelectedRoom =
    Boolean(selectedMonster && selectedRoom && selectedRoomCanHost && canModify && mana >= selectedMonsterCost);
  const placementBlocker = !selectedMonster
    ? null
    : !canModify
      ? 'Close the dungeon and wait for adventurers before spawning.'
      : selectedMonsterDetails && mana < selectedMonsterDetails.baseCost
        ? `Need ${selectedMonsterDetails.baseCost - mana} more mana.`
        : selectedRoom && !selectedRoomCanHost
          ? 'Select a combat or boss room.'
          : selectedRoom
            ? null
            : 'Select a valid room on the map.';
  const roomEffect = selectedRoom?.roomUpgrade
    ? `${selectedRoom.roomUpgrade.name}: ${selectedRoom.roomUpgrade.effect}`
    : selectedRoom?.type === 'entrance'
      ? 'Entry point for adventurer parties.'
      : selectedRoom?.type === 'core'
        ? 'Protect this chamber to preserve the run.'
        : selectedRoom?.type === 'boss'
          ? 'Higher-capacity danger room for stronger defenders.'
          : selectedRoom
            ? 'Standard combat room for monster placement.'
            : null;

  const handleSpawnHere = async () => {
    if (!selectedMonster || !selectedRoom || !canSpawnInSelectedRoom) {
      setInspectorMessage(placementBlocker);
      return;
    }

    setInspectorMessage(null);
    const success = await placeMonster(
      selectedRoom.floorNumber,
      selectedRoom.position,
      selectedMonster
    );
    await dungeonData.reload();
    if (success) {
      selectMonster(null);
      setInspectorMessage(`${selectedMonster} spawned in floor ${selectedRoom.floorNumber}.`);
    } else {
      setInspectorMessage('Spawn failed.');
    }
  };

  return (
    <Panel
      title="Inspector"
      className="flex h-full flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
    >
      {selectedMonster ? (
        <>
          <div className="flex min-w-0 gap-3">
            <InspectorPortrait tone="monster" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-violet-50">{selectedMonster}</div>
              <div className="mt-1 text-xs text-violet-200">
                {selectedMonsterDetails
                  ? `${selectedMonsterDetails.species} / Tier ${selectedMonsterDetails.tier}`
                  : 'Loading monster data'}
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-300">
                {selectedMonsterDetails?.description ?? 'Select a valid room to place this monster.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatPill label="Cost" value={selectedMonsterDetails?.baseCost ?? '-'} />
            <StatPill label="Valid Rooms" value={validPlacementRooms.length} />
            <StatPill label="HP" value={selectedMonsterDetails?.hp ?? '-'} />
            <StatPill label="ATK" value={selectedMonsterDetails?.attack ?? '-'} />
            <StatPill label="DEF" value={selectedMonsterDetails?.defense ?? '-'} />
            <StatPill label="Mana" value={mana} />
          </div>

          <div className="rounded-lg border border-violet-300/20 bg-violet-500/10 p-3 text-xs text-violet-100">
            {placementBlocker ?? `Ready for ${selectedRoom ? roomTypeName[selectedRoom.type] : 'room'} placement.`}
          </div>
          {inspectorMessage ? (
            <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-xs text-amber-100">
              {inspectorMessage}
            </div>
          ) : null}
          <CommandButton
            className="mt-auto min-h-10 px-3 py-2 text-xs"
            fullWidth
            variant={canSpawnInSelectedRoom ? 'arcane' : 'ghost'}
            disabled={!canSpawnInSelectedRoom}
            onClick={() => void handleSpawnHere()}
          >
            {selectedRoom ? 'Spawn Here' : 'Select Room'}
          </CommandButton>
        </>
      ) : selectedRoom ? (
        <>
          <div className="flex min-w-0 gap-3">
            <InspectorPortrait tone="room" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-violet-50">
                F{selectedRoom.floorNumber} {roomTypeName[selectedRoom.type]}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-violet-200">{roomEffect}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatPill label="Capacity" value={selectedRoomCapacity || '-'} />
            <StatPill label="Monsters" value={`${selectedAliveMonsters.length}/${selectedRoom.monsters.length}`} />
            <StatPill label="Adventurers" value={selectedRoomAdventurers} />
            <StatPill label="Loot" value={selectedRoom.loot} />
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-700/80 bg-slate-950/42 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <span>Parties in room</span>
              <span className="font-bold text-slate-100">{selectedRoomParties}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Defenders down</span>
              <span className="font-bold text-slate-100">{selectedDeadMonsters}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Activity</span>
              <span className={selectedRoomCombat ? 'font-bold text-orange-200' : 'font-bold text-emerald-200'}>
                {selectedRoomCombat ? 'Combat active' : 'Quiet'}
              </span>
            </div>
          </div>

          {selectedRoom.monsters.length > 0 ? (
            <div className="grid gap-2 overflow-y-auto pr-1">
              {selectedRoom.monsters.map(monster => {
                const hpPercent =
                  monster.maxHp > 0 ? Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100)) : 0;
                return (
                  <div
                    key={monster.id}
                    className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/45 p-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-violet-50">{monster.type}</div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-950/70">
                        <div
                          className={`h-full rounded-full ${monster.alive ? 'bg-emerald-300' : 'bg-rose-300'}`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-right font-semibold text-violet-100">
                      {monster.hp}/{monster.maxHp}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/45 p-3 text-xs text-violet-200">
              Empty room. {canModify ? 'Select a monster from Build to spawn here.' : 'Close dungeon to modify.'}
            </div>
          )}

          <div className="mt-auto rounded-lg border border-violet-300/20 bg-violet-500/10 p-3 text-xs text-violet-200">
            {selectedRoomCanHost ? 'Action: place monsters when closed.' : 'Utility room. No monster placement.'}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-3">
            <InspectorPortrait tone="idle" />
            <div className="min-w-0">
              <div className="text-base font-bold text-violet-50">Select a room or monster</div>
              <div className="mt-1 text-xs text-violet-200">
                {canModify ? 'Build mode ready.' : 'Dungeon open. Build and spawning are locked.'}
              </div>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-slate-700/80 bg-slate-950/45 p-3 text-xs leading-relaxed text-slate-300">
            <span>Pick a room on the board to inspect occupants, capacity, effects, and combat state.</span>
            <span>Open Build, select a monster, then choose a valid room to spawn it.</span>
          </div>
        </>
      )}
    </Panel>
  );
}
