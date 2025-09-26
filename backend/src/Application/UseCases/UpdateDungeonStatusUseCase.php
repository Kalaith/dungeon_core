<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\GameRepositoryInterface;

class UpdateDungeonStatusUseCase
{
    /** @var array<string, string> */
    private array $allowedStatuses = [
        'open' => 'Open',
        'closed' => 'Closed',
        'closing' => 'Closing',
        'maintenance' => 'Maintenance'
    ];

    public function __construct(private GameRepositoryInterface $gameRepo)
    {
    }

    public function execute(string $sessionId, string $status): array
    {
        $game = $this->gameRepo->findBySessionId($sessionId);
        if (!$game) {
            return ['success' => false, 'error' => 'Game not found'];
        }

        $normalized = strtolower($status);
        if (!isset($this->allowedStatuses[$normalized])) {
            return ['success' => false, 'error' => 'Invalid status value'];
        }

        $targetStatus = $this->allowedStatuses[$normalized];
        $game->setStatus($targetStatus);

        $this->gameRepo->save($game);

        return [
            'success' => true,
            'status' => $game->getStatus(),
            'activeAdventurerParties' => $game->getActivePartyCount(),
            'canModifyDungeon' => $game->canModifyDungeon()
        ];
    }
}
