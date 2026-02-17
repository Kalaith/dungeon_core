<?php

namespace DungeonCore\Controllers;

use DungeonCore\Http\Response;
use DungeonCore\Http\Request;

class AuthController
{
    public static function session(Request $request, Response $response): Response
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Authentication required',
                'message' => 'Unauthorized',
                'login_url' => $_ENV['LOGIN_URL'] ?? ''
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $payload = [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => (int) $authUser['id'],
                    'email' => $authUser['email'] ?? null,
                    'username' => $authUser['username'] ?? null,
                    'roles' => $authUser['roles'] ?? [],
                ]
            ]
        ];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
