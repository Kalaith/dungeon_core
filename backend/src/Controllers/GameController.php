<?php

namespace DungeonCore\Controllers;

use DungeonCore\Application\UseCases\GetGameStateUseCase;
use DungeonCore\Application\UseCases\PlaceMonsterUseCase;
use DungeonCore\Application\UseCases\InitializeGameUseCase;
use DungeonCore\Application\UseCases\ResetGameUseCase;
use DungeonCore\Application\UseCases\UnlockMonsterSpeciesUseCase;
use DungeonCore\Application\UseCases\GainMonsterExperienceUseCase;
use DungeonCore\Application\UseCases\GetAvailableMonstersUseCase;
use DungeonCore\Application\UseCases\UpdateDungeonStatusUseCase;
use DungeonCore\Http\Response;
use DungeonCore\Http\Request;

class GameController
{
    public function __construct(
        private GetGameStateUseCase $getGameStateUseCase,
        private PlaceMonsterUseCase $placeMonsterUseCase,
        private InitializeGameUseCase $initializeGameUseCase,
        private ResetGameUseCase $resetGameUseCase,
        private UnlockMonsterSpeciesUseCase $unlockMonsterSpeciesUseCase,
        private GainMonsterExperienceUseCase $gainMonsterExperienceUseCase,
        private GetAvailableMonstersUseCase $getAvailableMonstersUseCase,
        private UpdateDungeonStatusUseCase $updateDungeonStatusUseCase
    ) {}

    public function initialize(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $result = $this->initializeGameUseCase->execute($sessionId);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getState(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $result = $this->getGameStateUseCase->execute($sessionId);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function placeMonster(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $data = $request->getParsedBody();
        
        $result = $this->placeMonsterUseCase->execute(
            $sessionId,
            $data['floorNumber'],
            $data['roomPosition'],
            $data['monsterType']
        );
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function unlockMonsterSpecies(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $data = $request->getParsedBody();
        
        $result = $this->unlockMonsterSpeciesUseCase->execute(
            $sessionId,
            $data['speciesName']
        );
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function gainMonsterExperience(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $data = $request->getParsedBody();
        
        $result = $this->gainMonsterExperienceUseCase->execute(
            $sessionId,
            $data['monsterName'],
            $data['experience']
        );
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getAvailableMonsters(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);

        $result = $this->getAvailableMonstersUseCase->execute($sessionId);

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateStatus(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $data = $request->getParsedBody();

        $result = $this->updateDungeonStatusUseCase->execute(
            $sessionId,
            $data['status'] ?? ''
        );

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function resetGame(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $result = $this->resetGameUseCase->execute($sessionId);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function getSessionId(Request $request): string
    {
        $authUser = $request->getAttribute('auth_user');
        if ($authUser && isset($authUser['id'])) {
            return (string) $authUser['id'];
        }
        return session_id();
    }
}
