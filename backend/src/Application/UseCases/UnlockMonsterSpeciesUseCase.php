<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Services\GameLogic;

class UnlockMonsterSpeciesUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private GameLogic $gameLogic
    ) {}

    public function execute(string $sessionId, string $speciesName): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        // Check if species is already unlocked
        if ($game->hasUnlockedSpecies($speciesName)) {
            return ['success' => false, 'error' => 'Species already unlocked'];
        }

        // Get species unlock cost
        $unlockCost = $this->gameLogic->getSpeciesUnlockCost($speciesName);
        if ($unlockCost === null) {
            return ['success' => false, 'error' => 'Invalid species name'];
        }

        // First species is free for new players
        $unlockedSpecies = $game->getUnlockedSpecies();
        $isFirstSpecies = empty($unlockedSpecies);
        $actualCost = $isFirstSpecies ? 0 : $unlockCost;

        // Check if player has enough gold (unless it's their first species)
        if (!$isFirstSpecies) {
            if (!$game->spendGold($actualCost)) {
                return ['success' => false, 'error' => 'Insufficient gold', 'required' => $actualCost];
            }
        }

        // Unlock the species
        $game->unlockSpecies($speciesName);

        // Save game state
        $this->gameRepo->save($game);

        return [
            'success' => true,
            'speciesName' => $speciesName,
            'costPaid' => $actualCost,
            'remainingGold' => $game->getGold(),
            'isFirstSpecies' => $isFirstSpecies,
            'unlockedSpecies' => $game->getUnlockedSpecies(),
            'speciesExperience' => $game->getSpeciesExperience()
        ];
    }
}
