import React from "react";
import { useGameStore } from "../../stores/gameStore";
import type { Room } from "../../types/game";

export interface DungeonGridProps {
  onRoomClick?: (floorNumber: number, roomPosition: number) => void;
}

export const DungeonGrid: React.FC<DungeonGridProps> = ({ onRoomClick }) => {
  const { floors, adventurerParties, selectedRoom } = useGameStore();

  const handleRoomClick = (floorNumber: number, roomPosition: number) => {
    if (onRoomClick) {
      onRoomClick(floorNumber, roomPosition);
    }
  };

  const getRoomTypeDisplay = (room: Room) => {
    switch (room.type) {
      case 'entrance':
        return { symbol: 'E', color: 'bg-green-200 border-green-400', title: 'Entrance' };
      case 'core':
        return { symbol: 'C', color: 'bg-purple-200 border-purple-400', title: 'Core Room' };
      case 'boss':
        return { symbol: 'B', color: 'bg-red-200 border-red-400', title: 'Boss Room' };
      default:
        return { symbol: 'R', color: 'bg-blue-200 border-blue-400', title: 'Normal Room' };
    }
  };

  const getAdventurersInRoom = (floorNumber: number, roomPosition: number) => {
    return adventurerParties
      .filter(party => party.currentFloor === floorNumber && party.currentRoom === roomPosition)
      .flatMap(party => party.members.filter(member => member.alive));
  };

  return (
    <div className="overflow-auto w-full">
      <div className="space-y-4 p-4">
        {floors.map((floor) => (
          <div key={floor.id} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-bold mb-3 text-center">
              Floor {floor.number} {floor.isDeepest && '(Deepest)'}
            </h3>
            <div className="flex justify-center">
              <div className="grid grid-cols-6 gap-2 max-w-4xl">
                {Array.from({ length: 6 }, (_, pos) => {
                  const room = floor.rooms.find(r => r.position === pos);
                  if (!room) {
                    return (
                      <div
                        key={`${floor.number}-${pos}`}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
                        onClick={() => handleRoomClick(floor.number, pos)}
                        title="Add Room"
                      >
                        <span className="text-gray-400 text-2xl">+</span>
                      </div>
                    );
                  }

                  const roomDisplay = getRoomTypeDisplay(room);
                  const adventurersHere = getAdventurersInRoom(floor.number, pos);
                  const isSelected = selectedRoom === room.id;

                  return (
                    <div
                      key={room.id}
                      className={`relative w-20 h-20 border-2 rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-80 ${roomDisplay.color} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleRoomClick(floor.number, pos)}
                      title={roomDisplay.title}
                    >
                      {/* Room type indicator */}
                      <span className="absolute top-1 left-1 text-xs font-bold">
                        {roomDisplay.symbol}
                      </span>

                      {/* Monsters */}
                      {room.monsters.length > 0 && (
                        <div className="text-xs flex flex-wrap justify-center" title={`${room.monsters.length} monsters`}>
                          {room.monsters.slice(0, 2).map((monster) => (
                            <span 
                              key={monster.id} 
                              style={{ color: "gray" }}
                              className={monster.alive ? "" : "opacity-50"}
                            >
                              🐲
                            </span>
                          ))}
                          {room.monsters.length > 2 && (
                            <span className="text-red-600 font-bold text-xs">+{room.monsters.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Adventurers */}
                      {adventurersHere.length > 0 && (
                        <div className="text-xs flex flex-wrap justify-center mt-1" title={`${adventurersHere.length} adventurers`}>
                          {adventurersHere.slice(0, 2).map((adventurer) => (
                            <span 
                              key={adventurer.id} 
                              style={{ color: "blue" }}
                            >
                              🧑‍🎤
                            </span>
                          ))}
                          {adventurersHere.length > 2 && (
                            <span className="text-blue-600 font-bold text-xs">+{adventurersHere.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Loot */}
                      {room.loot > 0 && (
                        <span className="absolute top-1 right-1 text-yellow-500 text-xs" title={`${room.loot} gold`}>
                          💰
                        </span>
                      )}

                      {/* Room upgrade indicator */}
                      {room.roomUpgrade && (
                        <span className="absolute bottom-1 right-1 text-xs" title={room.roomUpgrade.name}>
                          ⚡
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
