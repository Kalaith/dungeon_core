import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, DungeonFloor, Room, LogEntry, AdventurerParty, MonsterType } from '../types/game';
import { fetchGameConstantsData, initializeGame } from '../api/gameApi';

// Import refactored modules
import { addRoom } from './roomActions';
import { spendMana, spendGold, gainGold, gainSouls } from './manaGoldSoulsActions';
import { placeMonster, unlockMonsterSpecies, gainMonsterExperience, getAvailableMonsters } from './monsterActions';

// Create a minimal initial state that will be replaced by backend data
const createEmptyInitialState = (): Omit<GameState, 'floors'> => ({
  mana: 0,
  maxMana: 0,
  manaRegen: 0,
  gold: 0,
  souls: 0,
  day: 1,
  hour: 6,
  status: 'Open',
  speed: 1,
  selectedRoom: null,
  selectedMonster: null,
  log: [],
  modalOpen: false,
  dungeonLevel: 1,
  adventurerParties: [],
  nextPartySpawn: 8,
  totalFloors: 1,
  deepCoreBonus: 0,
  unlockedMonsterSpecies: [],
  monsterExperience: {},
});

interface GameStore extends GameState {
  floors: DungeonFloor[];
  isInitialized: boolean;
  initializeFromBackend: () => Promise<void>;
  setFloors: (floors: DungeonFloor[]) => void;
  addRoom: (floorNumber?: number) => Promise<boolean>;
  selectRoom: (roomIndex: number | null) => void;
  selectMonster: (monsterName: string | null) => void; // Changed to monsterName
  
