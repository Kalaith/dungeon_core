<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\DataRepositoryInterface;

class GetFloorScalingUseCase
{
    private DataRepositoryInterface $dataRepository;

    public function __construct(DataRepositoryInterface $dataRepository)
    {
        $this->dataRepository = $dataRepository;
    }

    public function execute(): array
    {
        return $this->dataRepository->getFloorScaling();
    }
}
