<?php

namespace DungeonCore\Controllers;

use DungeonCore\Http\Response;
use DungeonCore\Http\Request;
use Firebase\JWT\JWT;

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
                'user' => self::serializeUser($authUser),
            ]
        ];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public static function guestSession(Request $request, Response $response): Response
    {
        $secret = $_ENV['JWT_SECRET']
            ?? $_SERVER['JWT_SECRET']
            ?? getenv('JWT_SECRET')
            ?: '';

        if ($secret === '') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'JWT secret not configured',
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }

        $issuedAt = time();
        $guestUserId = 'guest_' . bin2hex(random_bytes(16));
        $guestName = 'Guest ' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $token = JWT::encode([
            'sub' => $guestUserId,
            'user_id' => $guestUserId,
            'username' => $guestName,
            'display_name' => $guestName,
            'role' => 'guest',
            'roles' => ['guest'],
            'auth_type' => 'guest',
            'is_guest' => true,
            'iat' => $issuedAt,
            'exp' => $issuedAt + (60 * 60 * 24 * 30),
        ], $secret, 'HS256');

        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => self::serializeUser([
                    'id' => $guestUserId,
                    'username' => $guestName,
                    'display_name' => $guestName,
                    'role' => 'guest',
                    'roles' => ['guest'],
                    'auth_type' => 'guest',
                    'is_guest' => true,
                ]),
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public static function linkGuest(Request $request, Response $response): Response
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Authentication required',
                'message' => 'Unauthorized',
                'login_url' => $_ENV['LOGIN_URL'] ?? '',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $body = $request->getParsedBody();
        $guestUserId = is_array($body) ? ($body['guest_user_id'] ?? null) : null;
        if (!is_string($guestUserId) || strpos($guestUserId, 'guest_') !== 0) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Invalid guest user identifier',
            ]));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'linked' => true,
                'guest_user_id' => $guestUserId,
                'user' => self::serializeUser($authUser),
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    private static function serializeUser(array $authUser): array
    {
        return [
            'id' => (string) $authUser['id'],
            'email' => $authUser['email'] ?? null,
            'username' => $authUser['username'] ?? null,
            'display_name' => $authUser['display_name'] ?? ($authUser['username'] ?? null),
            'role' => $authUser['role'] ?? 'user',
            'roles' => $authUser['roles'] ?? [],
            'auth_type' => $authUser['auth_type'] ?? 'frontpage',
            'is_guest' => (bool) ($authUser['is_guest'] ?? false),
        ];
    }
}