  spendMana: (amount: number) => boolean;
  spendGold: (amount: number) => boolean;
  gainGold: (amount: number) => void;
  gainSouls: (amount: number) => void;
  placeMonster: (floorNumber: number, roomPosition: number, monsterName: string) => Promise<boolean>; // Changed to monsterName
  advanceTime: () => void;
  setStatus: (status: 'Open' | 'Closing' | 'Closed' | 'Maintenance') => void;
  setSpeed: (speed: number) => void;
  closeModal: () => void;
  addLog: (entry: LogEntry | string) => void;
  addAdventurerParty: (party: AdventurerParty) => void;
  updateAdventurerParty: (partyId: number, updates: Partial<AdventurerParty>) => void;
  removeAdventurerParty: (partyId: number) => void;
  respawnMonsters: () => void;
  createNewFloor: () => DungeonFloor;
  updateDeepCoreBonus: () => void;
  resetGame: () => void;
  ensureCoreRoom: () => void;
  // New monster progression actions
  unlockMonsterSpecies: (speciesName: string) => void;
  gainMonsterExperience: (monsterName: string, exp: number) => void;
  getAvailableMonsters: () => Promise<MonsterType[]>;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      console.log("gameStore: Initializing state");
      return {
        ...createEmptyInitialState(),
        floors: [],
        isInitialized: false,

        initializeFromBackend: async () => {
          try {
            const backendData = await initializeGame();
            
            // Convert backend data to frontend format
            const gameState = backendData.game;
            const floors = backendData.floors || [];
            
            set({
              ...gameState,
              floors: floors as DungeonFloor[],
              isInitialized: true,
              status: gameState.status as 'Open' | 'Closing' | 'Closed' | 'Maintenance',
              log: gameState.log.map(entry => ({
                ...entry,
                type: entry.type as 'system' | 'combat' | 'adventure' | 'building'
              })),
              monsterExperience: (gameState as any).monsterExperience && !Array.isArray((gameState as any).monsterExperience) ? (gameState as any).monsterExperience : {}
            });
            
            console.log("Game initialized from backend:", backendData);
          } catch (error) {
            console.error("Failed to initialize game from backend:", error);
            // Fallback to empty state if backend fails
            set({
              ...createEmptyInitialState(),
              floors: [],
              isInitialized: false,
              modalOpen: false
            });
          }
        },

        setFloors: (floors) => set({ floors }),

        createNewFloor: () => {
          const state = get();
          const newFloorNumber = state.totalFloors + 1;
          
          const entranceRoom: Room = {
            id: Date.now(),
            type: 'entrance',
            position: 0,
            floorNumber: newFloorNumber,
            monsters: [],
            roomUpgrade: null,
            explored: false,
            loot: 0
          };

          const newFloor: DungeonFloor = {
            id: Date.now() + 1,
            number: newFloorNumber,
            rooms: [entranceRoom],
            isDeepest: true
          };

          return newFloor;
        },

        addRoom: (...args) => addRoom(set, get, ...args),

        updateDeepCoreBonus: async () => {
          const state = get();
          const gameConstants = await fetchGameConstantsData();
          if (!gameConstants) {
            console.error('Failed to load game constants');
            return;
          }
          const newBonus = state.totalFloors * gameConstants.CORE_ROOM_MANA_BONUS;
          const newManaRegen = 1 + newBonus; // Base 1 + bonus
          
          set({ 
            deepCoreBonus: newBonus,
            manaRegen: newManaRegen
          });
          
          get().addLog(`Deep Core Bonus updated: +${Math.round(newBonus * 100)}% mana regeneration`);
        },

        selectRoom: (roomIndex) => set({ selectedRoom: roomIndex, selectedMonster: null }),

        selectMonster: (monsterName) => set({ selectedMonster: monsterName, selectedRoom: null }),

        

        spendMana: (...args) => spendMana(set, get, ...args),
        spendGold: (...args) => spendGold(set, get, ...args),
        gainGold: (...args) => gainGold(set, get, ...args),
        gainSouls: (...args) => gainSouls(set, get, ...args),

        placeMonster: async (floorNumber, roomPosition, monsterName) => {
          try {
            return await placeMonster(set, get, floorNumber, roomPosition, monsterName, get().addLog);
          } catch (error) {
            console.error('Error placing monster:', error);
            get().addLog('Failed to place monster. Please try again.');
            return false;
          }
        },
        unlockMonsterSpecies: (speciesName) => unlockMonsterSpecies(set, get, speciesName, get().addLog),
        gainMonsterExperience: (monsterName, exp) => gainMonsterExperience(set, get, monsterName, exp, get().addLog),
        getAvailableMonsters: async (...args) => {
          try {
            return await getAvailableMonsters(set, get, ...args);
          } catch (error) {
            console.error('Error getting available monsters:', error);
            return [];
          }
        },

        advanceTime: () => set((state) => {
          let newHour = state.hour + 1;
          let newDay = state.day;
          
          if (newHour >= 24) {
            newHour = 0;
            newDay += 1;
          }        // Determine status based on time (but can be overridden by manual control)
          let status: 'Open' | 'Closing' | 'Closed' | 'Maintenance' = state.status;
          
          // Keep dungeon open 24/7 unless manually closed
          // No automatic status changes based on time

          // Calculate mana regen with adventurer bonus (0.1 per adventurer)
          const totalAdventurers = state.adventurerParties.reduce((sum, party) => 
            sum + party.members.filter(a => a.alive).length, 0);
          const adventurerBonus = totalAdventurers * 0.1;
          const currentRegen = 1 + state.deepCoreBonus + adventurerBonus;
          const newMana = Math.min(state.mana + currentRegen, state.maxMana);
          
          // Log mana increase
          if (newMana > state.mana) {
            console.log(`[${new Date().toLocaleTimeString()}] Mana: ${state.mana} -> ${newMana} (+${currentRegen})`);
          }

          return {
            hour: newHour,
            day: newDay,
            status,
            manaRegen: currentRegen,
            mana: newMana,
          };
        }),

        setStatus: (status) => {
          const state = get();
          
          // Special logic for closing the dungeon
          if (status === 'Closed' && state.adventurerParties.length > 0) {
            // If there are parties in the dungeon, set to Closing instead
            set({ status: 'Closing' });
            get().addLog("Dungeon is closing... waiting for current adventurers to finish.");
          } else {
            set({ status });
            if (status === 'Closed') {
              get().addLog("Dungeon is now closed to new adventurers.");
            } else if (status === 'Open') {
              get().addLog("Dungeon is now open to adventurers!");
            }
          }
        },

        setSpeed: (speed) => set({ speed }),

        closeModal: () => {
          set({ modalOpen: false });
          if (typeof window !== 'undefined') {
            sessionStorage.setItem("dungeoncore_modal_seen", "1");
          }
        },

        addLog: (entry: LogEntry | string) => set((state) => {
          const logEntry: LogEntry = typeof entry === 'string' 
            ? { message: entry, type: 'system', timestamp: Date.now() }
            : { ...entry, timestamp: entry.timestamp || Date.now() };
          
          const newLog = [...state.log, logEntry];
          const gameConstants = { MAX_LOG_ENTRIES: 50 }; // Default value
          
          // Keep only recent entries
          if (newLog.length > gameConstants.MAX_LOG_ENTRIES) {
            newLog.splice(0, newLog.length - gameConstants.MAX_LOG_ENTRIES);
          }
          
          return { log: newLog };
        }),      addAdventurerParty: (party) => set((state) => {
          // Safety check: only allow one party at a time
          if (state.adventurerParties.length > 0) {
            get().addLog(`Cannot add party - ${state.adventurerParties.length} parties already in dungeon`);
            return state;
          }
          
          return {
            adventurerParties: [...state.adventurerParties, party]
          };
        }),

        updateAdventurerParty: (partyId, updates) => set((state) => ({
          adventurerParties: state.adventurerParties.map(party =>
            party.id === partyId ? { ...party, ...updates } : party
          )
        })),

        removeAdventurerParty: (partyId) => set((state) => {
          const updatedParties = state.adventurerParties.filter(party => party.id !== partyId);
          
          // If no more parties, respawn all monsters
          let updatedFloors = state.floors;
          if (updatedParties.length === 0) {
            updatedFloors = state.floors.map(floor => ({
              ...floor,
              rooms: floor.rooms.map(room => ({
                ...room,
                monsters: room.monsters.map(monster => ({
                  ...monster,
                  hp: monster.maxHp,
                  alive: true,
                }))
              }))
            }));
            get().addLog("All monsters have respawned!");
          }
          
          return {
            adventurerParties: updatedParties,
            floors: updatedFloors
          };
        }),

        respawnMonsters: () => set((state) => {
            // Only respawn if no adventurers are in the dungeon
            if (state.adventurerParties.length > 0) return state;

            const updatedFloors = state.floors.map(floor => ({
              ...floor,
              rooms: floor.rooms.map(room => ({
                ...room,
                monsters: room.monsters.map(monster => ({
                  ...monster,
                  hp: monster.maxHp,
                  alive: true,
                }))
              }))
            }));

            get().addLog("Monsters have respawned throughout the dungeon!");
            return { floors: updatedFloors };
          }),      resetGame: () => {
            // Clear localStorage and sessionStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('dungeon-core-game-v2');
              sessionStorage.removeItem('dungeoncore_modal_seen');
            }
            
            // Reset to empty state and re-initialize from backend
            set({
              ...createEmptyInitialState(),
              floors: [],
              isInitialized: false,
              modalOpen: false
            });
            
            // Re-initialize from backend
            get().initializeFromBackend();
            
            get().addLog("Game reset successfully!");
          },

