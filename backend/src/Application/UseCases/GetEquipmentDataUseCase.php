<?php

namespace DungeonCore\Application\UseCases;

use DungeonCore\Domain\Repositories\EquipmentRepositoryInterface;

class GetEquipmentDataUseCase
{
    private EquipmentRepositoryInterface $equipmentRepository;

    public function __construct(EquipmentRepositoryInterface $equipmentRepository)
    {
        $this->equipmentRepository = $equipmentRepository;
    }

    public function execute(): array
    {
        return $this->equipmentRepository->getAllEquipment();
    }
}
