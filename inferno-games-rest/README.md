# inferno-games-rest

[![Tests](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml/badge.svg)](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml)
[![Image](https://img.shields.io/docker/v/infernokun/inferno-games-rest?label=docker)](https://hub.docker.com/r/infernokun/inferno-games-rest)

REST API for [Inferno Games](../README.md). Owns the game library, talks to IGDB
and Steam, and keeps both cached in Redis.

Part of a monorepo. Clone the whole thing:

```bash
git clone https://github.com/InfernoKunCodes/InfernoGames.git
cd InfernoGames/inferno-games-rest
```

## Running it

Postgres and Redis have to exist first:

```bash
docker compose -f ../inferno-games-dev/docker-compose.yml up -d
URL_PREFIX=inferno-games-rest ./gradlew bootRun
```

> `URL_PREFIX` is not optional. `application.yml` sets
> `server.servlet.contextPath: /${URL_PREFIX}` with no default, so the placeholder
> has nothing to resolve against when it is unset. The image sets the same context
> path from its `PROJECT` build arg instead.

With the prefix above:

| Endpoint | URL |
| --- | --- |
| API | http://localhost:8080/inferno-games-rest/api |
| Swagger UI | http://localhost:8080/inferno-games-rest/swagger-ui.html |
| Actuator | http://localhost:8080/inferno-games-rest/actuator |

That matches the `restUrl` already in
`../inferno-games-web/src/assets/environment/app.config.json`, so the web app
talks to it without further configuration.

Connection settings come from the environment. Defaults and the full list are in
the [root README](../README.md#environment-variables).

## Layout

| Package | Contents |
| --- | --- |
| `controllers` | `GameController` (everything under `/api/games`), `VersionController`, `InfernoGamesRestController` |
| `services` | `GameService`, `IGDBService`, `SteamService`, `SteamSyncScheduler` |
| `repositories` | `GameRepository`, a single `JpaRepository<Game, Long>` |
| `models` | `Game` and its converters. A flat entity, no `@OneToMany` |
| `config` | `RedisConfig` (caching), plus the rest of the wiring |
| `utils` | Text cleaning, list converters, the execution-time aspect |

## API

Everything hangs off `/api/games`, plus `/api/version`.

**Library**

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/games` | Whole library, title-ordered |
| `GET` | `/api/games/{id}` | |
| `POST` | `/api/games` | |
| `PUT` | `/api/games/{id}` | |
| `DELETE` | `/api/games/{id}` | |
| `POST` | `/api/games/{id}/status` | Set play status |
| `POST` | `/api/games/{id}/favorite` | Toggle favorite |
| `POST` | `/api/games/{id}/dlc` | Toggle DLC flag |

**Queries**

`GET /api/games/search`, `/search/advanced`, `/status/{status}`,
`/platform/{platform}`, `/favorites`, `/dlc`, `/recent`, `/completed`, `/stats`.

> These return full lists, not pages.

**IGDB**

`GET /api/games/igdb/search`, `/igdb/{igdbId}`, `/igdb/popular`, `/igdb/recent`,
`/igdb/upcoming`. Writes: `POST /api/games/igdb/import/{igdbId}`,
`/{id}/igdb/refresh`, `/igdb/refresh-genres`.

**Steam**

`GET /api/games/steam/status`, `/steam/user`, `/steam/library`,
`/steam/library/with-genres`, `/steam/library/genre-status`,
`/steam/library/stats`, `/steam/search`, `/steam/recent`, `/steam/most-played`,
`/steam/check/{appId}`. Writes: `POST /steam/refresh`, `/{id}/steam/sync`,
`/steam/sync-all`, `/steam/validate-platforms`, `/steam/migrate`,
`/steam/library/refresh-genres`.

**Maintenance**

`DELETE /api/games/cache` clears the caches below.

## Caching

`@EnableCaching` over Redis, wired in `config/RedisConfig.java`. The profile is
`@Profile("!test")`, so tests boot against H2 with no Redis.

| Cache | TTL | Key prefix |
| --- | --- | --- |
| `games` | 1 hour | `games:list:` |
| `game` | 1 hour | `games:detail:` |
| `gameStats` | 10 minutes | `games:stats:` |
| `igdbGame` | 7 days | `igdb:game:` |
| `igdbSearch` | 6 hours | `igdb:search:` |
| `steamOwnedGames` | 30 minutes | `steam:owned:` |
| `steamUserProfile` | 15 minutes | `steam:profile:` |

TTLs track how fast the source moves. IGDB metadata is effectively immutable;
Steam persona state changes constantly. Writes evict explicitly, so the TTLs are
a backstop rather than the primary invalidation.

## Scheduled work

`SteamSyncScheduler` runs two jobs:

| Cadence | Job |
| --- | --- |
| Every 6 hours, 1 minute after boot | Sync the Steam library |
| Every 24 hours, 30 seconds after boot | Enrich genres |

> `GameService.refreshAllGenresFromIGDB()` calls IGDB once per game with a 250 ms
> sleep between calls, to stay inside the rate limit. It is sequential and
> blocking by design, so it takes as long as the library is large.

## Versioning

The version is not declared in `build.gradle`. It is read from `package.json` at
build time and injected into `application.yml` by the `injectVersionIntoProperties`
task, then served from `/api/version`. Bump it in `package.json`.

## Tests

```bash
./gradlew test jacocoTestReport
```

295 tests. JaCoCo gates instruction coverage at 60% and currently reports 65.4%,
measured over the code that is not wiring: `InfernoGamesRestApplication`,
`config`, `models`, `repositories`, `exceptions` and `logger` are excluded.

H2 stands in for Postgres. `RedisConfig` is disabled under the test profile, so
no Redis is needed.

## Image

Multi-stage: `gradle:jdk25-corretto` compiles, `eclipse-temurin:25-jre-alpine`
runs it under `tini` as a non-root user.

```bash
npm run docker:build      # build and push to Docker Hub
```

> The build needs `PROJECT` and `PORT` build args. `PROJECT` names the jar that
> gets copied out of the compile stage, so a build without it fails.
> `--chown` in the linked `COPY` layers uses numeric `1000:1000`, because
> `--link` builds those layers independently of the base where the `java` user is
> created and a name cannot be resolved there.
