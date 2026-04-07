# Base64 Streaming Encoder

A real-time Base64 encoder web application that streams results character by character using Server-Sent Events (SSE).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688)

---

## Overview

This SPA converts text to Base64 with real-time streaming. The server processes the encoding and returns the resulting string one character at a time with random pauses (1-5 seconds per character), simulating a long-running job. Users can cancel the process at any time.

### Live Demo

- **Frontend:** https://encoder-ten.vercel.app
- **Backend:** https://encoder-production-ac4d.up.railway.app

---

## Features

- Real-time streaming of Base64 encoded characters
- Cancel encoding process at any time
- Retro-futuristic terminal UI with IBM Plex Mono font
- Server-Sent Events (SSE) for efficient streaming
- AbortController for client-side cancellation
- Block new requests while a process is active
- Client-side authentication (credentials displayed for demo)

---

## Architecture

```
Browser
   │
   ▼
┌─────────────────────────────────────┐
│          Vercel (Frontend)         │
│         React + Vite                │
└────────────────┬────────────────────┘
                 │ fetch + SSE
                 ▼
┌─────────────────────────────────────┐
│       Railway (Backend)            │
│         FastAPI                     │
│  - POST /api/encode                 │
│  - GET /api/health                  │
└─────────────────────────────────────┘
```

---

## API Specification

### POST /api/encode

Encodes text to Base64 and returns result as SSE stream.

**Request:**
```bash
curl -X POST https://encoder-production-ac4d.up.railway.app/api/encode \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, World!"}'
```

**Response:**
```
data: S
data: G
data: V
data: s
data: b
data: G
data: 8
data: =
data: [DONE]
```

**Validation:**
- `text` must not be empty
- Maximum length: 10,000 characters

---

### GET /api/health

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python 3.12) |
| Streaming | Server-Sent Events (SSE) |
| Authentication | Client-side login |
| Deployment | Vercel + Railway |

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (optional, for full stack)

### Frontend (React + Vite)

```bash
cd ui
npm install
npm run dev
```

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend (FastAPI)

```bash
cd api
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker (Full Stack)

```bash
# Generate credentials
htpasswd -c nginx/.htpasswd admin
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem -out nginx/certs/cert.pem \
  -subj "/CN=localhost"

# Start
docker-compose up --build
```

Visit `https://localhost` (basic auth: admin/admin)

---

## Credentials

### Production (Login Screen)
- **Username:** admin
- **Password:** encoder2026

Credentials are displayed on the login screen for easy access in the demo.

### Docker (Basic Auth)
- **Username:** admin
- **Password:** admin

---

## Deployment

### Railway (Backend)

1. Connect your GitHub repo to Railway
2. Select the `/api` folder as root
3. Add environment variable:
   - `PYTHONUNBUFFERED`: `1`
4. Deploy and note your URL

### Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Select the `/ui` folder as root
3. Add environment variable:
   - `VITE_API_BASE_URL`: `https://your-railway-app.railway.app`
4. Deploy

---

## Project Structure

```
encoder/
├── api/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── routers/        # API routes
│   │   ├── services/       # Business logic
│   │   └── schemas.py      # Pydantic models
│   ├── tests/              # Unit tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── ui/                     # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main component
│   │   ├── App.css         # Styling
│   │   └── hooks/          # Custom hooks
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── nginx/                  # Proxy (Docker mode)
│   ├── nginx.conf
│   ├── .htpasswd
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Unit Tests

```bash
cd api
pip install -r requirements.txt
pytest tests/ -v
```

---

## License

MIT