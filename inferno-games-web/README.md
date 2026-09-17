# inferno-games-web

[![Tests](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml/badge.svg)](https://github.com/InfernoKunCodes/InfernoGames/actions/workflows/test.yml)
[![Image](https://img.shields.io/docker/v/infernokun/inferno-games-web?label=docker)](https://hub.docker.com/r/infernokun/inferno-games-web)

Angular front end for [Inferno Games](../README.md). Served by nginx in the
published image.

Part of a monorepo. Clone the whole thing:

```bash
git clone https://github.com/InfernoKunCodes/InfernoGames.git
cd InfernoGames/inferno-games-web
pnpm install
pnpm start          # http://localhost:4300
```

`pnpm start` expects the API on http://localhost:8080. See the
[rest README](../inferno-games-rest/README.md) for bringing that up.

> pnpm 11 is required and pinned through `packageManager`. Build scripts are
> allowlisted in `pnpm-workspace.yaml` under `allowBuilds`, a key pnpm 10 does not
> read; on pnpm 10 the install fails its pre-run check and takes `pnpm build`
> down with it.

## Scripts

| Command | Effect |
| --- | --- |
| `pnpm start` | Dev server on port 4300, bound to 0.0.0.0 |
| `pnpm build` | Development build |
| `pnpm build:prod` | Production build |
| `pnpm test` | Karma and Jasmine, watch mode |
| `pnpm test:headless` | Single headless run |
| `pnpm test:ci` | Headless, picks up a Playwright Chromium if `CHROME_BIN` is unset |
| `pnpm gen-version` | Regenerate `src/app/version.ts` from `package.json` |
| `pnpm docker:build` | Build both stages and push to Docker Hub |

Headless runs need a browser. Point `CHROME_BIN` at one:

```bash
CHROME_BIN=/usr/bin/chromium-browser pnpm test:headless
```

## Configuration

Runtime settings are not compiled in. `EnvironmentService` fetches
`assets/environment/app.config.json` from an app initializer before the first
route renders, and `restUrl` drives every API call.

> The initializer rejects when that file cannot be read, which surfaces the
> failure instead of leaving the app on a blank page.

## Architecture

Standalone throughout. There is no `AppModule`: `main.ts` calls
`bootstrapApplication`, and providers live in `app.config.ts`.

| Concern | Where |
| --- | --- |
| Providers, interceptors, initializer | `src/app/app.config.ts` |
| Routes | `src/app/app.routes.ts` |
| Services | `src/app/services/` |
| Feature components | `src/app/components/` |
| Shared Material imports | `src/app/material.module.ts` |

**Routing.** Every route is lazy. The seven feature components each build as
their own chunk, which keeps the initial bundle at roughly 1.16 MB raw against a
1.4 MB warning budget. A regression that makes a route eager trips the budget.

**State.** `ThemeService` holds theme state in a signal that components read
directly. `AppComponent` is `OnPush` and keeps its Steam state in signals, with
`computed` for derived values rather than template methods.

**Templates.** Built-in control flow only. No `*ngIf` or `*ngFor` remain, and
every `@for` declares a `track`.

**Interceptors.** `httpErrorInterceptor` logs a failed request and rethrows,
leaving each service's own fallback alone.

## Tests

97 specs covering the services, pipes, models, utils and `AppComponent`.

## Image

Multi-stage: `node:lts-bullseye` builds, `nginx:alpine` serves. The compile stage
copies `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `angular.json`,
the tsconfigs and `src/`.

> `pnpm-workspace.yaml` has to be in that list: it gates whether `pnpm install`
> succeeds inside the image.
