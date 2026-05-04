<?php

declare(strict_types=1);

namespace DungeonCore\Controllers;

use DungeonCore\Application\UseCases\LinkGuestAccountUseCase;
use DungeonCore\Core\Environment;
use DungeonCore\Http\Response;
use DungeonCore\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController
{
    public function __construct(private LinkGuestAccountUseCase $linkGuestAccountUseCase)
    {
    }

    public function loginInfo(Request $request, Response $response): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'login_url' => Environment::required('WEB_HATCHERY_LOGIN_URL'),
            ],
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function session(Request $request, Response $response): Response
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Authentication required',
                'message' => 'Unauthorized',
                'login_url' => Environment::required('WEB_HATCHERY_LOGIN_URL')
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

    public function guestSession(Request $request, Response $response): Response
    {
        $secret = Environment::required('JWT_SECRET');
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

    public function linkGuest(Request $request, Response $response): Response
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Authentication required',
                'message' => 'Unauthorized',
                'login_url' => Environment::required('WEB_HATCHERY_LOGIN_URL'),
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $body = $request->getParsedBody();
        $guestToken = is_array($body) ? ($body['guest_token'] ?? null) : null;
        if (!is_string($guestToken) || trim($guestToken) === '') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Guest token is required',
            ]));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json');
        }

        try {
            $decoded = JWT::decode(trim($guestToken), new Key(Environment::required('JWT_SECRET'), 'HS256'));
        } catch (\Throwable) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Invalid guest token',
            ]));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json');
        }

        if (($decoded->is_guest ?? false) !== true) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Token is not a guest session',
            ]));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json');
        }

        $guestUserId = $decoded->sub ?? $decoded->user_id ?? null;
        if (!is_string($guestUserId) || !str_starts_with($guestUserId, 'guest_')) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Guest token is missing a valid user identifier',
            ]));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json');
        }

        $result = $this->linkGuestAccountUseCase->execute($guestUserId, $authUser);
        $status = ($result['success'] ?? false) === true ? 200 : 404;
        if (isset($result['data']) && is_array($result['data'])) {
            $result['data']['user'] = self::serializeUser($authUser);
        }

        $response->getBody()->write(json_encode($result));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
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
