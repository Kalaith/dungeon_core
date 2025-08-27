<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;

class GetDungeonStateUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {}

    public function execute(string $sessionId): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        
        if (!$game) {
            return [
                'floors' => [],
                'monsters' => []
            ];
        }

        // Get all floors for this game
        $floors = $this->dungeonRepo->getFloorsByGameId($game->getId());
        
        // Get all monsters for this game
        $monsters = $this->dungeonRepo->getMonstersByGameId($game->getId());

        // Structure the data
        $floorsData = [];
        foreach ($floors as $floor) {
            $rooms = $this->dungeonRepo->getRoomsByFloorId($floor->getId());
            
            $roomsData = [];
            foreach ($rooms as $room) {
                $roomMonsters = array_filter($monsters, function($monster) use ($room) {
                    return $monster->getRoomId() === $room->getId();
                });
                
                $roomsData[] = [
                    'id' => $room->getId(),
                    'type' => $room->getType(),
                    'position' => $room->getPosition(),
                    'floorNumber' => $floor->getNumber(),
                    'explored' => true, // Default for now
                    'loot' => 0, // Default for now  
                    'roomUpgrade' => null, // Default for now
                    'monsters' => array_map(function($monster) {
                        return [
                            'id' => $monster->getId(),
                            'type' => $monster->getType(),
                            'hp' => $monster->getHp(),
                            'maxHp' => $monster->getMaxHp(),
                            'alive' => $monster->isAlive()
                        ];
                    }, array_values($roomMonsters))
                ];
            }
            
            $floorsData[] = [
                'id' => $floor->getId(),
                'number' => $floor->getNumber(),
                'isDeepest' => false, // Default for now - would need logic to determine
                'rooms' => $roomsData
            ];
        }

        return [
            'floors' => $floorsData,
            'monsters' => array_map(function($monster) {
                return [
                    'id' => $monster->getId(),
                    'type' => $monster->getType(),
                    'hp' => $monster->getHp(),
                    'maxHp' => $monster->getMaxHp(),
                    'roomId' => $monster->getRoomId(),
                    'alive' => $monster->isAlive()
                ];
            }, $monsters)
        ];
    }
}
