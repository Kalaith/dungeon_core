import React, { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useBackendGameStore } from "../../stores/backendGameStore";
import type { DungeonFloor, Room, MonsterType } from "../../types/game";
import { fetchGameConstantsData, getMonsterTypes, getScaledMonsterStats, getDungeonState } from "../../api/gameApi";

interface DungeonFloorViewProps {
  floor: DungeonFloor;
  onRoomClick: (floorNumber: number, roomPosition: number) => void;
}

const RoomComponent: React.FC<{ 
  room: Room; 
  onClick: () => void;
  isActive: boolean;
  floor: DungeonFloor;
}> = ({ room, onClick, isActive, floor }) => {
  const [monsterTypes, setMonsterTypes] = useState<{ [key: string]: MonsterType }>({});
  
  useEffect(() => {
    const loadMonsterTypes = async () => {
      const types = await getMonsterTypes();
      setMonsterTypes(types);
    };
    loadMonsterTypes();
  }, []);

  // Calculate the proper room number (excluding entrance)
  const getRoomNumber = () => {
    if (room.type === 'entrance') return 'Entrance';
    if (room.type === 'core') return 'Core';
    
    // For normal/boss rooms, calculate the room number by counting non-entrance rooms before this one
    const roomsBeforeThis = floor.rooms
      .filter(r => r.type !== 'entrance' && r.type !== 'core' && r.position < room.position)
      .length;
    
    return `Room ${roomsBeforeThis + 1}`;
  };  const getRoomColor = () => {
    const baseColor = (() => {
      switch (room.type) {
        case 'entrance': return '#4CAF50';
        case 'normal': return '#9E9E9E';
        case 'boss': return '#F44336';
        case 'core': return '#9C27B0';
        default: return '#9E9E9E';
      }
    })();

    // Modify color based on monster status
    if (room.monsters.length > 0) {
      const aliveMonsters = room.monsters.filter(m => m.alive).length;
      const deadMonsters = room.monsters.filter(m => !m.alive).length;
      
      if (deadMonsters > 0 && aliveMonsters === 0) {
        // All monsters dead - darker/desaturated
        return baseColor + '80'; // Add transparency
      } else if (deadMonsters > 0) {
        // Some monsters dead - slightly darker
        return baseColor + 'CC'; // Slightly transparent
      }
    }
    
    return baseColor;
  };

  const getRoomIcon = () => {
    switch (room.type) {
      case 'entrance': return '🚪';
      case 'normal': return '⚔️';
      case 'boss': return '👑';
      case 'core': return '💎';
      default: return '❓';
    }
  };

  const adventurersHere = useGameStore.getState().adventurerParties.filter(
    party => party.currentFloor === room.floorNumber && party.currentRoom === room.position
  );

  return (
    <div
      className={`room-container relative p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[120px] min-w-[100px] ${
        isActive ? 'ring-2 ring-blue-400' : ''
      }`}
      style={{ 
        backgroundColor: getRoomColor(),
        borderColor: isActive ? '#3B82F6' : '#D1D5DB',
        opacity: room.explored ? 1 : 0.8
      }}
      onClick={onClick}
    >
      <div className="room-header text-center mb-2">
        <div className="text-2xl">{getRoomIcon()}</div>
        <div className="text-xs font-bold text-white">
          {getRoomNumber()}
        </div>
      </div>

      {/* Monsters */}
      {room.monsters.length > 0 && (
        <div className="monsters-container flex flex-wrap gap-1 justify-center mb-2">          {room.monsters.slice(0, 3).map((monster) => {
            const monsterType = monsterTypes[monster.type] || { 
              color: "#gray", 
              name: "Unknown",
              hp: 20,
              attack: 5,
              defense: 2
            };
            const scaledStats = getScaledMonsterStats(
              { hp: monsterType.hp || 20, attack: monsterType.attack || 5, defense: monsterType.defense || 2 },
              monster.floorNumber,
              monster.isBoss
            );
              const getMonsterEmoji = () => {
              if (!monster.alive) {
                return '💀'; // Skull for dead monsters
              }
              // Use different emojis based on monster type
              const emojiMap: Record<string, string> = {
                'Goblin': '👹',
                'Orc': '🧌',
                'Skeleton': '💀',
                'Dragon': '🐉',
                'Troll': '🧌',
                'Demon': '😈',
                'Golem': '🗿',
                'Vampire': '🧛',
                'Werewolf': '🐺',
                'Lich': '☠️'
              };
              return emojiMap[monsterType.name] || '🐲'; // Fallback to dragon
            };
            
            const getMonsterStyle = () => {
              if (!monster.alive) {
                return { 
                  color: '#666666', // Gray color for dead monsters
                  filter: 'grayscale(100%)'
                };
              }
              return { color: monsterType.color };
            };
            
            return (
              <div
                key={monster.id}
                className={`monster-icon relative text-lg transition-all duration-300 ${
                  monster.alive 
                    ? 'hover:scale-110' 
                    : 'opacity-75 cursor-help'
                }`}
                title={`${monsterType.name} ${monster.isBoss ? '(Boss)' : ''} - ${
                  monster.alive 
                    ? `HP: ${monster.hp}/${scaledStats.hp}` 
                    : 'DEAD - Will respawn when all adventurers leave'
                }`}
                style={getMonsterStyle()}
              >
                {getMonsterEmoji()}
                {monster.isBoss && (
                  <div className={`absolute -top-1 -right-1 text-xs ${monster.alive ? '' : 'opacity-50'}`}>
                    👑
                  </div>
                )}
                {!monster.alive && (
                  <div className="absolute -bottom-1 -right-1 text-xs" title="Dead">
                    ⚰️
                  </div>
                )}
              </div>
            );
          })}          {room.monsters.length > 3 && (
            <div className="text-xs text-white">
              +{room.monsters.length - 3}
              {room.monsters.filter(m => !m.alive).length > 0 && (
                <span className="ml-1 opacity-75" title="Some monsters are dead">💀</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adventurers */}
      {adventurersHere.length > 0 && (
        <div className="adventurers-container flex gap-1 justify-center mb-1">
          {adventurersHere.map((party) => (
            <div key={party.id} className="text-sm" title={`Party ${party.id} (${party.members.filter(m => m.alive).length} alive)`}>
              🧑‍🎤
            </div>
          ))}
        </div>
      )}

      {/* Room upgrade indicator */}
      {room.roomUpgrade && (
        <div className="absolute top-1 right-1 text-xs">⚡</div>
      )}      {/* Loot indicator */}
      {room.loot > 0 && (
        <div className="absolute bottom-1 right-1 text-xs">💰</div>
      )}

      {/* Monster status indicator */}
      {room.monsters.length > 0 && (
        <div className="absolute top-1 left-1 text-xs">
          <div className="flex items-center gap-1 bg-black bg-opacity-50 rounded px-1">
            <span className="text-green-400">{room.monsters.filter(m => m.alive).length}</span>
            {room.monsters.filter(m => !m.alive).length > 0 && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-red-400">{room.monsters.filter(m => !m.alive).length}💀</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const DungeonFloorView: React.FC<DungeonFloorViewProps> = ({ floor, onRoomClick }) => {
  const [gameConstants, setGameConstants] = useState<any>(null);

  useEffect(() => {
    const fetchConstants = async () => {
      setGameConstants(await fetchGameConstantsData());
    };
    fetchConstants();
  }, []);

  if (!gameConstants) {
    return null; // Or a loading indicator
  }
  return (
    <div className="dungeon-floor bg-gray-800 rounded-lg p-4 mb-4">
      <div className="floor-header text-center mb-4">
        <h3 className="text-xl font-bold text-white">
          Floor {floor.number}
          {floor.isDeepest && <span className="text-purple-400 ml-2">(Deepest)</span>}
        </h3>
      </div>

      <div className="rooms-container flex items-center justify-center gap-2 overflow-x-auto">
        {floor.rooms
          .sort((a, b) => a.position - b.position)
          .map((room, index) => (
            <React.Fragment key={room.id}>
              <RoomComponent
                room={room}
                floor={floor}
                onClick={() => onRoomClick(floor.number, room.position)}
                isActive={false}
              />
              {index < floor.rooms.length - 1 && (
                <div className="connector text-white text-2xl">→</div>
              )}
            </React.Fragment>
          ))}
      </div>      <div className="floor-stats text-center mt-2 text-sm text-gray-400">
        <div>
          Rooms: {floor.rooms.length}/{gameConstants.MAX_ROOMS_PER_FLOOR + 1}
          {floor.isDeepest && <span className="ml-4">🔮 Core Room Active</span>}
        </div>
        <div className="mt-1">
          Monsters: {floor.rooms.reduce((total, room) => total + room.monsters.filter(m => m.alive).length, 0)} alive, {' '}
          {floor.rooms.reduce((total, room) => total + room.monsters.filter(m => !m.alive).length, 0)} dead
        </div>
      </div>
    </div>
  );
};

interface DungeonViewProps {
  // No props needed - component handles everything internally
}

export const DungeonView: React.FC<DungeonViewProps> = () => {
  const [floors, setFloors] = useState<DungeonFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get monster placement functions from store
  const { selectedMonster, selectMonster, placeMonster } = useBackendGameStore();

  // Handle room clicks internally
  const handleRoomClick = async (floorNumber: number, roomPosition: number): Promise<void> => {
    if (selectedMonster !== null) {
      try {
        // Calculate room ID based on floor and position
        // This is a simple calculation - rooms are numbered sequentially
        const roomId = (floorNumber - 1) * 10 + roomPosition;
        
        console.log(`Attempting to place ${selectedMonster} in room ${roomId} (floor ${floorNumber}, position ${roomPosition})`);
        
        const success = await placeMonster(roomId, selectedMonster);
        if (success) {
          console.log('Monster placed successfully!');
          selectMonster(null); // Clear selection after successful placement
          // Immediately refresh to show the new monster
          loadFloors();
        } else {
          console.error('Failed to place monster');
        }
      } catch (error) {
        console.error('Error placing monster:', error);
      }
    } else {
      console.log(`Clicked room at floor ${floorNumber}, position ${roomPosition} - no monster selected`);
    }
  };

  // Function to load floors data
  const loadFloors = async () => {
    try {
      const dungeonData = await getDungeonState();
      if (dungeonData && dungeonData.floors) {
        // Transform API data to match frontend types
        const transformedFloors: DungeonFloor[] = dungeonData.floors.map(floor => ({
          ...floor,
          rooms: floor.rooms.map(room => ({
            ...room,
            monsters: room.monsters.map(monster => ({
              ...monster,
              isBoss: false, // Default for now - backend should provide this
              floorNumber: room.floorNumber,
              scaledStats: {
                hp: monster.maxHp, // Use maxHp as scaled HP
                attack: 5, // Default values - could be calculated
                defense: 2
              }
            }))
          }))
        }));
        
        setFloors(transformedFloors);
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error('Failed to load floors:', err);
      setError('Failed to load dungeon data');
    }
  };

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadFloors();
      setLoading(false);
    };
    initialLoad();
  }, []);

  // Set up intelligent refresh - more frequent when monsters might be placed
  useEffect(() => {
    const interval = setInterval(() => {
      loadFloors(); // Refresh without loading state
    }, 3000); // Check every 3 seconds for updates

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dungeon-container bg-gray-900 rounded-lg p-4">
        <div className="text-center text-white">Loading dungeon...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dungeon-container bg-gray-900 rounded-lg p-4">
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }
  return (
    <div className="dungeon-container bg-gray-900 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
      <div className="dungeon-header text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Dungeon Layout</h2>
        <p className="text-gray-400">Total Floors: {floors.length}</p>
      </div>

      <div className="floors-container space-y-4">
        {floors
          .sort((a, b) => a.number - b.number)
          .map((floor) => (
            <DungeonFloorView
              key={floor.id}
              floor={floor}
              onRoomClick={handleRoomClick}
            />
          ))}
      </div>

      {floors.length === 0 && (
        <div className="empty-dungeon text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">🏰</div>
          <p>Your dungeon is empty. Add your first room to get started!</p>
        </div>
      )}
    </div>
  );
};
