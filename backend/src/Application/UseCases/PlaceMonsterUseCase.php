<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;
use DungeonCore\Domain\Repositories\DungeonRepositoryInterface;
use DungeonCore\Domain\Services\GameLogic;

class PlaceMonsterUseCase
{
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo,
        private GameLogic $gameLogic
    ) {}

    public function execute(string $sessionId, int $floorNumber, int $roomPosition, string $monsterType): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        // Check if adventurers are in dungeon
        if ($game->hasActiveAdventurers()) {
            return ['success' => false, 'error' => 'Cannot place monsters while adventurers are in the dungeon!'];
        }

        // Validate monster type exists and get stats
        $monsterStats = $this->gameLogic->getMonsterStats($monsterType);
        if (!$monsterStats) {
            return ['success' => false, 'error' => 'Monster type not found!'];
        }

        // Get room info and validate
        $room = $this->dungeonRepo->getRoom($floorNumber, $roomPosition);
        if (!$room) {
            return ['success' => false, 'error' => 'Room not found!'];
        }

        if ($room['type'] === 'entrance' || $room['type'] === 'core') {
            return ['success' => false, 'error' => 'Cannot place monsters in entrance or core rooms!'];
        }

        // Validate room capacity using backend logic
        $existingMonsters = $this->dungeonRepo->getRoomMonsters($floorNumber, $roomPosition);
        $validation = $this->gameLogic->validateMonsterPlacement($floorNumber, $roomPosition, $monsterType, $existingMonsters);
        
        if (!$validation['valid']) {
            return ['success' => false, 'error' => $validation['error']];
        }

        // Calculate actual cost server-side (never trust frontend)
        $isBossRoom = $room['type'] === 'boss';
        $cost = $this->gameLogic->calculateMonsterCost($monsterType, $floorNumber, $isBossRoom);

        // Check mana cost
        if (!$game->spendMana($cost)) {
            return ['success' => false, 'error' => "Not enough mana! Need {$cost} mana."];
        }

        // Determine if this is a boss monster
        $isBoss = $isBossRoom && count($existingMonsters) === 0;
        
        // Scale monster stats server-side
        $scaledStats = $this->gameLogic->scaleMonsterStats($monsterStats, $floorNumber, $isBoss);

        // Get the room ID for monster placement
        $roomId = $room['id'];

        // Ensure HP values are integers
        $hp = (int) $scaledStats['hp'];
        $maxHp = (int) $scaledStats['hp'];

        // Place monster
        $monster = $this->dungeonRepo->placeMonster(
            $roomId,
            $monsterType,
            $hp,
            $maxHp,
            $isBoss
        );
        
        // Save game state
        $this->gameRepo->save($game);

        return [
            'success' => true,
            'monster' => [
                'id' => $monster->getId(),
                'type' => $monster->getType(),
                'hp' => $monster->getHp(),
                'maxHp' => $monster->getMaxHp(),
                'isBoss' => $monster->isBoss(),
                'scaledStats' => $scaledStats
            ],
            'costPaid' => $cost,
            'remainingMana' => $game->getMana()
        ];
    }
}