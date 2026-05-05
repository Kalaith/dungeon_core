import type { DungeonFloor } from '../../types/game';

interface FloorRailProps {
  floors: DungeonFloor[];
  selectedFloor: number | null;
  onSelectFloor: (floorNumber: number) => void;
}

export function FloorRail({ floors, selectedFloor, onSelectFloor }: FloorRailProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
      {floors.map(floor => {
        const active = selectedFloor === floor.number;
        return (
          <button
            type="button"
            key={floor.id}
            onClick={() => onSelectFloor(floor.number)}
            className={`min-w-20 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${
              active
                ? 'border-amber-200 bg-amber-200 text-slate-950'
                : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block">Floor {floor.number}</span>
            <span className="block text-[0.62rem] font-medium opacity-75">
              {floor.isDeepest ? 'Deepest' : `${floor.rooms.length} rooms`}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
