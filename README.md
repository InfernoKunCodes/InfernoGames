# Inferno Games

[![Tests](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml/badge.svg)](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml)
[![Docker](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/docker.yml/badge.svg)](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/docker.yml)
[![Web Image](https://img.shields.io/docker/v/infernokun/inferno-games-web?label=web%20image)](https://hub.docker.com/r/infernokun/inferno-games-web)
[![Rest Image](https://img.shields.io/docker/v/infernokun/inferno-games-rest?label=rest%20image)](https://hub.docker.com/r/infernokun/inferno-games-rest)

A self-hosted game library. It tracks what you own, what you are playing and what
you have finished, enriches entries from [IGDB](https://www.igdb.com/) and syncs
playtime and ownership from Steam.

## Services

| Directory | Stack | Role |
| --- | --- | --- |
| [inferno-games-web](inferno-games-web) | Angular 21, Angular Material, pnpm | Browser UI, served by nginx in the published image |
| [inferno-games-rest](inferno-games-rest) | Spring Boot 3.5, Java 25, Gradle | REST API, IGDB and Steam integration, scheduled sync |
| [inferno-games-dev](inferno-games-dev) | Docker Compose | Postgres and Redis only, for running the two services from source |

Backing services are Postgres 17.4 and Redis. Redis is a cache; losing it costs
nothing but a repopulate.

## Quick start

The published images are pulled, not built:

```bash
docker compose up -d
```

| Service | URL |
| --- | --- |
| Web | http://localhost:8710 |
| REST | http://localhost:8711/inferno-games-rest/api |
| Swagger UI | http://localhost:8711/inferno-games-rest/swagger-ui.html |

> The API sits behind a context path. The image sets it from the `PROJECT` build
> arg, so it is `/inferno-games-rest` for the published image.

> IGDB and Steam credentials are not required to boot. Without them the app runs,
> but the IGDB and Steam endpoints return errors and the scheduled sync does
> nothing useful.

## Development setup

Bring up only the backing services, then run each app from source:

```bash
docker compose -f inferno-games-dev/docker-compose.yml up -d   # postgres:5432, redis:6379

pnpm --dir inferno-games-web install
pnpm --dir inferno-games-web start                             # http://localhost:4300

cd inferno-games-rest && URL_PREFIX=inferno-games-rest ./gradlew bootRun
```

`URL_PREFIX` sets the API context path and has no default. See the
[rest README](inferno-games-rest/README.md#running-it).

Root scripts wrap both services:

| Command | Effect |
| --- | --- |
| `npm run start:web` / `npm run start:rest` | Run one service from source |
| `npm run build:web` / `npm run build:rest` | Production build |
| `npm run test:web` / `npm run test:rest` | Run one test suite |
| `npm run docker:build-web` / `npm run docker:build-rest` | Build and push an image to Docker Hub |

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node | 24 | |
| pnpm | 11 | Pinned via `packageManager`. pnpm 10 does not understand `allowBuilds` in `pnpm-workspace.yaml` and will fail the install |
| Java | 25 | Override with `JAVA_TOOLCHAIN_VERSION` |
| Docker | with Buildx | Both Dockerfiles are multi-stage |
| Chrome or Chromium | | Web tests only. Point `CHROME_BIN` at it |

## Architecture

```
                 browser
                    |
        +-----------+-----------+
        |  inferno-games-web    |   nginx, Angular, service worker
        |  :8710 -> :80         |
        +-----------+-----------+
                    | /api
        +-----------+-----------+
        |  inferno-games-rest   |   Spring Boot
        |  :8711 -> :8080       |
        +--+-----------------+--+
           |                 |
     +-----+----+      +-----+----+          +---------------+
     | postgres |      |  redis   |          | IGDB, Steam   |
     |  17.4    |      |  cache   |          | external apis |
     +----------+      +----------+          +---------------+
```

The REST service reads IGDB and Steam through Redis-backed caches, so a cold
cache is the only time an external API is hit on a read path. See
[inferno-games-rest/README.md](inferno-games-rest/README.md#caching) for the TTLs.

## Environment variables

Read by `inferno-games-rest` through [docker-compose.yml](docker-compose.yml).

| Variable | Default | Purpose |
| --- | --- | --- |
| `IGDB_CLIENT_ID` | none | IGDB credentials. Without them the IGDB endpoints fail |
| `IGDB_CLIENT_SECRET` | none | |
| `STEAM_CLIENT_ID` | none | Steam credentials. Without them the Steam endpoints fail |
| `STEAM_CLIENT_SECRET` | none | |
| `POSTGRES_DB` | `inferno-games` | Database name |
| `POSTGRES_USER` | `inferno-games` | |
| `POSTGRES_PASSWORD` | `inferno-games` | Change this outside local use |
| `POSTGRES_IP` | `inferno-games-db` | Host the API connects to |
| `DB_PORT` | `5432` | |
| `REDIS_HOST` | `inferno-games-redis` | |
| `REDIS_PORT` | `6379` | |
| `ENCRYPTION_KEY` | `secret_key` | Change this outside local use |
| `RSA_PRIVATE_KEY_PATH` | `/var/tmp/inferno-games/private.pem` | |
| `RSA_PUBLIC_KEY_PATH` | `/var/tmp/inferno-games/public.pem` | |
| `DOCKER_COMPOSE_PATH` | `/var/tmp/inferno-games` | Host path mounted into the API |

> The Postgres password and encryption key default to placeholder values so the
> stack boots unconfigured. Both are unsafe anywhere but a local machine.

## CI

Two systems, split by role.

| System | Runs | Scope |
| --- | --- | --- |
| GitHub Actions | pull requests and pushes to `main` | Tests for both services, plus a Docker build that verifies the Dockerfiles without pushing |
| GitLab, self-hosted | pushes to `main` | Tests, image build and push to Docker Hub, deploy to the stage server |

Both workflows are path-filtered, so a change under one service does not run the
other's suite, and both cancel superseded runs on the same ref.

> GitLab remains the only thing that publishes images or deploys.
> [.github/workflows/docker.yml](.github/workflows/docker.yml) never logs in to a
> registry.

| Suite | Count | Coverage |
| --- | --- | --- |
| `inferno-games-rest` | 295 | 65.4% instruction, gated at 60% by JaCoCo |
| `inferno-games-web` | 97 | Services, pipes, models, utils and the root component |
