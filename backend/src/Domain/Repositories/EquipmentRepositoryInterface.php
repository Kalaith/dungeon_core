<?php

namespace DungeonCore\Domain\Repositories;

interface EquipmentRepositoryInterface
{
    public function getAllEquipment(): array;
    public function getEquipmentByType(string $type): array;
    public function getEquipmentById(int $id): ?array;
    public function getPlayerEquipment(int $playerId): array;
    public function addEquipmentToPlayer(int $playerId, int $equipmentTypeId, int $quantity = 1): bool;
    public function equipItem(int $playerId, int $equipmentTypeId): bool;
    public function unequipItem(int $playerId, int $equipmentTypeId): bool;
}
