<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;

class GetGameStateUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {}

    public function execute(string $sessionId): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        
        if (!$game) {
            // Create new game for session
            $game = $this->gameRepo->create($sessionId);
        }

        return [
            'game' => [
                'id' => $game->getId(),
                'mana' => $game->getMana(),
                'maxMana' => $game->getMaxMana(),
                'manaRegen' => $game->getManaRegen(),
                'gold' => $game->getGold(),
                'souls' => $game->getSouls(),
                'day' => $game->getDay(),
                'hour' => $game->getHour(),
                'status' => $game->getStatus(),
                'unlockedMonsterSpecies' => $game->getUnlockedSpecies(),
                'speciesExperience' => $game->getSpeciesExperience()
            ]
        ];
    }
}