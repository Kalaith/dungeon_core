<?php

declare(strict_types=1);

namespace DungeonCore\Middleware;

use DungeonCore\Core\Environment;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use DungeonCore\Http\Response;
use DungeonCore\Http\Request;

class WebHatcheryJwtMiddleware
{
    public function __invoke(Request $request, Response $response, array $routeParams = []): Response|Request|bool
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = '';
        if ($authHeader && preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = trim((string) $matches[1]);
        } else {
            $queryParams = $request->getQueryParams();
            if (isset($queryParams['token']) && is_string($queryParams['token'])) {
                $token = trim($queryParams['token']);
            }
        }

        if (stripos($token, 'Bearer ') === 0) {
            $token = trim(substr($token, 7));
        }
        $token = trim($token, " \t\n\r\0\x0B\"'");
        if ($token === '') {
            return $this->unauthorized($response, 'Authorization header missing or invalid');
        }

        $secret = Environment::required('JWT_SECRET');
        try {
        // Match Mytherra shared-session behavior.
            JWT::$leeway = 31536000;
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $userId = $decoded->sub ?? $decoded->user_id ?? null;
            if (!$userId) {
                return $this->unauthorized($response, 'Token missing user identifier');
            }

            $roles = $decoded->roles ?? (($decoded->role ?? null) ? [$decoded->role] : ['user']);
            $primaryRole = is_array($roles) ? ($roles[0] ?? 'user') : (string) $roles;
            $isGuest = (bool) ($decoded->is_guest ?? false);
            $authType = $decoded->auth_type ?? ($isGuest ? 'guest' : 'frontpage');
            $request = $request->withAttribute('auth_user', [
                'id' => (string) $userId,
                'email' => $decoded->email ?? null,
                'username' => $decoded->username ?? null,
                'display_name' => $decoded->display_name ?? $decoded->username ?? null,
                'role' => $primaryRole,
                'roles' => is_array($roles) ? $roles : [$roles],
                'auth_type' => is_string($authType) ? $authType : 'frontpage',
                'is_guest' => $isGuest,
            ]);
            return $request;
        } catch (\Exception $e) {
            error_log('WebHatcheryJwtMiddleware decode failed: ' . $e->getMessage());
            return $this->unauthorized($response, 'Invalid token');
        }
    }

    private function unauthorized(Response $response, string $message): Response
    {
        $payload = [
            'success' => false,
            'error' => 'Authentication required',
            'message' => $message,
            'login_url' => Environment::optional('WEB_HATCHERY_LOGIN_URL') ?? '/'
        ];
        $response->getBody()->write(json_encode($payload));
        return $response
            ->withStatus(401)
            ->withHeader('Content-Type', 'application/json');
    }
}
