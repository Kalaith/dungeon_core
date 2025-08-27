<?php

namespace DungeonCore\Domain\Repositories;

use DungeonCore\Domain\Entities\Monster;

interface DungeonRepositoryInterface
{
    public function addRoom(int $gameId, int $floorNumber, string $roomType, int $position): int;
    public function getRooms(int $gameId): array;
    public function getRoom(int $floorNumber, int $roomPosition): ?array;
    public function placeMonster(int $roomId, string $monsterType, int $hp, int $maxHp, bool $isBoss): Monster;
    public function getMonsters(int $gameId): array;
    public function getRoomMonsters(int $floorNumber, int $roomPosition): array;
    public function respawnMonsters(int $gameId): void;
    public function getRoomCapacity(int $roomId): int;
    public function getMonsterCount(int $roomId): int;
    public function getFloorsByGameId(int $gameId): array;
    public function getRoomsByFloorId(int $floorId): array;
    public function getMonstersByGameId(int $gameId): array;
}