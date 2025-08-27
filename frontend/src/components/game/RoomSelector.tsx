import React, { useEffect, useState } from "react";
import { useBackendGameStore } from "../../stores/backendGameStore";
import { fetchGameConstantsData, getRoomCost, getDungeonState } from "../../api/gameApi";

export const RoomSelector: React.FC = () => {
  const [gameConstants, setGameConstants] = useState<any>(null);
  const [roomCost, setRoomCost] = useState(0);
  const [displayMessage, setDisplayMessage] = useState("Loading...");
  const [floors, setFloors] = useState<any[]>([]);

  useEffect(() => {
    const fetchConstants = async () => {
      setGameConstants(await fetchGameConstantsData());
    };
    fetchConstants();
  }, []);

  // Load floor data for room calculations
  useEffect(() => {
    const loadFloors = async () => {
      try {
        const dungeonData = await getDungeonState();
        if (dungeonData && dungeonData.floors) {
          setFloors(dungeonData.floors);
        }
      } catch (err) {
        console.error('Failed to load floors for RoomSelector:', err);
      }
    };
    loadFloors();
  }, []);
  
  const { gameState, addRoom } = useBackendGameStore();
  
  // Get current game data from simplified state
  const mana = gameState?.mana || 0;
  const totalFloors = floors.length;
  
  // Calculate the cost for the next room
  const getNextRoomCost = async () => {
    if (!gameConstants) return 0;
    
    const deepestFloor = floors.find((f: any) => f.isDeepest);
    if (!deepestFloor) return await getRoomCost(0, 'normal');

    const nonCoreRooms = deepestFloor.rooms.filter((room: any) => room.type !== 'core');
    
    // Calculate total room count across all floors (excluding entrance and core rooms)
    const totalRoomCount = floors.reduce((total: number, floor: any) => {
      return total + floor.rooms.filter((room: any) => room.type !== 'core' && room.type !== 'entrance').length;
    }, 0);
    
    // If the current floor is full, next room will be on a new floor
    if (nonCoreRooms.length >= gameConstants.MAX_ROOMS_PER_FLOOR + 1) {
      return await getRoomCost(totalRoomCount, 'normal');
    } else {
      const nextPosition = nonCoreRooms.length;
      const roomType = nextPosition === gameConstants.MAX_ROOMS_PER_FLOOR ? 'boss' : 'normal';
      return await getRoomCost(totalRoomCount, roomType);
    }
  };

  // Update room cost when dependencies change
  useEffect(() => {
    const updateRoomCost = async () => {
      setRoomCost(await getNextRoomCost());
    };
    updateRoomCost();
  }, [floors, gameConstants]);

  // Update display message
  useEffect(() => {
    const updateMessage = async () => {
      if (!gameConstants) {
        setDisplayMessage("Loading...");
        return;
      }
      
      const deepestFloor = floors.find((f: any) => f.isDeepest);
      if (!deepestFloor) {
        setDisplayMessage("Adds first room");
        return;
      }
      
      const nonCoreRooms = deepestFloor.rooms.filter((room: any) => room.type !== 'core');
      
      if (nonCoreRooms.length >= gameConstants.MAX_ROOMS_PER_FLOOR + 1) {
        setDisplayMessage(`Creates floor ${totalFloors + 1}`);
      } else {
        const nextPosition = nonCoreRooms.length;
        const roomType = nextPosition === gameConstants.MAX_ROOMS_PER_FLOOR ? 'Boss' : 'Normal';
        setDisplayMessage(`${roomType} room on floor ${deepestFloor.number}`);
      }
    };
    updateMessage();
  }, [floors, totalFloors, gameConstants]);

  const handleAddRoom = async () => {
    if (mana >= roomCost && gameConstants) {
      try {
        const deepestFloor = floors.find((f: any) => f.isDeepest);
        if (!deepestFloor) {
          // Create first floor with entrance room
          const success = await addRoom(1, 'entrance', 0);
          if (!success) {
            console.error('Failed to add entrance room');
          }
        } else {
          const nonCoreRooms = deepestFloor.rooms.filter((room: any) => room.type !== 'core');
          
          // If current floor is full, create new floor
          if (nonCoreRooms.length >= gameConstants.MAX_ROOMS_PER_FLOOR + 1) {
            const newFloorNumber = totalFloors + 1;
            const success = await addRoom(newFloorNumber, 'normal', 1);
            if (!success) {
              console.error('Failed to add room');
            }
          } else {
            // Add to current floor - position should be after all existing non-core rooms
            const nextPosition = nonCoreRooms.length; // This gives us: 0 non-core → pos 0, 1 non-core → pos 1, etc.
            // But since entrance is at position 0, we need to add 1 to get the correct insertion position
            const insertPosition = nextPosition + 1;
            const roomType = nextPosition === gameConstants.MAX_ROOMS_PER_FLOOR - 1 ? 'boss' : 'normal';
            const success = await addRoom(deepestFloor.number, roomType, insertPosition);
            if (!success) {
              console.error('Failed to add room');
            }
          }
        }
      } catch (error) {
        console.error('Error adding room:', error);
      }
    }
  };

  const canAfford = mana >= roomCost;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-white">Dungeon Construction</h3>
      
      <div className="construction-options space-y-4">
        <div className="add-room-section">
          <h4 className="font-semibold text-gray-300 mb-2">Add Room</h4>
          <button
            className={`w-full p-3 rounded border-2 transition-all ${
              canAfford 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleAddRoom}
            disabled={!canAfford}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">Add New Room</span>
              <span className={`text-sm font-bold ${canAfford ? 'text-blue-200' : 'text-red-400'}`}>
                {roomCost}💎
              </span>
            </div>
            <div className="text-xs mt-1 opacity-90">
              {displayMessage}
            </div>
          </button>
        </div>

        <div className="room-info bg-blue-900 p-3 rounded">
          <h4 className="font-semibold text-blue-200 mb-2">Room System</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <div>• Rooms 1-4: Normal combat</div>
            <div>• Room 5: Boss chamber</div>
            <div>• {gameConstants?.MAX_ROOMS_PER_FLOOR + 1} rooms per floor</div>
            <div>• Core room on deepest floor</div>
            <div>• New floor when current is full</div>
          </div>
        </div>

        <div className="scaling-info bg-yellow-900 p-3 rounded">
          <h4 className="font-semibold text-yellow-200 mb-2">Floor Scaling</h4>
          <div className="text-xs text-yellow-300 space-y-1">
            <div>• Deeper floors = stronger monsters</div>
            <div>• Higher mana costs per floor</div>
            <div>• Better loot rewards</div>
            <div>• Core bonus: +5% mana/floor</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
        💡 Add rooms to expand your dungeon. When a floor reaches {gameConstants?.MAX_ROOMS_PER_FLOOR + 1} rooms, 
        the next room will start a new floor.
      </div>
    </div>
  );
};
