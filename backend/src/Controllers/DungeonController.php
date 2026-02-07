<?php

namespace DungeonCore\Controllers;

use DungeonCore\Application\UseCases\AddRoomUseCase;
use DungeonCore\Application\UseCases\GetDungeonStateUseCase;
use DungeonCore\Http\Response;
use DungeonCore\Http\Request;

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
        $data = $request->getParsedBody();
        
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
        $authUser = $request->getAttribute('auth_user');
        if ($authUser && isset($authUser['id'])) {
            return (string) $authUser['id'];
        }
        return session_id();
    }
}
