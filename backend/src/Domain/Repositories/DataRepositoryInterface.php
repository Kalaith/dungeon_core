<?php

declare(strict_types=1);

namespace DungeonCore\Domain\Repositories;

interface DataRepositoryInterface
{
    public function getGameConstants(): array;
    public function getMonsterTypes(): array;
    public function getMonsterTraits(): array;
    public function getFloorScaling(): array;
}
