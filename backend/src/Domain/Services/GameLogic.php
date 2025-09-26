<?php

namespace DungeonCore\Domain\Services;

use DungeonCore\Domain\Repositories\DataRepositoryInterface;

class GameLogic
{
    private ?array $monsterCatalog = null;
    private ?array $gameConstants = null;

    public function __construct(private DataRepositoryInterface $dataRepository)
    {
    }

    public function calculateMonsterCost(string $monsterType, int $floorNumber, bool $isBossRoom = false): int
    {
        $monster = $this->getMonsterStats($monsterType);
        $baseCost = $monster['baseCost'] ?? 10;

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
        $catalog = $this->getMonsterCatalog();

        if (!isset($catalog[$monsterType])) {
            return [];
        }

        $data = $catalog[$monsterType];

        return [
            'hp' => (int) ($data['hp'] ?? 20),
            'attack' => (int) ($data['attack'] ?? 5),
            'defense' => (int) ($data['defense'] ?? 2),
            'tier' => (int) ($data['tier'] ?? 1),
            'species' => $data['species'] ?? 'Unknown',
            'baseCost' => (int) ($data['baseCost'] ?? 10),
            'traits' => $data['traits'] ?? []
        ];
    }

    public function getSpeciesUnlockCost(string $speciesName): ?int
    {
        $constants = $this->getGameConstants();

        if (isset($constants['SPECIES_UNLOCK_COST'])) {
            return (int) $constants['SPECIES_UNLOCK_COST'];
        }

        // Allow species-specific override if provided by constant table (e.g., SPECIES_COST_Mimetic)
        $key = 'SPECIES_COST_' . strtoupper($speciesName);
        if (isset($constants[$key])) {
            return (int) $constants[$key];
        }

        return 1000;
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
        $catalog = $this->getMonsterCatalog();
        $availableMonsters = [];

        foreach ($catalog as $monsterName => $data) {
            if (strcasecmp($data['species'] ?? '', $speciesName) === 0 && ($data['tier'] ?? 0) <= $maxTier) {
                $availableMonsters[] = [
                    'name' => $monsterName,
                    'hp' => (int) ($data['hp'] ?? 20),
                    'attack' => (int) ($data['attack'] ?? 5),
                    'defense' => (int) ($data['defense'] ?? 2),
                    'tier' => (int) ($data['tier'] ?? 1),
                    'species' => $data['species'] ?? 'Unknown',
                    'baseCost' => (int) ($data['baseCost'] ?? 10),
                    'traits' => $data['traits'] ?? []
                ];
            }
        }

        usort($availableMonsters, fn($a, $b) => $a['tier'] <=> $b['tier']);

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
        if (empty($monsterStats)) {
            return [
                'valid' => false,
                'error' => 'Unknown monster type.'
            ];
        }

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

    private function getMonsterCatalog(): array
    {
        if ($this->monsterCatalog === null) {
            $this->monsterCatalog = $this->dataRepository->getMonsterTypes();
        }

        return $this->monsterCatalog;
    }

    private function getGameConstants(): array
    {
        if ($this->gameConstants === null) {
            $this->gameConstants = $this->dataRepository->getGameConstants();
        }

        return $this->gameConstants;
    }
}