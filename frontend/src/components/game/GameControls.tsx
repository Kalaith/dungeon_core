import React, { useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useBackendGameStore } from "../../stores/backendGameStore";
import { fetchGameConstantsData } from "../../api/gameApi";

export const GameControls: React.FC = () => {
  const { speed, status, setSpeed, setStatus, advanceTime, respawnMonsters, adventurerParties } = useGameStore();
  const { resetGame: resetBackendGame } = useBackendGameStore();
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance time
  useEffect(() => {
    const setupInterval = async () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      const gameConstants = await fetchGameConstantsData();
      if (gameConstants) {
        timeIntervalRef.current = setInterval(() => {
          advanceTime();
        }, gameConstants.TIME_ADVANCE_INTERVAL / speed);
      }
    };

    setupInterval();

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [speed, advanceTime]);

  const handleToggleSpeed = () => {
    const newSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    setSpeed(newSpeed);
  };
  const handleToggleDungeon = () => {
    if (status === 'Open') {
      setStatus('Closed'); // This will automatically handle the closing logic in game store
    } else if (status === 'Closed' || status === 'Closing') {
      setStatus('Open');
    }
    // Can't toggle out of Maintenance - that's automatic
  };
  const handleForceRespawn = () => {
    if (adventurerParties.length === 0) {
      respawnMonsters();
    }
  };

  const handleResetGame = async () => {
    if (window.confirm('Are you sure you want to reset the game? This will delete all progress and cannot be undone.')) {
      await resetBackendGame();
      // No need to reload the page - the backend reset handles everything
    }
  };

  const getSpeedButtonColor = () => {
    switch (speed) {
      case 1: return 'bg-green-500 hover:bg-green-600';
      case 2: return 'bg-yellow-500 hover:bg-yellow-600';
      case 4: return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="game-controls flex flex-wrap gap-4 justify-center items-center">
      <button 
        className={`btn px-4 py-2 rounded text-white transition-colors ${getSpeedButtonColor()}`}
        onClick={handleToggleSpeed} 
        id="speed-toggle"
        title="Change game speed"
      >
        {speed}x Speed
      </button>
        <button 
        className={`btn px-4 py-2 rounded text-white transition-colors ${
          status === 'Open' 
            ? 'bg-red-500 hover:bg-red-600' 
            : status === 'Closed'
              ? 'bg-green-500 hover:bg-green-600'
              : status === 'Closing'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={handleToggleDungeon}
        disabled={status === 'Maintenance'}
        title={
          status === 'Maintenance' 
            ? 'Cannot control during maintenance' 
            : status === 'Closing'
              ? 'Dungeon is closing - waiting for adventurers to finish'
              : 'Toggle dungeon open/closed'
        }
      >
        {status === 'Open' 
          ? 'Close Dungeon' 
          : status === 'Closed' 
            ? 'Open Dungeon' 
            : status === 'Closing'
              ? 'Closing...'
              : 'Maintenance'}
      </button><button
        className={`btn px-4 py-2 rounded text-white transition-colors ${
          adventurerParties.length === 0 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={handleForceRespawn}
        disabled={adventurerParties.length > 0}
        title={adventurerParties.length > 0 ? 'Cannot respawn while adventurers are present' : 'Force respawn all monsters'}
      >
        Respawn Monsters
      </button>

      <button
        className="btn px-4 py-2 rounded text-white transition-colors bg-red-600 hover:bg-red-700"
        onClick={handleResetGame}
        title="Reset game and clear all progress"
      >
        Reset Game
      </button>

      <div className="flex items-center gap-2 text-sm text-gray-300">
        <span>Active Parties: {adventurerParties.length}</span>
      </div>
    </div>
  );
};
