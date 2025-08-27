<?php

namespace DungeonCore\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DungeonCore\Application\UseCases\GetGameConstantsUseCase;
use DungeonCore\Application\UseCases\GetMonsterTypesUseCase;
use DungeonCore\Application\UseCases\GetMonsterTraitsUseCase;
use DungeonCore\Application\UseCases\GetEquipmentDataUseCase;
use DungeonCore\Application\UseCases\GetFloorScalingUseCase;

class DataController
{
    private GetGameConstantsUseCase $getGameConstantsUseCase;
    private GetMonsterTypesUseCase $getMonsterTypesUseCase;
    private GetMonsterTraitsUseCase $getMonsterTraitsUseCase;
    private GetEquipmentDataUseCase $getEquipmentDataUseCase;
    private GetFloorScalingUseCase $getFloorScalingUseCase;

    public function __construct(
        GetGameConstantsUseCase $getGameConstantsUseCase,
        GetMonsterTypesUseCase $getMonsterTypesUseCase,
        GetMonsterTraitsUseCase $getMonsterTraitsUseCase,
        GetEquipmentDataUseCase $getEquipmentDataUseCase,
        GetFloorScalingUseCase $getFloorScalingUseCase
    ) {
        $this->getGameConstantsUseCase = $getGameConstantsUseCase;
        $this->getMonsterTypesUseCase = $getMonsterTypesUseCase;
        $this->getMonsterTraitsUseCase = $getMonsterTraitsUseCase;
        $this->getEquipmentDataUseCase = $getEquipmentDataUseCase;
        $this->getFloorScalingUseCase = $getFloorScalingUseCase;
    }

    public function getGameConstants(Request $request, Response $response): Response
    {
        try {
            $constants = $this->getGameConstantsUseCase->execute();
            
            $response->getBody()->write(json_encode($constants));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getMonsterTypes(Request $request, Response $response): Response
    {
        try {
            $monsterTypes = $this->getMonsterTypesUseCase->execute();
            
            $response->getBody()->write(json_encode($monsterTypes));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getMonsterTraits(Request $request, Response $response): Response
    {
        try {
            $traits = $this->getMonsterTraitsUseCase->execute();
            
            $response->getBody()->write(json_encode($traits));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getEquipmentData(Request $request, Response $response): Response
    {
        try {
            $equipment = $this->getEquipmentDataUseCase->execute();
            
            $response->getBody()->write(json_encode($equipment));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getFloorScaling(Request $request, Response $response): Response
    {
        try {
            $scaling = $this->getFloorScalingUseCase->execute();
            
            $response->getBody()->write(json_encode($scaling));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
