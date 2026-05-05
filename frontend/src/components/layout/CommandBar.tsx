import { useEffect, useRef, useState } from 'react';
import { useBackendGameStore } from '../../stores/backendGameStore';
import { useGameStore } from '../../stores/gameStore';
import { fetchGameConstantsData } from '../../api/gameApi';
import { CommandButton } from '../ui/CommandButton';
import { requirePositiveInterval } from '../../utils/gameConstants';

export function CommandBar() {
  const { speed, status, setSpeed, setStatus, advanceTime, respawnMonsters, adventurerParties } =
    useGameStore();
  const { resetGame, updateStatus, gameState } = useBackendGameStore();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const setupInterval = async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const constants = await fetchGameConstantsData();
      const intervalMs = requirePositiveInterval(constants, 'TIME_ADVANCE_INTERVAL');
      intervalRef.current = setInterval(() => {
        advanceTime();
      }, intervalMs / speed);
    };

    void setupInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [advanceTime, speed]);

  const displayStatus = gameState?.status || status;
  const activeParties = gameState?.activeAdventurerParties ?? adventurerParties.length;
  const canRespawn = activeParties === 0;

  const primaryLabel =
    displayStatus === 'Open'
      ? 'Close Dungeon'
      : displayStatus === 'Closed'
        ? 'Open Dungeon'
        : displayStatus === 'Closing'
          ? 'Closing...'
          : 'Maintenance';

  const primaryVariant = displayStatus === 'Open' ? 'danger' : 'primary';

  const handleToggleSpeed = () => {
    setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1);
  };

  const handleToggleDungeon = async () => {
    if (displayStatus === 'Maintenance' || isChangingStatus) {
      return;
    }

    const targetStatus =
      displayStatus === 'Open' ? (activeParties > 0 ? 'Closing' : 'Closed') : 'Open';
    setIsChangingStatus(true);
    setStatus(targetStatus as typeof status);
    const success = await updateStatus(targetStatus);
    if (!success) {
      setStatus(displayStatus as typeof status);
    }
    setIsChangingStatus(false);
  };

  const handleRespawn = () => {
    if (canRespawn) {
      respawnMonsters();
    }
  };

  const handleReset = async () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      return;
    }

    setIsResetting(true);
    try {
      await resetGame();
      window.dispatchEvent(new Event('dungeon-core:rooms-changed'));
      setIsConfirmingReset(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <CommandButton onClick={handleToggleSpeed} variant="ghost" className="min-w-24">
          {speed}x Speed
        </CommandButton>
        <CommandButton
          onClick={() => void handleToggleDungeon()}
          disabled={displayStatus === 'Maintenance' || isChangingStatus}
          variant={primaryVariant}
          className="min-w-36"
        >
          {isChangingStatus ? 'Working...' : primaryLabel}
        </CommandButton>
        <CommandButton
          onClick={handleRespawn}
          disabled={!canRespawn}
          variant="arcane"
          className="min-w-40"
        >
          Respawn Monsters
        </CommandButton>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm text-slate-300">
        {isConfirmingReset ? (
          <div className="flex items-center gap-2 rounded-md border border-rose-300/30 bg-rose-950/50 px-2 py-1">
            <span className="hidden text-xs font-semibold text-rose-100 sm:inline">
              Reset current session?
            </span>
            <CommandButton
              onClick={() => void handleReset()}
              disabled={isResetting}
              variant="danger"
            >
              {isResetting ? 'Resetting...' : 'Confirm'}
            </CommandButton>
            <CommandButton
              onClick={() => setIsConfirmingReset(false)}
              disabled={isResetting}
              variant="ghost"
            >
              Cancel
            </CommandButton>
          </div>
        ) : (
          <CommandButton onClick={() => setIsConfirmingReset(true)} variant="danger">
            Reset
          </CommandButton>
        )}
      </div>
    </div>
  );
}
