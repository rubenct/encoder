# PRD — Base64 Streaming Encoder

**Version:** 1.0.0
**Date:** 2026-04-07
**Status:** Draft

---

## 1. Executive Summary

A SPA web application that converts text to Base64 with real-time streaming of the result. The server processes the encoding and returns the resulting string one character at a time with random pauses, simulating a long-running job. The user can cancel the process at any time.

---

## 2. Project Goals

- Demonstrate the use of **Server-Sent Events (SSE)** for real-time data streaming.
- Implement clean architecture with separation of concerns (SOLID, KISS, DRY).
- Deploy the application in Docker containers with basic authentication via nginx.
- Provide unit test coverage over the business logic layer.

---

## 3. Scope

### 3.1 In Scope

- REST endpoint that receives text and returns its Base64 encoding as an SSE stream.
- React SPA with an input field, a convert button, and a cancel button.
- Real-time visualization of the result accumulating character by character.
- Client-side cancellation of the process via `AbortController`.
- Blocking of new requests while a process is in progress.
- HTTP basic authentication managed by nginx.
- Independent Docker containers for API, UI, and proxy.
- Unit tests for the encoding service.

### 3.2 Out of Scope

- Encoding history persistence.
- User authentication (beyond nginx basic auth).
- Support for binary files or file uploads.
- Internationalization (i18n).

---

## 4. Use Cases

### UC-01 — Encode Text

**Actor:** Authenticated user
**Precondition:** The input field contains non-empty text and no process is active.
**Main flow:**
1. The user types text into the input field.
2. The user presses the **Convert** button.
3. The frontend sends `POST /api/encode` with the body `{ "text": "..." }`.
4. The backend encodes the text to Base64 and opens an SSE stream.
5. For each character of the encoded string, the server waits a random time between 1 and 5 seconds and transmits the character to the client.
6. The frontend receives each character and appends it to the result field in real time.
7. Upon receiving the last character, the stream closes and the **Convert** button is re-enabled.

**Postcondition:** The result field displays the complete Base64 string.

### UC-02 — Cancel an Ongoing Encoding

**Actor:** Authenticated user
**Precondition:** An encoding process is active.
**Main flow:**
1. The user presses the **Cancel** button.
2. The frontend calls `controller.abort()` on the active `AbortController`.
3. The SSE connection is closed from the client side.
4. The server detects the disconnection and terminates the stream generator.
5. The result field shows the partially received text with a `[cancelled]` indicator.
6. The **Convert** button is re-enabled and the **Cancel** button is disabled.

**Postcondition:** The process is cancelled; the partial result remains visible.

### UC-03 — Attempt a New Request While a Process Is Active

**Actor:** Authenticated user
**Precondition:** An encoding process is active.
**Main flow:**
1. The user attempts to press the **Convert** button.
2. The button is disabled; the action is not executed.

---

## 5. System Architecture

```
                         ┌──────────────────────────────────────────┐
                         │           Docker network                 │
                         │                                          │
   Browser               │  ┌─────────────┐                        │
      │   HTTPS :443      │  │    nginx     │                        │
      │──────────────────►│  │  (proxy)    │                        │
                         │  │  basic auth │                        │
                         │  └──────┬──────┘                        │
                         │         │ /         │ /api               │
                         │  ┌──────▼──────┐  ┌─▼──────────────┐   │
                         │  │  React (UI) │  │  FastAPI (API) │   │
                         │  │  :3000      │  │  :8000         │   │
                         │  │             │  │                │   │
                         │  │  EventSource│◄─┤ StreamingResp. │   │
                         │  │  AbortCtrl  │  │ EncoderService │   │
                         │  └─────────────┘  └────────────────┘   │
                         └──────────────────────────────────────────┘
```

### 5.1 Docker Containers

| Container | Base Image          | Internal Port | Role                                         |
|-----------|---------------------|---------------|----------------------------------------------|
| `proxy`   | `nginx:alpine`      | 443           | Reverse proxy, TLS termination, basic auth   |
| `api`     | `python:3.12-slim`  | 8000          | FastAPI backend, business logic              |
| `ui`      | `node:20-alpine`    | 3000          | React static server (Vite build)             |

### 5.2 Inter-Service Communication

- **Browser → nginx:** HTTPS on port 443 with basic auth.
- **nginx → ui:** `proxy_pass http://ui:3000` for `/` routes.
- **nginx → api:** `proxy_pass http://api:8000` for `/api` routes.
- **React → FastAPI:** `POST /api/encode` using `fetch` + `ReadableStream` + `AbortController` for the SSE stream.

---

## 6. API Specification

### `POST /api/encode`

Starts encoding a text string and returns the result as an SSE stream.

**Request headers:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "text": "Hello, World!"
}
```

**Validations:**
- `text` must not be empty or null.
- Maximum length: 10,000 characters.

**Response — success (`200 OK`):**
```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no

