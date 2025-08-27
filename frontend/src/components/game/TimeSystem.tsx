import { useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { fetchGameConstantsData } from "../../api/gameApi";

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
      timeIntervalRef.current = setInterval(() => {
        advanceTime();
      }, gameConstants.TIME_ADVANCE_INTERVAL);
    };

    setupInterval();

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  return null; // This is a system component, no visual rendering
};
