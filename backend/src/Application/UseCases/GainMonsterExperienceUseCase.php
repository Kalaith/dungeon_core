<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Services\GameLogic;

class GainMonsterExperienceUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private GameLogic $gameLogic
    ) {}

    public function execute(string $sessionId, string $monsterName, int $experience): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        // Add experience to the monster
        $previousExp = $game->getMonsterExperience($monsterName);
        $newExp = $game->addMonsterExperience($monsterName, $experience);
        
        // Check for tier unlocks
        $monsterStats = $this->gameLogic->getMonsterStats($monsterName);
        if (!$monsterStats) {
            return ['success' => false, 'error' => 'Invalid monster name'];
        }

        $speciesName = $monsterStats['species'] ?? null;
        $tierUnlocks = [];
        
        if ($speciesName) {
            $speciesTotalExp = $game->getSpeciesTotalExperience($speciesName);
            $newUnlockedTier = $this->gameLogic->calculateUnlockedTier($speciesTotalExp);
            $previousUnlockedTier = $this->gameLogic->calculateUnlockedTier($speciesTotalExp - $experience);
            
            if ($newUnlockedTier > $previousUnlockedTier) {
                $game->unlockTier($speciesName, $newUnlockedTier);
                $tierUnlocks[] = [
                    'species' => $speciesName,
                    'tier' => $newUnlockedTier
                ];
            }
        }
        
        // Save game state
        $this->gameRepo->save($game);

        return [
            'success' => true,
            'monsterName' => $monsterName,
            'previousExp' => $previousExp,
            'newExp' => $newExp,
            'expGained' => $experience,
            'tierUnlocks' => $tierUnlocks
        ];
    }
}
