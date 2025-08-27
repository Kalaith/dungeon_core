<?php

namespace DungeonCore\Domain\Services;

class GameLogic
{
    public function calculateMonsterCost(string $monsterType, int $floorNumber, bool $isBossRoom = false): int
    {
        $baseCosts = [
            'Goblin' => 10,
            'Orc' => 20,
            'Slime' => 8,
            'False Chest' => 15
        ];
        
        $baseCost = $baseCosts[$monsterType] ?? 10;
        $floorMultiplier = 1 + ($floorNumber - 1) * 0.5; // 50% increase per floor
        $bossMultiplier = $isBossRoom ? 2.0 : 1.0;
        
        return (int) ceil($baseCost * $floorMultiplier * $bossMultiplier);
    }

    public function calculateRoomCost(int $totalRooms, string $roomType): int
    {
        $baseCost = 20;
        $linearIncrease = $totalRooms * 5;
        $totalCost = $baseCost + $linearIncrease;
        
        if ($roomType === 'boss') {
            $totalCost += 30;
        }
        
        return max(5, (int) (ceil($totalCost / 5) * 5)); // Round to nearest 5
    }

    public function calculateRoomCapacity(int $roomPosition, int $monsterTier): int
    {
        $baseCapacity = max(1, $roomPosition) * 2; // Ensure position is at least 1 
        $tier = max(1, $monsterTier); // Ensure tier is at least 1 to prevent division by zero
        return (int) floor($baseCapacity / $tier);
    }

    public function getMonsterStats(string $monsterType): array
    {
        $stats = [
            'Goblin' => ['hp' => 25, 'attack' => 8, 'defense' => 3, 'tier' => 1, 'species' => 'Goblinoid'],
            'Orc' => ['hp' => 40, 'attack' => 12, 'defense' => 6, 'tier' => 2, 'species' => 'Goblinoid'],
            'Slime' => ['hp' => 20, 'attack' => 5, 'defense' => 2, 'tier' => 1, 'species' => 'Slime'],
            'False Chest' => ['hp' => 30, 'attack' => 10, 'defense' => 4, 'tier' => 1, 'species' => 'Mimic']
        ];
        
        return $stats[$monsterType] ?? ['hp' => 20, 'attack' => 5, 'defense' => 2, 'tier' => 1, 'species' => 'Unknown'];
    }

    public function getSpeciesUnlockCost(string $speciesName): ?int
    {
        $unlockCosts = [
            'Mimetic' => 1000,      // Default cost from constants
            'Amorphous' => 1000,
            'Plant' => 1000,
            'Crustacean' => 1000,
        ];
        
        return $unlockCosts[$speciesName] ?? 1000; // Default cost
    }

    public function calculateUnlockedTier(int $totalExperience): int
    {
        $tierThresholds = [
            0,    // Tier 1
            500,  // Tier 2
            1500, // Tier 3
            3000, // Tier 4
            5000  // Tier 5
        ];

        $tier = 1;
        foreach ($tierThresholds as $threshold) {
            if ($totalExperience >= $threshold) {
                $tier++;
            } else {
                break;
            }
        }
        
        return min($tier - 1, 5); // Cap at tier 5
    }

    public function getMonstersForSpeciesAndTier(string $speciesName, int $maxTier): array
    {
        $allMonsters = [
            'Goblinoid' => [
                1 => [['name' => 'Goblin', 'hp' => 25, 'attack' => 8, 'defense' => 3, 'tier' => 1]],
                2 => [['name' => 'Orc', 'hp' => 40, 'attack' => 12, 'defense' => 6, 'tier' => 2]],
                3 => [['name' => 'Orc Warrior', 'hp' => 60, 'attack' => 18, 'defense' => 9, 'tier' => 3]],
            ],
            'Slime' => [
                1 => [['name' => 'Slime', 'hp' => 20, 'attack' => 5, 'defense' => 2, 'tier' => 1]],
                2 => [['name' => 'Acid Slime', 'hp' => 35, 'attack' => 10, 'defense' => 4, 'tier' => 2]],
            ],
            'Mimic' => [
                1 => [['name' => 'False Chest', 'hp' => 30, 'attack' => 10, 'defense' => 4, 'tier' => 1]],
                2 => [['name' => 'Treasure Mimic', 'hp' => 50, 'attack' => 15, 'defense' => 8, 'tier' => 2]],
            ]
        ];

        $availableMonsters = [];
        if (isset($allMonsters[$speciesName])) {
            for ($tier = 1; $tier <= $maxTier; $tier++) {
                if (isset($allMonsters[$speciesName][$tier])) {
                    $availableMonsters = array_merge($availableMonsters, $allMonsters[$speciesName][$tier]);
                }
            }
        }

        return $availableMonsters;
    }

    public function scaleMonsterStats(array $baseStats, int $floorNumber, bool $isBoss = false): array
    {
        $floorMultiplier = 1 + ($floorNumber - 1) * 0.2; // 20% increase per floor
        $bossMultiplier = $isBoss ? 1.5 : 1.0;
        
        return [
            'hp' => (int) ceil($baseStats['hp'] * $floorMultiplier * $bossMultiplier),
            'attack' => (int) ceil($baseStats['attack'] * $floorMultiplier * $bossMultiplier),
            'defense' => (int) ceil($baseStats['defense'] * $floorMultiplier * $bossMultiplier)
        ];
    }

    public function validateMonsterPlacement(int $floorNumber, int $roomPosition, string $monsterType, array $existingMonsters): array
    {
        // Check if adventurers are in dungeon (this would come from game state)
        // For now, assume this check is done elsewhere
        
        $monsterStats = $this->getMonsterStats($monsterType);
        $roomCapacity = $this->calculateRoomCapacity($roomPosition, $monsterStats['tier']);
        
        // Count existing monsters of the same tier
        $sameTierCount = 0;
        foreach ($existingMonsters as $monster) {
            $existingStats = $this->getMonsterStats($monster->getType());
            if ($existingStats['tier'] === $monsterStats['tier']) {
                $sameTierCount++;
            }
        }
        
        if ($sameTierCount >= $roomCapacity) {
            return [
                'valid' => false,
                'error' => "Room {$roomPosition} can only hold {$roomCapacity} Tier {$monsterStats['tier']} monsters!"
            ];
        }
        
        return ['valid' => true];
    }
}