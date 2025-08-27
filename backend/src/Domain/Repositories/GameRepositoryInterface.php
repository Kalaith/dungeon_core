<?php

namespace DungeonCore\Domain\Repositories;

use DungeonCore\Domain\Entities\Game;

interface GameRepositoryInterface
{
    public function findBySessionId(string $sessionId): ?Game;
    public function save(Game $game): void;
    public function create(string $sessionId): Game;
}