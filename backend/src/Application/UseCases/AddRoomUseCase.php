<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;

class AddRoomUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {}

    public function execute(string $sessionId, int $floorNumber, string $roomType, int $position, int $cost): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        // Check mana cost
        if (!$game->spendMana($cost)) {
            return ['success' => false, 'error' => 'Insufficient mana'];
        }

        // Add room
        $roomId = $this->dungeonRepo->addRoom($game->getId(), $floorNumber, $roomType, $position);
        
        // Save game state
        $this->gameRepo->save($game);

        return [
            'success' => true,
            'roomId' => $roomId,
            'type' => $roomType,
            'position' => $position
        ];
    }
}