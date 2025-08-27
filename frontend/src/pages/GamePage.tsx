import { useState, useEffect } from "react";
import { useBackendGameStore } from "../stores/backendGameStore";
import { useSpeciesStore } from "../stores/speciesStore";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ResourceBar } from "../components/layout/ResourceBar";
import { SpeciesSelectionModal } from "../components/game/SpeciesSelectionModal";
import { MonsterSelector } from "../components/game/MonsterSelector";
import { DungeonView } from "../components/game/DungeonView";
import { GameControls } from "../components/game/GameControls";
import { RoomSelector } from "../components/game/RoomSelector";

export function GamePage() {
  const { 
    gameState,
    loading,
    error,
    initializeGame,
    refreshGameState
  } = useBackendGameStore();

  const { 
    unlockedSpecies
  } = useSpeciesStore();

  const [showSpeciesModal, setShowSpeciesModal] = useState(false);

  // Initialize game on first load
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Check if species modal should be shown
  useEffect(() => {
    if (unlockedSpecies.length === 0 && gameState) {
      setShowSpeciesModal(true);
    }
  }, [unlockedSpecies.length, gameState]);

  // Auto-refresh game state every 5 seconds
  useEffect(() => {
    if (gameState) {
      console.log('Setting up auto-refresh interval');
      const interval = setInterval(() => {
        console.log('Auto-refreshing game state...');
        refreshGameState();
      }, 5000);
      return () => {
        console.log('Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [refreshGameState, gameState]);

  // Handle species selection from modal
  const handleSpeciesSelect = () => {
    setShowSpeciesModal(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={initializeGame}
            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ResourceBar gameState={gameState} />
      
      {showSpeciesModal && (
        <SpeciesSelectionModal
          open={showSpeciesModal}
          onClose={handleSpeciesSelect}
        />
      )}
      
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Room construction */}
          <div className="lg:col-span-1">
            <RoomSelector />
          </div>
          
          {/* Center - Dungeon view */}
          <div className="lg:col-span-2">
            {/* DungeonView now handles its own floor/room data and monster placement */}
            <DungeonView />
          </div>
          
          {/* Right sidebar - Monster management */}
          <div className="lg:col-span-1">
            <MonsterSelector />
            
            <div className="bg-gray-800 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Monsters</h3>
              {/* Monsters will be shown by individual room components */}
              <p className="text-gray-400 text-sm">
                Monsters are displayed in their respective rooms
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating game controls at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg">
        <div className="container mx-auto">
          <GameControls />
        </div>
      </div>
    </div>
  );
}