data: S\n\n
data: G\n\n
data: V\n\n
...
data: [DONE]\n\n
```

Each SSE event carries a single character. The special event `[DONE]` signals the end of the stream.

**Response — validation error (`422 Unprocessable Entity`):**
```json
{
  "detail": "Field 'text' must not be empty."
}
```

**Response — internal error (`500 Internal Server Error`):**
```json
{
  "detail": "Internal server error."
}
```

### `GET /api/health`

Health check endpoint for Docker healthcheck.

**Response (`200 OK`):**
```json
{ "status": "ok" }
```

---

## 7. Project Structure

```
base64-streamer/
├── api/
│   ├── app/
│   │   ├── main.py                  # FastAPI instance, CORS, routers
│   │   ├── routers/
│   │   │   └── encoder.py           # POST /encode, GET /health
│   │   ├── services/
│   │   │   └── encoder_service.py   # Logic: encode_to_base64(), stream_chars()
│   │   └── schemas.py               # Pydantic: EncodeRequest
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_encoder_service.py  # Unit tests for the service
│   ├── Dockerfile
│   └── requirements.txt
│
├── ui/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EncoderForm.jsx      # Textarea + Convert / Cancel buttons
│   │   │   └── OutputDisplay.jsx    # Displays the result in real time
│   │   ├── hooks/
│   │   │   └── useStreamEncoder.js  # fetch + AbortController + state
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
│
├── nginx/
│   ├── nginx.conf
│   ├── .htpasswd                    # Generated with htpasswd
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 8. Backend Design

### 8.1 `EncoderService`

All business logic lives in this class. It has no framework dependencies.

```python
# app/services/encoder_service.py
import base64
import asyncio
import random
from typing import AsyncGenerator

class EncoderService:
    MIN_DELAY: float = 1.0
    MAX_DELAY: float = 5.0

    def encode_to_base64(self, text: str) -> str:
        """Encodes plain text to Base64."""
        return base64.b64encode(text.encode("utf-8")).decode("utf-8")

    async def stream_chars(self, text: str) -> AsyncGenerator[str, None]:
        """Yields one character at a time with a random pause between each."""
        encoded = self.encode_to_base64(text)
        for char in encoded:
            delay = random.uniform(self.MIN_DELAY, self.MAX_DELAY)
            await asyncio.sleep(delay)
            yield char
```

### 8.2 Router

```python
# app/routers/encoder.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas import EncodeRequest
from app.services.encoder_service import EncoderService

router = APIRouter(prefix="/api")
service = EncoderService()  # Injected via DI in main.py

@router.post("/encode")
async def encode(request: EncodeRequest):
    async def event_generator():
        async for char in service.stream_chars(request.text):
            yield f"data: {char}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@router.get("/health")
async def health():
    return {"status": "ok"}
```

### 8.3 Schemas

```python
# app/schemas.py
from pydantic import BaseModel, field_validator

class EncodeRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field 'text' must not be empty.")
        if len(v) > 10_000:
            raise ValueError("Field 'text' must not exceed 10,000 characters.")
        return v
```

### 8.4 Main

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.encoder import router

