# Chakula API

Food recommendation REST API built with Node.js, Express, PostgreSQL, and Redis.

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required for running without Docker |
| PostgreSQL | 14+ | External instance required (not bundled in local Docker setup) |
| Redis | 7+ | Bundled in Docker local setup; install locally otherwise |
| Docker + Docker Compose | latest | Required for Docker setup only |

---

## Environment Variables

Copy `sample.env` to create your env file and fill in the values.

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `PORT` | Port the API listens on | `3000` |
| `POSTGRES_HOST` | Postgres host | `192.168.100.46` |
| `POSTGRES_PORT` | Postgres port | `5432` |
| `POSTGRES_USER` | Postgres user | `chakula` |
| `POSTGRES_PASSWORD` | Postgres password | `chakula` |
| `POSTGRES_DB` | Postgres database name | `chakula` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (omit if none) | — |
| `JWT_ACCESS_SECRET` | 64-char hex secret for access tokens | — |
| `JWT_REFRESH_SECRET` | 64-char hex secret for refresh tokens | — |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `120m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `200` |
| `KNOWLEDGE_BASE_URL` | Food knowledge base service URL | `http://192.168.100.46:8000` |
| `KNOWLEDGE_BASE_API_KEY` | API key for knowledge base | — |
| `S3_AWS_ACCESS_KEY_ID` | AWS access key (S3 + Rekognition) | — |
| `S3_AWS_SECRET_ACCESS_KEY` | AWS secret key (S3 + Rekognition) | — |
| `S3_AWS_REGION` | AWS region for S3 | `ap-south-1` |
| `S3_BUCKET_NAME` | S3 bucket name | — |
| `SES_AWS_ACCESS_KEY_ID` | AWS access key for SES | — |
| `SES_AWS_SECRET_ACCESS_KEY` | AWS secret key for SES | — |
| `SES_REGION` | AWS region for SES | `ap-south-1` |
| `EMAIL_FROM` | Sender address for emails | — |

---

## Running with Docker (Local Development)

This setup spins up the API and Redis in containers. **PostgreSQL runs externally** (on your host machine or a remote server) — point `POSTGRES_HOST` to it.

### 1. Create `.env.local`

```bash
cp sample.env .env.local
```

Edit `.env.local`:

```env
NODE_ENV=development
PORT=3000

POSTGRES_HOST=192.168.100.46   # your Postgres host IP
POSTGRES_PORT=5432
POSTGRES_USER=chakula
POSTGRES_PASSWORD=chakula
POSTGRES_DB=chakula

REDIS_HOST=redis               # must match the Docker service name
REDIS_PORT=6379
# No REDIS_PASSWORD — Redis runs without auth in local Docker

JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>
JWT_ACCESS_EXPIRY=120m
JWT_REFRESH_EXPIRY=7d

KNOWLEDGE_BASE_URL=http://192.168.100.46:8000
KNOWLEDGE_BASE_API_KEY=<your-key>
```

> **Important:** `REDIS_HOST` must be `redis` (the Docker service name), not `localhost`.

### 2. Start containers

```bash
docker compose -f docker-compose-local.yml up --build
```

On first run (or after changing Redis config) wipe the old Redis volume first:

```bash
docker compose -f docker-compose-local.yml down -v
docker compose -f docker-compose-local.yml up --build
```

The entrypoint automatically:
1. Waits for Postgres to be ready
2. Runs database migrations
3. Starts the API in watch mode (hot reload on file changes)

### 3. Verify

```
GET http://localhost:3000/health
```

Expected response:
```json
{ "status": "ok", "uptime": 12.3 }
```

---

## Running without Docker (Bare Metal)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL

Ensure you have a running PostgreSQL instance (14+) and create the database and user:

```sql
CREATE USER chakula WITH PASSWORD 'chakula';
CREATE DATABASE chakula OWNER chakula;
```

### 3. Set up Redis

Install and start Redis locally. No password needed for development:

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis
```

### 4. Create `.env`

```bash
cp sample.env .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=chakula
POSTGRES_PASSWORD=chakula
POSTGRES_DB=chakula

REDIS_HOST=localhost
REDIS_PORT=6379
# No REDIS_PASSWORD for local Redis without auth

JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>
JWT_ACCESS_EXPIRY=120m
JWT_REFRESH_EXPIRY=7d

KNOWLEDGE_BASE_URL=http://127.0.0.1:8000
KNOWLEDGE_BASE_API_KEY=<your-key>
```

### 5. Run migrations

```bash
npm run migrate
```

### 6. Start the API

```bash
# Development (hot reload)
npm run dev

# Production (single process)
npm run start:single

# Production (clustered — one worker per CPU core)
npm start
```

---

## Database Migrations

Migrations run automatically on container startup. To run them manually:

```bash
npm run migrate
```

Migrations are idempotent — safe to re-run. They create all required tables and apply any additive column changes.

### Seed data (optional)

```bash
npm run seed
```

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check (Postgres + Redis) |
| POST | `/api/users/register` | None | Register a new user |
| POST | `/api/users/login` | None | Login, returns access + refresh tokens |
| POST | `/api/users/refresh` | None | Refresh access token |
| POST | `/api/users/logout` | Bearer | Logout (revokes refresh token) |
| GET | `/api/users/me` | Bearer | Get current user profile |
| PATCH | `/api/users/me` | Bearer | Update profile |
| GET | `/api/locations/regions` | Bearer | List food regions |
| GET | `/api/recommendations` | Bearer | Get personalised meal recommendations |
| GET | `/api/public/recommendations` | None | Public recommendations |
| GET | `/api/meal-history` | Bearer | Get meal history |
| POST | `/api/meal-history` | Bearer | Log a meal |

---

## Project Structure

```
chakula_api/
├── app.js                  # Express app entry point
├── cluster.js              # Clustered production entry point
├── core/
│   ├── config.js           # Centralised config (reads env vars)
│   ├── redis.js            # ioredis client
│   ├── logger.js           # Pino logger
│   ├── scheduler.js        # Daily recommendation scheduler
│   ├── auth/               # JWT helpers
│   ├── database/
│   │   ├── db.js           # pg pool
│   │   ├── migrate.js      # Migration script
│   │   └── seed.js         # Seed script
│   └── middleware/         # Auth, error handling, rate limiting
├── modules/
│   ├── users/
│   ├── locations/
│   ├── recommendations/
│   └── meal-history/
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development image
├── docker-compose.yml      # Production compose
├── docker-compose-local.yml # Local dev compose (API + Redis)
├── entrypoint.sh           # Production container entrypoint
├── entrypoint.dev.sh       # Dev container entrypoint (watch mode)
└── sample.env              # Environment variable template
```
