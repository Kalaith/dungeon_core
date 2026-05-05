import type { Room } from '../types/game';

export const formatGameTime = (hour: number): string => {
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${period}`;
};

export const getRoomCapacity = (room: Pick<Room, 'type' | 'position'>): number =>
  room.type === 'normal' || room.type === 'boss' ? Math.max(1, room.position) * 2 : 0;

export const statusTone = (status: string): string => {
  switch (status) {
    case 'Open':
      return 'text-emerald-200 bg-emerald-500/15 border-emerald-300/30';
    case 'Closing':
      return 'text-amber-200 bg-amber-500/15 border-amber-300/30';
    case 'Closed':
      return 'text-sky-200 bg-sky-500/15 border-sky-300/30';
    case 'Maintenance':
      return 'text-rose-200 bg-rose-500/15 border-rose-300/30';
    default:
      return 'text-slate-200 bg-slate-500/15 border-slate-300/30';
  }
};
