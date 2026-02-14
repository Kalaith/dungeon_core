import React, { useState } from 'react';
import { useBackendGameStore } from '../../stores/backendGameStore';

export const BackendMonsterPlacement: React.FC = () => {
  const { gameState, selectedMonster, placeMonster, selectMonster } = useBackendGameStore();
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [roomPosition, setRoomPosition] = useState<number>(1);

  const handlePlaceMonster = async () => {
    if (!selectedMonster) return;

    const success = await placeMonster(floorNumber, roomPosition, selectedMonster);
    if (success) {
      selectMonster(null);
      setFloorNumber(1);
      setRoomPosition(1);
    }
  };

  if (!gameState) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-xl font-bold text-white mb-4">Place Monster</h3>

      {selectedMonster ? (
        <div className="space-y-4">
          <div className="text-white">
            Selected Monster: <span className="font-bold text-blue-400">{selectedMonster}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Floor Number:</label>
              <input
                type="number"
                value={floorNumber}
                onChange={e => setFloorNumber(parseInt(e.target.value) || 1)}
                className="bg-gray-700 text-white px-3 py-2 rounded"
                min="1"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Room Position:</label>
              <input
                type="number"
                value={roomPosition}
                onChange={e => setRoomPosition(parseInt(e.target.value) || 1)}
                className="bg-gray-700 text-white px-3 py-2 rounded"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePlaceMonster}
              disabled={!gameState.canModifyDungeon}
              className={`px-4 py-2 rounded ${gameState.canModifyDungeon ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
            >
              {gameState.canModifyDungeon ? 'Place Monster' : 'Close Dungeon to Build'}
            </button>
            <button
              onClick={() => selectMonster(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Select a monster from the Monster Selector to place it</div>
      )}
    </div>
  );
};
