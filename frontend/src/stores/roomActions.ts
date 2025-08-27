import type { GameState, DungeonFloor, Room, LogEntry } from '../types/game';
import { fetchGameConstantsData } from '../api/gameApi';
import { getRoomCost } from '../api/gameApi';

// Define a type for the full GameStore actions that will be passed to these functions
// This avoids circular dependency with the main gameStore.ts file
interface GameStoreActions {
  addLog: (entry: LogEntry | string) => void;
  spendMana: (amount: number) => boolean;
  createNewFloor: () => DungeonFloor;
  updateDeepCoreBonus: () => void;
}

// Combine GameState and GameStoreActions for the GetState/SetState types
type FullGameStore = GameState & GameStoreActions;

export const addRoom = async (set: (partial: Partial<FullGameStore>) => void, get: () => FullGameStore, targetFloorNumber?: number) => {
  const state = get();
  
  // Cannot add rooms while adventurers are in dungeon
  if (state.adventurerParties.length > 0) {
    get().addLog({ 
      message: "Cannot add rooms while adventurers are in the dungeon!", 
      type: "system"
    });
    return false;
  }
  
  let targetFloor: DungeonFloor;
  
  if (targetFloorNumber) {
    const floor = state.floors.find(f => f.number === targetFloorNumber);
    if (!floor) return false;
    targetFloor = floor;
  } else {
    // Add to the deepest floor by default
    targetFloor = state.floors.find(f => f.isDeepest) || state.floors[state.floors.length - 1];
  }        // Check if current floor is full (entrance + 5 regular/boss rooms, excluding core room)
  const nonCoreRooms = targetFloor.rooms.filter(room => room.type !== 'core');
  const gameConstants = await fetchGameConstantsData();
  if (!gameConstants) {
    get().addLog({ 
      message: "Failed to load game constants!", 
      type: "system"
    });
    return false;
  }
  if (nonCoreRooms.length >= gameConstants.MAX_ROOMS_PER_FLOOR + 1) {
    // Creating new floor - calculate total rooms across all floors
    const totalRoomCount = state.floors.reduce((total, floor) => {
      return total + floor.rooms.filter(room => room.type !== 'core' && room.type !== 'entrance').length;
    }, 0);
    const roomCost = getRoomCost(totalRoomCount, 'normal');
    
    // Check if player has enough mana
    if (state.mana < roomCost) {
      get().addLog({
        message: `Not enough mana! Need ${roomCost} mana to create a new floor.`,
        type: "system"
      });
      return false;
    }
    
    // Spend mana
    get().spendMana(roomCost);
    
    // Create new floor
    const newFloor = get().createNewFloor();
    
    // Add a normal room to the new floor
    const newRoom: Room = {
      id: Date.now() + 2,
      type: 'normal',
      position: 1,
      floorNumber: newFloor.number,
      monsters: [],
      roomUpgrade: null,
      explored: false,
      loot: 0
    };          newFloor.rooms.push(newRoom);

    // Update floor states and handle core room transfer
    const updatedFloors = state.floors.map(f => {
      // Remove core room from previous deepest floor
      if (f.isDeepest) {
        return {
          ...f,
          isDeepest: false,
          rooms: f.rooms.filter(room => room.type !== 'core')
        };
      }
      return { ...f, isDeepest: false };
    });
    updatedFloors.push(newFloor);

    // Add core room to the new deepest floor only
    const coreRoom: Room = {
      id: Date.now() + 3,
      type: 'core',
      position: gameConstants.MAX_ROOMS_PER_FLOOR + 1,
      floorNumber: newFloor.number,
      monsters: [],
      roomUpgrade: null,
      explored: false,
      loot: 0
    };

    newFloor.rooms.push(coreRoom);          set({ 
      floors: updatedFloors,
      totalFloors: state.totalFloors + 1
    });

    get().updateDeepCoreBonus();          get().addLog({ 
      message: `New floor ${newFloor.number} created! Room added at position 1 for ${roomCost} mana.`, 
      type: "system"
    });
    
    // Debug: Log current core room status
    const coreRooms = updatedFloors.flatMap(f => f.rooms.filter(r => r.type === 'core'));
    get().addLog({ 
      message: `Debug: ${coreRooms.length} core room(s) exist. On floors: ${coreRooms.map(r => r.floorNumber).join(', ')}`, 
      type: "system",
      timestamp: Date.now()
    });
    
    return true;        } else {
    // Add room to current floor, inserting before the core room
    const coreRoom = targetFloor.rooms.find(room => room.type === 'core');
    const nonCoreRooms = targetFloor.rooms.filter(room => room.type !== 'core');
      const nextPosition = nonCoreRooms.length;
    const roomType = nextPosition === gameConstants.MAX_ROOMS_PER_FLOOR ? 'boss' : 'normal';
    
    // Calculate room cost based on total room count across all floors
    const totalRoomCount = state.floors.reduce((total, floor) => {
      return total + floor.rooms.filter(room => room.type !== 'core' && room.type !== 'entrance').length;
    }, 0);
    const roomCost = getRoomCost(totalRoomCount, roomType);
    
    // Check if player has enough mana
    if (state.mana < roomCost) {
      get().addLog({
        message: `Not enough mana! Need ${roomCost} mana to add a ${roomType} room.`,
        type: "system"
      });
      return false;
    }
    
    // Spend mana
    get().spendMana(roomCost);
    
    const newRoom: Room = {
      id: Date.now(),
      type: roomType,
      position: nextPosition,
      floorNumber: targetFloor.number,
      monsters: [],
      roomUpgrade: null,
      explored: false,
      loot: 0
    };

    // Create updated rooms array with new room inserted before core room
    const updatedRooms = [...nonCoreRooms, newRoom];
    if (coreRoom) {
      // Update core room position to be after all other rooms
      const updatedCoreRoom = {
        ...coreRoom,
        position: updatedRooms.length
      };
      updatedRooms.push(updatedCoreRoom);
    }

    const updatedFloors = state.floors.map(floor => {
      if (floor.id === targetFloor.id) {
        return {
          ...floor,
          rooms: updatedRooms
        };
      }
      return floor;          });

    set({ floors: updatedFloors });
      get().addLog({ 
      message: `${roomType === 'boss' ? 'Boss room' : 'Normal room'} added to floor ${targetFloor.number} at position ${nextPosition} for ${roomCost} mana.`, 
      type: "system"
    });
    
    // Debug: Log current core room status
    const coreRooms = updatedFloors.flatMap(f => f.rooms.filter(r => r.type === 'core'));
    get().addLog({ 
      message: `Debug: ${coreRooms.length} core room(s) exist. On floors: ${coreRooms.map(r => r.floorNumber).join(', ')}`, 
      type: "system",
      timestamp: Date.now()
    });
    
    return true;
  }
};