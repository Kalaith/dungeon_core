import React, { useState } from 'react';
import { useBackendGameStore } from '../../stores/backendGameStore';

export const BackendMonsterPlacement: React.FC = () => {
  const { gameState, selectedMonster, placeMonster, selectMonster } = useBackendGameStore();
  const [roomId, setRoomId] = useState<number>(1);

  const handlePlaceMonster = async () => {
    if (!selectedMonster) return;
    
    const success = await placeMonster(roomId, selectedMonster);
    if (success) {
      selectMonster(null);
      setRoomId(1);
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
          
          <div>
            <label className="block text-white mb-2">Room ID:</label>
            <input
              type="number"
              value={roomId}
              onChange={(e) => setRoomId(parseInt(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded"
              min="1"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePlaceMonster}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Place Monster
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
        <div className="text-gray-400">
          Select a monster from the Monster Selector to place it
        </div>
      )}
    </div>
  );
};