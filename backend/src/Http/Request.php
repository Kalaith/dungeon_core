<?php

namespace DungeonCore\Http;

class Request
{
    private array $headers;
    private array $queryParams;
    private array $parsedBody;
    private array $attributes = [];
    private array $serverParams;
    private string $method;
    private string $uri;

    public function __construct(array $headers, array $queryParams, array $parsedBody, array $serverParams, string $method, string $uri)
    {
        $this->headers = $headers;
        $this->queryParams = $queryParams;
        $this->parsedBody = $parsedBody;
        $this->serverParams = $serverParams;
        $this->method = $method;
        $this->uri = $uri;
    }

    public function getHeaderLine(string $name): string
    {
        $key = strtolower($name);
        if (isset($this->headers[$key])) {
            return $this->headers[$key];
        }

        if ($key === 'authorization') {
            return $this->serverParams['HTTP_AUTHORIZATION']
                ?? $this->serverParams['REDIRECT_HTTP_AUTHORIZATION']
                ?? '';
        }

        return '';
    }

    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    public function getParsedBody(): array
    {
        return $this->parsedBody;
    }

    public function getServerParams(): array
    {
        return $this->serverParams;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function withAttribute(string $name, mixed $value): self
    {
        $clone = clone $this;
        $clone->attributes[$name] = $value;
        return $clone;
    }

    public function getAttribute(string $name, mixed $default = null): mixed
    {
        return $this->attributes[$name] ?? $default;
    }
}
