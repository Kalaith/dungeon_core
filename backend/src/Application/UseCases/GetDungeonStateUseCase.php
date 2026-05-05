<?php

declare(strict_types=1);

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;

class GetDungeonStateUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {
    }

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
        $adventurerParties = $this->getAdventurerParties($game->getId());

        // Structure the data
        $floorsData = [];
        $deepestFloorNumber = null;
        foreach ($floors as $floor) {
            $deepestFloorNumber = max($deepestFloorNumber ?? $floor->getNumber(), $floor->getNumber());
        }

        foreach ($floors as $floor) {
            $rooms = $this->dungeonRepo->getRoomsByFloorId($floor->getId());

            $roomsData = [];
            foreach ($rooms as $room) {
                $roomMonsters = array_filter($monsters, function ($monster) use ($room) {
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
                    'monsters' => array_map(function ($monster) {
                        return [
                            'id' => $monster->getId(),
                            'type' => $monster->getType(),
                            'hp' => $monster->getHp(),
                            'maxHp' => $monster->getMaxHp(),
                            'alive' => $monster->isAlive(),
                            'isBoss' => $monster->isBoss()
                        ];
                    }, array_values($roomMonsters))
                ];
            }

            $floorsData[] = [
                'id' => $floor->getId(),
                'number' => $floor->getNumber(),
                'isDeepest' => $deepestFloorNumber !== null && $floor->getNumber() === $deepestFloorNumber,
                'rooms' => $roomsData
            ];
        }

        return [
            'floors' => $floorsData,
            'adventurerParties' => $adventurerParties,
            'monsters' => array_map(function ($monster) {
                return [
                    'id' => $monster->getId(),
                    'type' => $monster->getType(),
                    'hp' => $monster->getHp(),
                    'maxHp' => $monster->getMaxHp(),
                    'roomId' => $monster->getRoomId(),
                    'alive' => $monster->isAlive(),
                    'isBoss' => $monster->isBoss()
                ];
            }, $monsters)
        ];
    }

    private function getAdventurerParties(int $gameId): array
    {
        $connection = $this->dungeonRepo->getConnection();
        $stmt = $connection->prepare(
            'SELECT * FROM adventurer_parties WHERE player_id = ? AND retreating = 0 ORDER BY id'
        );
        $stmt->execute([$gameId]);

        $parties = [];
        while ($party = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $membersStmt = $connection->prepare(
                'SELECT * FROM adventurers WHERE party_id = ? ORDER BY id'
            );
            $membersStmt->execute([(int) $party['id']]);
            $members = [];

            while ($member = $membersStmt->fetch(\PDO::FETCH_ASSOC)) {
                $className = (string) $member['class_name'];
                $members[] = [
                    'id' => (int) $member['id'],
                    'classIdx' => $this->classIndex($className),
                    'name' => (string) $member['name'],
                    'level' => (int) $member['level'],
                    'hp' => (int) $member['hp'],
                    'maxHp' => (int) $member['max_hp'],
                    'alive' => (bool) $member['alive'],
                    'experience' => 0,
                    'gold' => 0,
                    'equipment' => [
                        'weapon' => 'Basic Sword',
                        'armor' => 'Leather Armor',
                        'accessory' => 'None'
                    ],
                    'conditions' => [],
                    'scaledStats' => [
                        'hp' => (int) $member['max_hp'],
                        'attack' => 10 + ((int) $member['level'] * 2),
                        'defense' => 5 + (int) $member['level']
                    ]
                ];
            }

            $parties[] = [
                'id' => (int) $party['id'],
                'members' => $members,
                'currentFloor' => (int) $party['current_floor'],
                'currentRoom' => (int) $party['current_room'],
                'retreating' => (bool) $party['retreating'],
                'casualties' => (int) $party['casualties'],
                'loot' => (int) $party['loot'],
                'entryTime' => (int) $party['entry_time'],
                'targetFloor' => (int) $party['target_floor'],
                'boredom' => (int) ($party['boredom'] ?? 0),
                'roomTicks' => (int) ($party['room_ticks'] ?? 0)
            ];
        }

        return $parties;
    }

    private function classIndex(string $className): int
    {
        return match ($className) {
            'Warrior' => 0,
            'Rogue' => 1,
            'Mage' => 2,
            'Cleric' => 3,
            default => 0
        };
    }
}
