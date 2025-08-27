<?php

namespace DungeonCore\Controllers;

use DungeonCore\Application\UseCases\AddRoomUseCase;
use DungeonCore\Application\UseCases\GetDungeonStateUseCase;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DungeonController
{
    public function __construct(
        private AddRoomUseCase $addRoomUseCase,
        private GetDungeonStateUseCase $getDungeonStateUseCase
    ) {}

    public function getDungeonState(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $result = $this->getDungeonStateUseCase->execute($sessionId);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addRoom(Request $request, Response $response): Response
    {
        $sessionId = $this->getSessionId($request);
        $data = json_decode($request->getBody()->getContents(), true);
        
        $result = $this->addRoomUseCase->execute(
            $sessionId,
            $data['floorNumber'],
            $data['roomType'],
            $data['position'],
            $data['cost']
        );
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function getSessionId(Request $request): string
    {
        $headers = $request->getHeaders();
        return $headers['X-Session-ID'][0] ?? session_id();
    }
}