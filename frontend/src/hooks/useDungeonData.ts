import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/client';
import { getDungeonState } from '../api/gameApi';
import type { AdventurerParty, DungeonFloor } from '../types/game';

export interface DungeonDataState {
  floors: DungeonFloor[];
  adventurerParties: AdventurerParty[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDungeonData(refreshMs = 3000, enabled = true): DungeonDataState {
  const [floors, setFloors] = useState<DungeonFloor[]>([]);
  const [adventurerParties, setAdventurerParties] = useState<AdventurerParty[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const floorsRef = useRef<DungeonFloor[]>([]);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const reload = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const runReload = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const hadData = floorsRef.current.length > 0;

      try {
        setLoading(current => current || !hadData);
        const dungeonData = await getDungeonStateWithRetry();
        const nextFloors: DungeonFloor[] = (dungeonData.floors ?? []).map(floor => ({
          ...floor,
          rooms: floor.rooms.map(room => ({
            ...room,
            monsters: room.monsters.map(monster => ({
              ...monster,
              floorNumber: room.floorNumber,
              scaledStats: {
                hp: monster.maxHp,
                attack: 5,
                defense: 2,
              },
            })),
          })),
        }));

        if (requestId !== requestIdRef.current) {
          return;
        }

        floorsRef.current = nextFloors;
        setFloors(nextFloors);
        setAdventurerParties((dungeonData.adventurerParties ?? []) as AdventurerParty[]);
        setError(null);
      } catch (caughtError) {
        console.error('Failed to load dungeon data:', caughtError);
        if (!hadData) {
          setError('Failed to load dungeon data');
        } else {
          setError(null);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    const promise = runReload();
    inFlightRef.current = promise;
    try {
      await promise;
    } finally {
      if (inFlightRef.current === promise) {
        inFlightRef.current = null;
      }
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => {
      void reload();
    }, refreshMs);

    return () => clearInterval(interval);
  }, [enabled, refreshMs, reload]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleRoomsChanged = () => {
      void reload();
    };

    window.addEventListener('dungeon-core:rooms-changed', handleRoomsChanged);
    return () => window.removeEventListener('dungeon-core:rooms-changed', handleRoomsChanged);
  }, [enabled, reload]);

  return { floors, adventurerParties, loading, error, reload };
}

const retryDelaysMs = [250, 750, 1500, 3000];

async function getDungeonStateWithRetry() {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      return await getDungeonState();
    } catch (caughtError) {
      lastError = caughtError;
      if (!shouldRetryDungeonLoad(caughtError) || attempt === retryDelaysMs.length) {
        break;
      }

      await wait(retryDelaysMs[attempt]);
    }
  }

  throw lastError;
}

function shouldRetryDungeonLoad(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return error.nonJson || error.status === undefined || error.status >= 500;
  }

  return true;
}

function wait(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, delayMs);
  });
}
