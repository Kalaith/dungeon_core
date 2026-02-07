<?php

declare(strict_types=1);

namespace DungeonCore\Core;

use ReflectionMethod;
use Throwable;
use DungeonCore\Http\Request;
use DungeonCore\Http\Response;

final class Router
{
    private array $routes = [];
    private string $basePath = '';
    private array $globalMiddleware = [];

    public function setBasePath(string $basePath): void
    {
        $this->basePath = rtrim($basePath, '/');
    }

    public function addMiddleware(callable|string $middleware): void
    {
        $this->globalMiddleware[] = $middleware;
    }

    public function post(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function get(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function put(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    private function addRoute(string $method, string $path, array|callable $handler, array $middleware): void
    {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = "#^" . $pattern . "$#";

        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    public function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = explode('?', $uri)[0];

        if (!empty($this->basePath) && strpos($path, $this->basePath) === 0) {
            $path = substr($path, strlen($this->basePath));
        }

        if ($path === '') {
            $path = '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $path, $matches)) {
                $routeParams = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                $request = $this->buildRequest();
                $response = new Response();

                $middlewares = array_merge($this->globalMiddleware, $route['middleware']);
                foreach ($middlewares as $mw) {
                    $mwInstance = is_string($mw) ? new $mw() : $mw;
                    $result = $mwInstance($request, $response, $routeParams);
                    if ($result instanceof Response) {
                        $this->emit($this->withCors($result));
                        return;
                    }
                    if ($result instanceof Request) {
                        $request = $result;
                        continue;
                    }
                    if ($result === false) {
                        $this->emit($this->withCors($response));
                        return;
                    }
                }

                try {
                    $response = $this->invokeHandler($route['handler'], $request, $response, $routeParams);
                } catch (Throwable $e) {
                    $debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
                    $payload = [
                        'success' => false,
                        'error' => 'Internal server error'
                    ];
                    if ($debug) {
                        $payload['exception'] = get_class($e);
                        $payload['message'] = $e->getMessage();
                        $payload['file'] = $e->getFile();
                        $payload['line'] = $e->getLine();
                        $payload['trace'] = $e->getTraceAsString();
                    }
                    $response = $this->writeJson($response->withStatus(500), $payload);
                }

                $this->emit($this->withCors($response));
                return;
            }
        }

        $response = $this->writeJson((new Response())->withStatus(404), [
            'success' => false,
            'error' => 'Route not found: ' . $path
        ]);

        $this->emit($this->withCors($response));
    }

    private function buildRequest(): Request
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        $rawBody = $_SERVER['RAW_BODY'] ?? (file_get_contents('php://input') ?: '');
        $parsedBody = [];
        $contentType = $headers['content-type'] ?? '';
        if (stripos($contentType, 'application/json') !== false && $rawBody !== '') {
            $decoded = json_decode($rawBody, true);
            if (is_array($decoded)) {
                $parsedBody = $decoded;
            }
        } elseif (!empty($_POST)) {
            $parsedBody = $_POST;
        }

        return new Request(
            $headers,
            $_GET,
            $parsedBody,
            $_SERVER,
            $method,
            $uri
        );
    }

    private function invokeHandler(array|callable $handler, Request $request, Response $response, array $routeParams): Response
    {
        if (is_callable($handler)) {
            $result = $handler($request, $response, $routeParams);
            return $result instanceof Response ? $result : $response;
        }

        $controllerClass = $handler[0];
        $methodName = $handler[1];

        $controller = new $controllerClass();

        $method = new ReflectionMethod($controller, $methodName);
        $paramCount = $method->getNumberOfParameters();

        if ($paramCount >= 3) {
            $result = $controller->$methodName($request, $response, $routeParams);
        } else {
            $result = $controller->$methodName($request, $response);
        }

        return $result instanceof Response ? $result : $response;
    }

    private function writeJson(Response $response, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function withCors(Response $response): Response
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }

    private function emit(Response $response): void
    {
        if (!headers_sent()) {
            http_response_code($response->getStatusCode());
            foreach ($response->getHeaders() as $name => $values) {
                $headerValues = is_array($values) ? $values : [$values];
                foreach ($headerValues as $value) {
                    header(sprintf('%s: %s', $name, $value), false);
                }
            }
        }

        echo (string)$response->getBody();
    }
}
