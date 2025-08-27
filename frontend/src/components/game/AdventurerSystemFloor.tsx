import React, { useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { fetchGameConstantsData } from "../../api/gameApi";
import type { AdventurerParty, Adventurer } from "../../types/game";

interface AdventurerSystemProps {
  running: boolean;
}

export const AdventurerSystem: React.FC<AdventurerSystemProps> = ({ running }) => {
  const { 
    status, 
    hour, 
    adventurerParties, 
    nextPartySpawn,
    floors,
    addAdventurerParty,
    updateAdventurerParty,
    removeAdventurerParty,
    addLog,
    gainGold,
    gainSouls,
    mana
  } = useGameStore();
  
  const systemIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate adventurer party
  const generateAdventurerParty = async (): Promise<AdventurerParty> => {
    const gameConstants = await fetchGameConstantsData();
    if (!gameConstants) {
      throw new Error('Failed to load game constants');
    }
    const partySize = Math.floor(Math.random() * (gameConstants.MAX_PARTY_SIZE - gameConstants.MIN_PARTY_SIZE + 1)) + gameConstants.MIN_PARTY_SIZE;
    
    const adventurerClasses = [
      { name: "Warrior", hp: 100, attack: 25, defense: 15, color: "#d4af37" },
      { name: "Rogue", hp: 80, attack: 30, defense: 10, color: "#6b5b95" },
      { name: "Mage", hp: 60, attack: 35, defense: 5, color: "#2e86ab" },
      { name: "Cleric", hp: 90, attack: 20, defense: 20, color: "#f18f01" }
    ];

    const names = [
      "Aiden", "Bella", "Cora", "Derek", "Elena", "Finn", "Grace", "Hugo", "Iris", "Jack",
      "Kira", "Leo", "Maya", "Nolan", "Olive", "Penn", "Quinn", "Ruby", "Sam", "Tara"
    ];

    const members: Adventurer[] = [];
    for (let i = 0; i < partySize; i++) {
      const classData = adventurerClasses[Math.floor(Math.random() * adventurerClasses.length)];
      const level = Math.floor(Math.random() * 3) + 1; // Level 1-3 starting adventurers
      
      const adventurer: Adventurer = {
        id: Date.now() + Math.random(),
        classIdx: adventurerClasses.indexOf(classData),
        name: names[Math.floor(Math.random() * names.length)],
        level,
        hp: classData.hp + (level - 1) * 10,
        maxHp: classData.hp + (level - 1) * 10,
        alive: true,
        experience: 0,
        gold: 0,
        equipment: {
          weapon: "Basic Sword",
          armor: "Leather Armor", 
          accessory: "None"
        },
        conditions: [],
        scaledStats: {
          hp: classData.hp + (level - 1) * 10,
          attack: classData.attack + (level - 1) * 2,
          defense: classData.defense + (level - 1) * 1
        }
      };
      members.push(adventurer);
    }

    const party: AdventurerParty = {
      id: Date.now() + Math.random(),
      members,
      currentFloor: 1,
      currentRoom: 0, // Start at entrance
      retreating: false,
      casualties: 0,
      loot: 0,
      entryTime: hour,
      targetFloor: Math.min(floors.length, Math.floor(Math.random() * 2) + 1) // Target 1-2 floors or max available
    };

    return party;
  };

  // Simulate adventurer progression through dungeon
  const processAdventurerParties = async () => {
    if (!running || adventurerParties.length === 0) return;

    const gameConstants = await fetchGameConstantsData();
    if (!gameConstants) {
      console.error('Failed to load game constants');
      return;
    }
    
    for (const party of adventurerParties) {
      if (party.retreating) {
        // Handle retreating party - remove them
        removeAdventurerParty(party.id);
        addLog({ 
          message: `Party ${party.id} has retreated with ${party.loot} gold and ${party.casualties} casualties.`,
          type: "adventure",
          timestamp: Date.now()
        });
        continue;
      }

      const currentFloor = floors.find(f => f.number === party.currentFloor);
      if (!currentFloor) continue;

      const currentRoom = currentFloor.rooms.find(r => r.position === party.currentRoom);
      if (!currentRoom) continue;

      // Process combat in current room
      if (currentRoom.monsters.length > 0 && currentRoom.monsters.some(m => m.alive)) {
        // Simple combat simulation
        const combatResult = Math.random();
        
        if (combatResult < 0.3) {
          // Adventurer death
          const aliveAdventurers = party.members.filter(a => a.alive);
          if (aliveAdventurers.length > 0) {
            const victim = aliveAdventurers[Math.floor(Math.random() * aliveAdventurers.length)];
            victim.alive = false;
            
            const casualties = party.casualties + 1;
            updateAdventurerParty(party.id, { casualties });
            
            // Award mana for adventurer death
            const manaGain = victim.level * 10;
            useGameStore.setState({ mana: Math.min(mana + manaGain, useGameStore.getState().maxMana) });
            
            addLog({ 
              message: `${victim.name} has fallen in Floor ${party.currentFloor}, Room ${party.currentRoom}! +${manaGain} mana`,
              type: "combat",
              timestamp: Date.now()
            });
            
            // Check retreat condition
            if (casualties >= gameConstants.RETREAT_THRESHOLD) {
              updateAdventurerParty(party.id, { retreating: true });
              addLog({ 
                message: `Party ${party.id} is retreating due to heavy casualties!`,
                type: "adventure",
                timestamp: Date.now()
              });
            }
          }
        } else if (combatResult < 0.6) {
          // Monster death
          const aliveMonsters = currentRoom.monsters.filter(m => m.alive);
          if (aliveMonsters.length > 0) {
            const victim = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];
            victim.alive = false;
            
            // Award gold and experience
            const goldReward = victim.isBoss ? 50 : 20;
            const soulReward = victim.isBoss ? 1 : 0;
            
            party.loot += goldReward;
            if (soulReward > 0) {
              gainSouls(soulReward);
            }
            
            addLog({ 
              message: `${victim.type} defeated in Floor ${party.currentFloor}, Room ${party.currentRoom}! +${goldReward} gold${soulReward > 0 ? `, +${soulReward} soul` : ''}`,
              type: "combat",
              timestamp: Date.now()
            });
            
            if (Math.random() < 0.2) { // 20% chance to speak after combat
              const victoryQuotes = [
                "That was a hard fight!",
                "Got it!",
                "Nice teamwork!",
                "One down!",
                "Victory is ours!"
              ];
              const randomQuote = victoryQuotes[Math.floor(Math.random() * victoryQuotes.length)];
              addLog({ 
                message: `${party.members.find(m => m.alive)?.name || 'Adventurer'} says: "${randomQuote}"`,
                type: "adventure",
                timestamp: Date.now()
              });
            }
          }
        }
        // Else: Stalemate, continue combat next tick
      } else {
        // Room cleared, advance to next room
        const nextRoomPosition = party.currentRoom + 1;
        const roomsInFloor = currentFloor.rooms.length;
        
        if (nextRoomPosition >= roomsInFloor) {
          // Floor completed, check if going deeper
          if (party.currentFloor < party.targetFloor && party.currentFloor < floors.length) {
            updateAdventurerParty(party.id, { 
              currentFloor: party.currentFloor + 1, 
              currentRoom: 0 
            });
            addLog({ 
              message: `Party ${party.id} descends to Floor ${party.currentFloor + 1}`,
              type: "adventure",
              timestamp: Date.now()
            });
          } else {
            // Party completed their target, retreat with loot
            updateAdventurerParty(party.id, { retreating: true });
            gainGold(party.loot);
            
            addLog({ 
              message: `Party ${party.id} completed their exploration! +${party.loot} gold`,
              type: "adventure",
              timestamp: Date.now()
            });
            
            if (Math.random() < 0.4) { // 40% chance to speak when leaving
              const leaveQuotes = [
                "I can't wait to come visit this dungeon again!",
                "That was quite the adventure!",
                "We did well today!",
                "Time to head back to town.",
                "Great haul everyone!"
              ];
              const randomQuote = leaveQuotes[Math.floor(Math.random() * leaveQuotes.length)];
              addLog({ 
                message: `${party.members.find(m => m.alive)?.name || 'Adventurer'} says: "${randomQuote}"`,
                type: "adventure",
                timestamp: Date.now()
              });
            }
          }
        } else {
          // Advance to next room on same floor
          updateAdventurerParty(party.id, { currentRoom: nextRoomPosition });
          addLog({ 
            message: `Party ${party.id} advances to Room ${nextRoomPosition} on Floor ${party.currentFloor}`,
            type: "adventure",
            timestamp: Date.now()
          });
        }
      }
    }
  };

  // Spawn new adventurer parties
  const spawnAdventurerParty = async () => {
    if (status !== 'Open' || adventurerParties.length > 0) return;
    if (hour < nextPartySpawn) return;

    const spawnChance = Math.random();
    
    if (spawnChance < 0.3) { // Increased from gameConstants.ADVENTURER_SPAWN_CHANCE (0.05)
      const newParty = await generateAdventurerParty();
      addAdventurerParty(newParty);
      
      // Set next spawn time (30 minutes to 1 hour later)
      const nextSpawn = hour + 1;
      useGameStore.setState({ nextPartySpawn: nextSpawn });
      
      addLog({ 
        message: `New adventurer party enters the dungeon! (${newParty.members.length} members)`,
        type: "adventure",
        timestamp: Date.now()
      });
      
      if (Math.random() < 0.3) { // 30% chance to speak
        const enterQuotes = [
          "Time to do this again!",
          "Let's see what treasures await!",
          "This dungeon looks promising.",
          "Stay close everyone!",
          "Ready for adventure!"
        ];
        const randomQuote = enterQuotes[Math.floor(Math.random() * enterQuotes.length)];
        addLog({ 
          message: `${newParty.members[0].name} says: "${randomQuote}"`,
          type: "adventure",
          timestamp: Date.now()
        });
      }
    }
  };

  // Main system loop
  useEffect(() => {
    if (!running) return;

    const setupInterval = async () => {
      try {
        if (systemIntervalRef.current) {
          clearInterval(systemIntervalRef.current);
        }
        
        const gameConstants = await fetchGameConstantsData();
        if (!gameConstants) {
          console.error('Failed to load game constants');
          return;
        }
        systemIntervalRef.current = setInterval(async () => {
          try {
            await spawnAdventurerParty();
            await processAdventurerParties();
          } catch (error) {
            console.error('Error in adventurer system:', error);
          }
        }, gameConstants.TIME_ADVANCE_INTERVAL);
      } catch (error) {
        console.error('Error setting up adventurer system:', error);
      }
    };

    setupInterval();

    return () => {
      if (systemIntervalRef.current) {
        clearInterval(systemIntervalRef.current);
      }
    };
  }, [running, status, hour, adventurerParties.length]);


  return null; // This is a system component, no visual rendering
};
