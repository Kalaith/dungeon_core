<?php

namespace DungeonCore\Http;

class Response
{
    private int $status = 200;
    private array $headers = [];
    private Body $body;

    public function __construct()
    {
        $this->body = new Body();
    }

    public function getBody(): Body
    {
        return $this->body;
    }

    public function withHeader(string $name, string $value): self
    {
        $clone = clone $this;
        $clone->headers[$name] = $value;
        return $clone;
    }

    public function withStatus(int $status): self
    {
        $clone = clone $this;
        $clone->status = $status;
        return $clone;
    }

    public function getStatusCode(): int
    {
        return $this->status;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }
}