          ensureCoreRoom: () => {
            const state = get();
            const deepestFloor = state.floors.find(f => f.isDeepest);
            
            if (!deepestFloor) return;
            
            // Check if deepest floor has a core room
            const hasCore = deepestFloor.rooms.some(room => room.type === 'core');
            
            if (!hasCore) {
              const coreRoom: Room = {
                id: Date.now(),
                type: 'core',
                position: 6, // Core room position (after 5 main rooms)
                floorNumber: deepestFloor.number,
                monsters: [],
                roomUpgrade: null,
                explored: false,
                loot: 0
              };

              const updatedFloors = state.floors.map(floor => {
                if (floor.id === deepestFloor.id) {
                  return {
                    ...floor,
                    rooms: [...floor.rooms, coreRoom]
                  };
                }
                return floor;
              });

              set({ floors: updatedFloors });
              
              get().addLog(`Core room added to floor ${deepestFloor.number}.`);
            }
          },
        };
      },
      {
        name: 'dungeon-core-game-v2',
        partialize: (state) => ({
          mana: state.mana,
          maxMana: state.maxMana,
          manaRegen: state.manaRegen,
          gold: state.gold,
          souls: state.souls,
          day: state.day,
          hour: state.hour,
          dungeonLevel: state.dungeonLevel,
          floors: state.floors,
          totalFloors: state.totalFloors,
          deepCoreBonus: state.deepCoreBonus,
          unlockedMonsterSpecies: state.unlockedMonsterSpecies,
          monsterExperience: state.monsterExperience,
        }),
      }
    )
  );