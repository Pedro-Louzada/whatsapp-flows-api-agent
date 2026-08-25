---
name: whatsapp-flows-api
description: Scaffold or extend a backend API that powers a WhatsApp Flow — encrypted request/response, screen navigation control, use-case-per-screen calling out to external system gateways. Use when the user mentions WhatsApp Flows, Flows endpoint, encrypted_flow_data, flow screens, or building an intermediary API for Meta Flows.
---

# WhatsApp Flows API

This skill scaffolds the recurring shape of a WhatsApp Flows backend: a single
encrypted POST endpoint, a screen-navigation orchestrator, one use case per
screen, and thin gateways to whatever external systems the flow depends on.
Reference implementation this was extracted from: `PrimeResults.Tato.Flows`
(NestJS + vitest + zod), later refined against a second implementation for
the env/logger/gateway wiring and faker-based test doubles below. Adapt the
framework specifics if the target project uses something else, but keep the
layering and the crypto logic identical.

## 0. Ask before scaffolding

Don't generate files from assumptions. Ask (a short back-and-forth, not a form):

1. **New API or adding a screen to an existing one?** Adding a screen skips
   most of this and only needs: a new entry in `ScreenAllowed`, a new use
   case, a new `case` in the orchestrator's switch, and wiring it into the
   module.
2. **Screen navigation map.** For each screen: its name, what triggers moving
   to it, what data it receives, and which screen(s) it can lead to next
   (including any error/fallback screen). This map becomes the `ScreenAllowed`
   union and the orchestrator's switch — get it right before writing code.
3. **External systems.** For each screen, what system(s) does its use case
   call — auth method (OAuth client-credentials, API key, mTLS?), and is a
   token shared across calls in one request (needs a request-scoped store,
   see `token-store` pattern) or refetched every time?
4. **Is this really just an intermediary?** Confirm no direct DB access is
   needed. If one screen genuinely needs a database, that's a deliberate
   exception — say so explicitly rather than defaulting to a repository
   layer nobody asked for.
5. **Stack check.** Default to NestJS + vitest + zod, `@nestjs/config` for env
   validation, `@nestjs/axios` for the gateway HTTP client, and
   `@faker-js/faker` (devDependency) for test data — unless told otherwise.

## 1. Layout

```
src/
  core/                          generic, injected everywhere, never customized per client
    either.ts                    Either<L, R> — domain code returns this, never throws
    types/optional.ts
    interfaces/
      logger.ts
      decrypter.ts               abstract class (Flow-shaped payload, but core-level like Logger — see step 2)
      encrypter.ts               abstract class (same reasoning)
  domain/application/            framework-agnostic business rules
    navigation/
      decrypted-body.ts          ScreenAllowed union + DecryptedBody — the nav map, single source of truth
      screen-data.ts
      encrypted-body.ts
      flows-screens-orchestrator.ts   dispatches screen -> use case
    use-cases/
      interfaces/use-case-response.ts   UseCaseResponse<T> — the shared { data, nextScreen } shape
      handle-health-check.ts + one per screen
    gateways/
      gateway.ts                 generic Gateway<TConfig> HTTP contract (get/post)
      errors/gateway-request-error.ts
      <system>/<system>-gateway.ts   one abstract class per external system
    errors/
  infra/                         framework + concrete implementations
    env/
      env.ts                     zod schema
      env.service.ts             typed wrapper over ConfigService
      env.module.ts               @Global(), ConfigModule.forRoot({ validate: envSchema.parse })
    logger/
      custom-logger.service.ts   ConsoleLogger subclass, log levels switched by NODE_ENV
      logger.module.ts           @Global(), binds Logger -> CustomLoggerService
    cryptography/
      meta-decrypter.ts, meta-encrypter.ts   Meta's algorithm — copy as-is
      cryptography.module.ts
    gateways/
      gateway.service.ts         the ONE concrete Gateway implementation (axios) — every system reuses this
      gateways.module.ts         binds Gateway -> GatewayService, plus one binding per system's gateway
      <system>/http-<system>-gateway.ts   implements the domain gateway, injects Gateway to make calls
    http/
      controllers/screens.controller.ts        single encrypted POST endpoint
      controllers/health-check.controller.ts   plain GET, for infra probes — separate from Meta's ping
      pipe/zod-validation-pipe.ts
    main.ts
  vitest.config.ts, vitest.config.e2e.ts
```

