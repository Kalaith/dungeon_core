<?php

namespace DungeonCore\Infrastructure\Database\MySQL;

use DungeonCore\Domain\Repositories\EquipmentRepositoryInterface;
use PDO;

class MySQLEquipmentRepository implements EquipmentRepositoryInterface
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAllEquipment(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, type, tier, attack_bonus, defense_bonus, mana_bonus, cost, description
            FROM equipment_types
            ORDER BY type, tier
        ");
        $stmt->execute();
        
        $equipment = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $type = $row['type'];
            if (!isset($equipment[$type])) {
                $equipment[$type] = [];
            }
            $equipment[$type][$row['name']] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'tier' => $row['tier'],
                'attack_bonus' => $row['attack_bonus'],
                'defense_bonus' => $row['defense_bonus'],
                'mana_bonus' => $row['mana_bonus'],
                'cost' => $row['cost'],
                'description' => $row['description']
            ];
        }
        
        return $equipment;
    }

    public function getEquipmentByType(string $type): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, type, tier, attack_bonus, defense_bonus, mana_bonus, cost, description
            FROM equipment_types
            WHERE type = ?
            ORDER BY tier
        ");
        $stmt->execute([$type]);
        
        $equipment = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $equipment[$row['name']] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'tier' => $row['tier'],
                'attack_bonus' => $row['attack_bonus'],
                'defense_bonus' => $row['defense_bonus'],
                'mana_bonus' => $row['mana_bonus'],
                'cost' => $row['cost'],
                'description' => $row['description']
            ];
        }
        
        return $equipment;
    }

    public function getEquipmentById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, type, tier, attack_bonus, defense_bonus, mana_bonus, cost, description
            FROM equipment_types
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'tier' => $row['tier'],
            'attack_bonus' => $row['attack_bonus'],
            'defense_bonus' => $row['defense_bonus'],
            'mana_bonus' => $row['mana_bonus'],
            'cost' => $row['cost'],
            'description' => $row['description']
        ];
    }

    public function getPlayerEquipment(int $playerId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT pe.id, pe.quantity, pe.equipped, et.name, et.type, et.tier, 
                   et.attack_bonus, et.defense_bonus, et.mana_bonus, et.cost, et.description
            FROM player_equipment pe
            JOIN equipment_types et ON pe.equipment_type_id = et.id
            WHERE pe.player_id = ?
            ORDER BY et.type, et.tier
        ");
        $stmt->execute([$playerId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addEquipmentToPlayer(int $playerId, int $equipmentTypeId, int $quantity = 1): bool
    {
        // Check if player already has this equipment
        $stmt = $this->pdo->prepare("
            SELECT id, quantity FROM player_equipment 
            WHERE player_id = ? AND equipment_type_id = ?
        ");
        $stmt->execute([$playerId, $equipmentTypeId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update quantity
            $stmt = $this->pdo->prepare("
                UPDATE player_equipment 
                SET quantity = quantity + ? 
                WHERE player_id = ? AND equipment_type_id = ?
            ");
            return $stmt->execute([$quantity, $playerId, $equipmentTypeId]);
        } else {
            // Insert new equipment
            $stmt = $this->pdo->prepare("
                INSERT INTO player_equipment (player_id, equipment_type_id, quantity)
                VALUES (?, ?, ?)
            ");
            return $stmt->execute([$playerId, $equipmentTypeId, $quantity]);
        }
    }

    public function equipItem(int $playerId, int $equipmentTypeId): bool
    {
        // First, unequip any item of the same type
        $stmt = $this->pdo->prepare("
            UPDATE player_equipment pe
            JOIN equipment_types et ON pe.equipment_type_id = et.id
            SET pe.equipped = FALSE
            WHERE pe.player_id = ? AND et.type = (
                SELECT type FROM equipment_types WHERE id = ?
            )
        ");
        $stmt->execute([$playerId, $equipmentTypeId]);
        
        // Then equip the new item
        $stmt = $this->pdo->prepare("
            UPDATE player_equipment 
            SET equipped = TRUE 
            WHERE player_id = ? AND equipment_type_id = ?
        ");
        return $stmt->execute([$playerId, $equipmentTypeId]);
    }

    public function unequipItem(int $playerId, int $equipmentTypeId): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE player_equipment 
            SET equipped = FALSE 
            WHERE player_id = ? AND equipment_type_id = ?
        ");
        return $stmt->execute([$playerId, $equipmentTypeId]);
    }
}
