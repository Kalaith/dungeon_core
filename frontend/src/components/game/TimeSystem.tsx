import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { fetchGameConstantsData } from '../../api/gameApi';
import { requirePositiveInterval } from '../../utils/gameConstants';

export const TimeSystem: React.FC = () => {
  const { advanceTime } = useGameStore();
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const setupInterval = async () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      const gameConstants = await fetchGameConstantsData();
      if (!gameConstants) {
        console.error('Failed to load game constants');
        return;
      }
      const intervalMs = requirePositiveInterval(gameConstants, 'TIME_ADVANCE_INTERVAL');
      timeIntervalRef.current = setInterval(() => {
        advanceTime();
      }, intervalMs);
    };

    setupInterval();

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [advanceTime]);

  return null; // This is a system component, no visual rendering
};
