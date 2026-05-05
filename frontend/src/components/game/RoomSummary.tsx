import type { DungeonFloor, Room } from '../../types/game';

interface RoomSummaryProps {
  floors: DungeonFloor[];
  selectedRoom: Room | null;
}

export function RoomSummary({ floors, selectedRoom }: RoomSummaryProps) {
  const rooms = floors.flatMap(floor => floor.rooms);
  const aliveMonsters = rooms.reduce(
    (total, room) => total + room.monsters.filter(monster => monster.alive).length,
    0
  );
  const deadMonsters = rooms.reduce(
    (total, room) => total + room.monsters.filter(monster => !monster.alive).length,
    0
  );
  const defendableRooms = rooms.filter(room => room.type === 'normal' || room.type === 'boss').length;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="text-[0.68rem] uppercase text-slate-400">Floors</div>
          <div className="text-xl font-bold text-slate-100">{floors.length}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="text-[0.68rem] uppercase text-slate-400">Rooms</div>
          <div className="text-xl font-bold text-slate-100">{defendableRooms}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="text-[0.68rem] uppercase text-slate-400">Monsters</div>
          <div className="text-xl font-bold text-slate-100">
            {aliveMonsters}
            <span className="text-sm font-semibold text-slate-500">/{deadMonsters}</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
        <div className="text-[0.68rem] uppercase text-slate-400">Selected Room</div>
        {selectedRoom ? (
          <div className="mt-1 grid gap-1 text-sm text-slate-200 sm:grid-cols-4">
            <span>Floor {selectedRoom.floorNumber}</span>
            <span className="capitalize">{selectedRoom.type}</span>
            <span>{selectedRoom.monsters.length} monsters</span>
            <span>{selectedRoom.loot} loot</span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Select a room to inspect capacity and contents.</p>
        )}
      </div>
    </div>
  );
}
