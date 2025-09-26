<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Services\GameLogic;

class GetAvailableMonstersUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private GameLogic $gameLogic
    ) {}

    public function execute(string $sessionId): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        $availableMonsters = [];
        $perSpecies = [];
        $unlockedSpecies = $game->getUnlockedSpecies();

        foreach ($unlockedSpecies as $speciesName) {
            $speciesTotalExp = $game->getSpeciesTotalExperience($speciesName);
            $unlockedTier = $this->gameLogic->calculateUnlockedTier($speciesTotalExp);

            $speciesMonsters = $this->gameLogic->getMonstersForSpeciesAndTier($speciesName, $unlockedTier);
            $availableMonsters = array_merge($availableMonsters, $speciesMonsters);

            $perSpecies[$speciesName] = [
                'experience' => $speciesTotalExp,
                'unlockedTier' => $unlockedTier,
                'monsters' => $speciesMonsters
            ];
        }

        // Sort by tier
        usort($availableMonsters, function($a, $b) {
            return $a['tier'] <=> $b['tier'];
        });

        return [
            'success' => true,
            'monsters' => $availableMonsters,
            'species' => $perSpecies
        ];
    }
}
