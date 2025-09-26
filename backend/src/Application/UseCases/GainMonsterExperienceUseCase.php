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

        // Add experience to the monster record
        $previousExp = $game->getMonsterExperience($monsterName);
        $newExp = $game->addMonsterExperience($monsterName, $experience);

        $monsterStats = $this->gameLogic->getMonsterStats($monsterName);
        if (!$monsterStats) {
            return ['success' => false, 'error' => 'Invalid monster name'];
        }

        $speciesName = $monsterStats['species'] ?? null;
        $tierUnlocks = [];

        if ($speciesName) {
            $previousSpeciesExp = $game->getSpeciesTotalExperience($speciesName);
            $game->addSpeciesExperience($speciesName, $experience);
            $newSpeciesExp = $game->getSpeciesTotalExperience($speciesName);

            $previousUnlockedTier = $this->gameLogic->calculateUnlockedTier($previousSpeciesExp);
            $newUnlockedTier = $this->gameLogic->calculateUnlockedTier($newSpeciesExp);

            if ($newUnlockedTier > $previousUnlockedTier) {
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
            'tierUnlocks' => $tierUnlocks,
            'speciesExperience' => $game->getSpeciesExperience(),
            'monsterExperience' => $game->getMonsterExperienceMap()
        ];
    }
}