app = FastAPI(title="Base64 Streamer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(router)
```

---

## 9. Frontend Design

### 9.1 Aesthetic and UI

**Retro-futuristic terminal** aesthetic: very dark background (`#0a0f0d`), monospaced typography (`IBM Plex Mono`), phosphorescent green accent (`#39FF7A`). The interface conveys that this is a serious, technical encoding tool.

Key UI elements:
- `[b64]` logo in the header with an animated status indicator.
- Textarea with a prompt prefix (`>`).
- **Convert** button (green, prominent) and **Cancel** button (red, disabled by default).
- Output panel with dark background, green text accumulating with a blinking cursor.
- Indeterminate progress bar during streaming.
- Log line at the bottom with a timestamp and status message.

### 9.2 `useStreamEncoder` Hook

```javascript
// src/hooks/useStreamEncoder.js
import { useState, useRef, useCallback } from "react";

export function useStreamEncoder() {
  const [output, setOutput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus]       = useState("idle"); // idle | streaming | done | cancelled | error
  const controllerRef             = useRef(null);

  const startEncoding = useCallback(async (text) => {
    if (streaming) return;

    setOutput("");
    setStreaming(true);
    setStatus("streaming");

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/encode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const char = line.replace("data: ", "").trim();
          if (char === "[DONE]") break;
          setOutput((prev) => prev + char);
        }
      }

      setStatus("done");
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus("cancelled");
      } else {
        setStatus("error");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }, [streaming]);

  const cancelEncoding = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }, []);

  return { output, streaming, status, startEncoding, cancelEncoding };
}
```

### 9.3 Components

**`EncoderForm`** — manages input and delegates actions to the hook:
- `<textarea>` for the input text.
- **Convert** button: calls `startEncoding(text)`; disabled when `streaming === true`.
- **Cancel** button: calls `cancelEncoding()`; disabled when `streaming === false`.

**`OutputDisplay`** — receives `output`, `streaming`, and `status` as props:
- Displays accumulated text with a blinking cursor while `streaming === true`.
- Displays a `[cancelled]` indicator when `status === "cancelled"`.
- Indeterminate progress bar while `streaming === true`.

---

## 10. nginx Configuration

```nginx
# nginx/nginx.conf
events {}

http {
    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate     /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        # Basic Auth
        auth_basic           "Base64 Streamer";
        auth_basic_user_file /etc/nginx/.htpasswd;

        # UI
        location / {
            proxy_pass         http://ui:3000;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
            proxy_set_header   Host $host;
        }

        # API — SSE requires buffering disabled
        location /api {
            proxy_pass                 http://api:8000;
            proxy_http_version         1.1;
            proxy_set_header           Host $host;
            proxy_buffering            off;
            proxy_cache                off;
            proxy_read_timeout         300s;
            chunked_transfer_encoding  on;
        }
    }
}
```

> **Important:** `proxy_buffering off` is critical for the SSE stream to reach the client character by character without nginx buffering the response.

---

## 11. Docker Compose

```yaml
# docker-compose.yml
version: "3.9"

services:
  proxy:
    build: ./nginx
    ports:
      - "443:443"
    depends_on:
      - api
      - ui
    networks:
      - app-network

  api:
    build: ./api
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

  ui:
    build: ./ui
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 12. Unit Tests

Tests cover `EncoderService` in isolation, without spinning up the server.

```python
# tests/test_encoder_service.py
import pytest
from app.services.encoder_service import EncoderService

service = EncoderService()

class TestEncodeToBase64:
    def test_hello_world(self):
        assert service.encode_to_base64("Hello, World!") == "SGVsbG8sIFdvcmxkIQ=="

    def test_empty_string(self):
        assert service.encode_to_base64("") == ""

    def test_unicode(self):
        result = service.encode_to_base64("Héllo")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_special_characters(self):
        result = service.encode_to_base64("!@#$%^&*()")
        assert isinstance(result, str)

class TestStreamChars:
    @pytest.mark.asyncio
    async def test_streams_all_characters(self, monkeypatch):
        monkeypatch.setattr("asyncio.sleep", lambda _: __import__("asyncio").coroutine(lambda: None)())
        chars = []
        async for char in service.stream_chars("Hi"):
            chars.append(char)
        expected = list(service.encode_to_base64("Hi"))
        assert chars == expected

    @pytest.mark.asyncio
    async def test_stream_empty_string(self, monkeypatch):
        monkeypatch.setattr("asyncio.sleep", lambda _: __import__("asyncio").coroutine(lambda: None)())
        chars = []
        async for char in service.stream_chars(""):
            chars.append(char)
        assert chars == []
```

Run tests with coverage:
```bash
pytest tests/ --cov=app --cov-report=term-missing
```

---

## 13. Non-Functional Requirements

| Category        | Requirement                                                                  |
|-----------------|------------------------------------------------------------------------------|
| Performance     | The first character must reach the client in under 6 seconds.               |
| Availability    | All three containers must restart automatically (`restart: always`).         |
| Security        | All communication over HTTPS; basic auth credentials kept out of the repo.  |
| Maintainability | Test coverage ≥ 80% in `app/services/`.                                     |
| Compatibility   | Chrome 120+, Firefox 120+, Safari 17+.                                      |
| Scalability     | Stateless design: the API can scale horizontally without changes.            |

---

## 14. Environment Variables

| Variable            | Service | Description                          | Default value           |
|---------------------|---------|--------------------------------------|-------------------------|
| `PYTHONUNBUFFERED`  | api     | Disables stdout buffering            | `1`                     |
| `VITE_API_BASE_URL` | ui      | API base URL (dev)                   | `http://localhost:8000` |
| `NGINX_BASIC_USER`  | proxy   | Basic auth username                  | — (required)            |
| `NGINX_BASIC_PASS`  | proxy   | Basic auth password                  | — (required)            |

---

## 15. Acceptance Criteria

- [ ] The user can enter text and receive its Base64 encoding.
- [ ] Characters appear in the result field one by one, in real time.
- [ ] The user can cancel the process at any time.
- [ ] It is not possible to start a new request while a process is active.
- [ ] The application is accessible only with valid credentials (basic auth).
- [ ] All three containers start with a single `docker-compose up`.
- [ ] Unit tests pass with coverage ≥ 80% in `app/services/`.
- [ ] `GET /api/health` returns `200 OK`.

---

## 16. Quick Start Guide

```bash
# 1. Clone the repository
git clone https://github.com/user/base64-streamer.git
cd base64-streamer

# 2. Generate basic auth credentials
htpasswd -c nginx/.htpasswd admin

# 3. Generate a self-signed SSL certificate (development)
mkdir nginx/certs
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/CN=localhost"

# 4. Start the containers
docker-compose up --build

# 5. Open the application
open https://localhost
```

---

*Document generated as a base specification. Update as the project evolves.*