The `templates/` folder next to this file mirrors this layout, with import
paths already written for their **final** location (not the flat staging
folder) — copy files in, rename placeholders (`SCREEN_ONE`, `ExampleGateway`,
etc.) to match the answers from step 0, and remove commented-out example
wiring once real use cases exist.

**Path aliases — always, no long relative chains.** `tsconfig.json` must
define:

```json
"paths": {
  "@/*": ["./src/*"],
  "@test/*": ["./test/*"]
}
```

Use `@/...` for anything reaching `core`, crossing from `infra` to `domain`
(or vice versa), or jumping into a distant sibling subfolder (e.g.
`infra/env` from `infra/http`). Use `@test/...` the same way from test files.
Reserve relative imports (`./`, `../`) for true neighbors — same folder, or
one level up within the same feature slice (a controller importing its own
pipe, a use case importing a sibling error type). Never write a relative
chain longer than one `../../` — that's a sign you're crossing modules and
should use the alias instead. `vitest.config.ts` needs
`resolve: { tsconfigPaths: true }` (see `templates/vitest.config.ts`) or the
aliases won't resolve in tests.

## 2. Crypto — don't reinvent it

`templates/cryptography/meta-decrypter.ts` and `meta-encrypter.ts` implement
Meta's published WhatsApp Flows spec exactly:
- Decrypt `encrypted_aes_key` with RSA-OAEP (SHA-256) using the flow's private
  key → get the AES key.
- Decrypt `encrypted_flow_data` with AES-128-GCM using that key + the request
  IV (last 16 bytes of the ciphertext are the auth tag).
