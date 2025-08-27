<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;

class InitializeGameUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {}

    public function execute(string $sessionId): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        
        if (!$game) {
            // Create new game with initial state
            error_log('Creating new game for session: ' . $sessionId);
            $game = $this->gameRepo->create($sessionId);
            
            // Create initial dungeon structure
            $entranceRoomId = $this->dungeonRepo->addRoom($game->getId(), 1, 'entrance', 0);
            $coreRoomId = $this->dungeonRepo->addRoom($game->getId(), 1, 'core', 99);
            error_log('Created entrance room: ' . $entranceRoomId . ' and core room: ' . $coreRoomId);
        } else {
            error_log('Found existing game for session: ' . $sessionId . ', game ID: ' . $game->getId());
        }

        // Get all rooms for the game (whether new or existing)
        $rooms = $this->dungeonRepo->getRooms($game->getId());
        
        // If existing game has no rooms, create the initial ones
        if (empty($rooms)) {
            error_log('Existing game has no rooms, creating initial rooms');
            $entranceRoomId = $this->dungeonRepo->addRoom($game->getId(), 1, 'entrance', 0);
            $coreRoomId = $this->dungeonRepo->addRoom($game->getId(), 1, 'core', 99);
            error_log('Created entrance room: ' . $entranceRoomId . ' and core room: ' . $coreRoomId);
            
            // Re-fetch rooms after creation
            $rooms = $this->dungeonRepo->getRooms($game->getId());
        }
        
        // Debug: Log the rooms found
        error_log('Rooms found for game ' . $game->getId() . ': ' . count($rooms));
        foreach ($rooms as $room) {
            error_log('Room: ' . $room['id'] . ', type: ' . $room['type'] . ', position: ' . $room['position']);
        }
        
        // Convert rooms to the expected format
        $roomsData = [];
        foreach ($rooms as $room) {
            error_log('Processing room: ' . json_encode($room));
            $roomsData[] = [
                'id' => $room['id'],
                'type' => $room['type'],
                'position' => $room['position'],
                'floorNumber' => $room['floor_number'] ?? 1,
                'monsters' => [],
                'roomUpgrade' => null,
                'explored' => $room['explored'] ?? false,
                'loot' => $room['loot'] ?? 0
            ];
        }
        
        error_log('Final roomsData: ' . json_encode($roomsData));
        
        $result = [
            'game' => [
                'id' => $game->getId(),
                'mana' => $game->getMana(),
                'maxMana' => $game->getMaxMana(),
                'manaRegen' => $game->getManaRegen(),
                'gold' => $game->getGold(),
                'souls' => $game->getSouls(),
                'day' => $game->getDay(),
                'hour' => $game->getHour(),
                'status' => $game->getStatus(),
                'speed' => 1,
                'selectedRoom' => null,
                'selectedMonster' => null,
                'modalOpen' => true,
                'dungeonLevel' => 1,
                'adventurerParties' => [],
                'nextPartySpawn' => 8, // First party spawns at 8 AM
                'totalFloors' => 1,
                'deepCoreBonus' => 0,
                'unlockedMonsterSpecies' => $game->getUnlockedSpecies(),
                'speciesExperience' => $game->getSpeciesExperience(),
                'log' => [
                    [
                        'message' => 'Welcome to Dungeon Core Simulator v1.2!',
                        'type' => 'system',
                        'timestamp' => time() * 1000
                    ],
                    [
                        'message' => 'Your dungeon starts with an entrance and core room. Add more rooms to expand!',
                        'type' => 'system', 
                        'timestamp' => time() * 1000
                    ]
                ]
            ],
            'floors' => [
                [
                    'id' => time(),
                    'number' => 1,
                    'rooms' => $roomsData,
                    'isDeepest' => true
                ]
            ],
            'monsters' => $this->dungeonRepo->getMonsters($game->getId())
        ];
        
        error_log('Final result: ' . json_encode($result));
        return $result;
    }
}