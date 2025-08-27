<?php

namespace DungeonCore\Infrastructure\Database\MySQL;

use DungeonCore\Domain\Repositories\DataRepositoryInterface;
use PDO;

class MySQLDataRepository implements DataRepositoryInterface
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getGameConstants(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT name, value_int, value_float, value_string, description
            FROM game_constants
            ORDER BY name
        ");
        $stmt->execute();
        
        $constants = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $value = $row['value_int'] ?? $row['value_float'] ?? $row['value_string'];
            $constants[$row['name']] = $value;
        }
        
        return $constants;
    }

    public function getMonsterTypes(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT mt.id, mt.name, mt.species, mt.tier, mt.base_cost, mt.hp, mt.attack, mt.defense, mt.color, mt.description
            FROM monster_types mt
            ORDER BY mt.species, mt.tier
        ");
        $stmt->execute();
        
        $monsterTypes = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Get traits for this monster
            $traitStmt = $this->pdo->prepare("
                SELECT mtr.name
                FROM monster_type_traits mtt
                JOIN monster_traits mtr ON mtt.trait_id = mtr.id
                WHERE mtt.monster_type_id = ?
            ");
            $traitStmt->execute([$row['id']]);
            $traits = $traitStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $monsterTypes[$row['name']] = [
                'name' => $row['name'],
                'baseCost' => $row['base_cost'],
                'hp' => $row['hp'],
                'attack' => $row['attack'],
                'defense' => $row['defense'],
                'color' => $row['color'],
                'description' => $row['description'],
                'species' => $row['species'],
                'tier' => $row['tier'],
                'traits' => $traits
            ];
        }
        
        return $monsterTypes;
    }

    public function getMonsterTraits(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT name, description, trait_type, applies_to, mana_cost, cooldown_turns, upgrade_potential, properties
            FROM monster_traits
            ORDER BY name
        ");
        $stmt->execute();
        
        $traits = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $properties = json_decode($row['properties'], true) ?? [];
            
            $traitData = [
                'description' => $row['description'],
                'trait_type' => $row['trait_type'],
                'applies_to' => $row['applies_to'],
                'upgrade_potential' => (bool)$row['upgrade_potential']
            ];
            
            if ($row['mana_cost'] > 0) {
                $traitData['mana_cost'] = $row['mana_cost'];
            }
            
            if ($row['cooldown_turns'] > 0) {
                $traitData['cooldown_turns'] = $row['cooldown_turns'];
            }
            
            // Merge properties
            $traitData = array_merge($traitData, $properties);
            
            $traits[$row['name']] = $traitData;
        }
        
        return $traits;
    }

    public function getFloorScaling(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT floor_range_start, floor_range_end, mana_cost_multiplier, monster_boost_percentage, 
                   adventurer_level_min, adventurer_level_max, is_deep_floor
            FROM floor_scaling
            ORDER BY floor_range_start
        ");
        $stmt->execute();
        
        $scaling = [
            'regular' => [],
            'deep' => []
        ];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['is_deep_floor']) {
                $scaling['deep'] = [
                    'manaCostMultiplierIncrease' => (float)$row['mana_cost_multiplier'],
                    'monsterBoostPercentageIncrease' => $row['monster_boost_percentage'],
                    'adventurerLevelIncrease' => $row['adventurer_level_max'] - $row['adventurer_level_min']
                ];
            } else {
                $scaling['regular'][] = [
                    'manaCostMultiplier' => (float)$row['mana_cost_multiplier'],
                    'monsterBoostPercentage' => $row['monster_boost_percentage'],
                    'adventurerLevelRange' => [$row['adventurer_level_min'], $row['adventurer_level_max']]
                ];
            }
        }
        
        return $scaling;
    }
}