- Encrypt the response with the **same AES key** but the IV **bit-flipped**
  (Meta's requirement, not a bug).

This is fixed by Meta, identical across every client project. Copy the two
files verbatim; only the `ScreenDataResponse`/`DecryptedBody` types they
reference change per project. The abstract `Encrypter`/`Decrypter` classes
live in `core/interfaces/` (not `domain/application/`) — treat them like
`Logger`: injected broadly, never customized per client, even though their
method signatures carry Flow-shaped types. Method names are `encrypt`/
`decrypt` (not `encript`/`decript` — a typo that crept into one past project;
don't repeat it).
Needs `PRIVATE_PEM` and `PUBLIC_PEM` in env — `PUBLIC_PEM` is what gets
uploaded to the Meta Business Manager Flow's encryption settings.

## 3. Screen navigation control

`decrypted-body.ts`'s `ScreenAllowed` union is the single source of truth for
"what screens exist." The orchestrator (`flows-screens-orchestrator.ts`)
is the *only* place that maps a screen name to a use case — never let a
controller or a use case make that decision, or the navigation map stops
being discoverable in one place.

The orchestrator special-cases Meta's `action: 'ping'` health-check before
touching the screen switch — always handle that first. Separately, **always
also** scaffold a plain `GET /health-check` REST controller
(`templates/http/health-check.controller.ts`, returning
`{ status, uptime, timestamp }`) for infra-level uptime probes that don't
speak Meta's encrypted protocol. The two exist side by side, not as
alternatives to each other.

Adding a screen:
1. Add it to `ScreenAllowed`.
2. Create `handle-<screen>.ts` in `use-cases/`, based on
   `templates/use-cases/handle-screen-example.ts` — takes `decryptedBody.data`,
   returns `Either<Error, UseCaseResponse<T>>`.
3. Add a `case` in the orchestrator's switch, inject the new use case.
4. Wire the use case into the module providing the orchestrator.
5. Add a fake for anything the use case depends on and a test asserting the
   orchestrator dispatches that screen correctly (see step 5).

## 4. Use cases and gateways

Each screen's use case is the business logic for that step: call whatever
gateway(s) the external system requires, decide the next screen, return
`Either<Error, UseCaseResponse<T>>` — `UseCaseResponse<T>`
(`use-cases/interfaces/use-case-response.ts`) is `{ data?: T; nextScreen?:
ScreenAllowed }`, the shared shape every use case returns. Don't invent a
one-off response type per use case. No direct DB access unless step 0
flagged an explicit exception.

**Gateways follow a two-tier pattern — one shared HTTP implementation, many
thin domain wrappers:**
- `domain/application/gateways/gateway.ts` — a generic `Gateway<TConfig>`
  contract (`get`/`post`).
- `infra/gateways/gateway.service.ts` — `GatewayService`, the **one** concrete
  implementation, wrapping `@nestjs/axios`'s `HttpService`. HTTP error
  handling (mapping axios errors to `GatewayRequestError`, with a `status`)
  lives here once, not per system.
- One abstract class per external system (e.g. `AddressGateway`) in
  `domain/application/gateways/<system>/`, with its concrete implementation
  in `infra/gateways/<system>/` — this one **injects `Gateway`** (bound to
  `GatewayService`) to make calls, and only translates the raw response into
  that system's domain shape. It never talks to axios directly or
  reimplements HTTP handling.
- `gateways.module.ts` wires all of it: binds `Gateway` to `GatewayService`,
  and binds every per-system abstract class to its concrete implementation.
  See `templates/gateways/gateways.module.ts` and the `example/` gateway
  pair for the full shape.

Gateway failures surface as `GatewayRequestError`
(`domain/application/gateways/errors/gateway-request-error.ts`, extends
`Error`, carries `status: number`, sets `this.name`). Whether a use case
propagates that as `Left` or swallows it into a soft-fail (log it, still
return `Right` with fallback `data` / a fallback `nextScreen`) is a per-screen
decision — most Flows screens choose the soft-fail so a gateway hiccup
doesn't break the user's navigation. Either way, the use case's public
contract stays `Either` — that's the default for every use case and gateway,
never a thrown exception or a bare `Promise`.

## 5. Tests

vitest, no mocking framework — test doubles implementing the same abstract
class, under `test/`. Install `@faker-js/faker` as a devDependency.

- `test/cryptography/fake-decrypter.ts` / `fake-encrypter.ts` — named `Fake*`
  (not `Faker*`): nothing to randomize here, they just flip fixed flags
  (`shouldFail`, `isPingRequest`, `screen`, `data`).
- `test/gateways/faker-<system>-gateway.ts` — named `Faker*`: generates
  realistic values with the `faker` library (e.g. `faker.location.zipCode()`,
  `faker.person.fullName()`), with `shouldFail` / `shouldReturnEmpty` /
  `override` flags to drive edge cases without hand-writing every field. See
  `templates/test/faker-example-gateway.ts`.
- `test/logger/faker-logger.ts` — `FakerLogger`, silent no-op, always safe to
  reuse (naming stays `Faker*` for consistency with its neighbors even though
  it has nothing to fake).

Always test: the orchestrator dispatches each screen to the right use case,
rejects an unknown screen (`InvalidScreenNameError`), handles a ping, and
surfaces a decrypt failure. Test each use case's branches (gateway failure →
fallback screen, success → next screen) against its fakes.

## 6. Env

zod schema (`templates/env/env.ts`) validated at startup via
`env.module.ts`'s `ConfigModule.forRoot({ validate: envSchema.parse, isGlobal:
true })` — fail fast on missing secrets rather than discovering it at request
time. `EnvModule` and `LoggerModule` are both `@Global()` — provide
`EnvService` / `Logger` once, inject them anywhere without re-importing.
`CustomLoggerService` (`infra/logger/custom-logger.service.ts`) extends
Nest's `ConsoleLogger`, is `Scope.TRANSIENT` (so `setContext()` per class
doesn't leak between injections), and switches its `LogLevel[]` on
`NODE_ENV` (`production`/`staging` → `log, error, warn`; everything else →
all five levels including `debug`/`verbose`).

One `<SYSTEM>_BASE_URL` (+ whatever credentials that system's auth needs) per
gateway, plus `PRIVATE_PEM`, `PUBLIC_PEM`, `NODE_ENV`, `VERSION_FLOWS_API`.
