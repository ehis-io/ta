# Creator Card Microservice — Solution Notes

A REST API for publishing shareable "link-in-bio + rate card" creator profiles,
built on the provided R17 backend scaffold (Express + Mongoose + the VSL validator).

## Endpoints (rooted at the base URL — no versioning, no auth)

| Method | Path                       | Purpose                          |
| ------ | -------------------------- | -------------------------------- |
| POST   | `/creator-cards`           | Create a creator card            |
| GET    | `/creator-cards/:slug`     | Public retrieval by slug         |
| DELETE | `/creator-cards/:slug`     | Soft-delete a card by slug       |

## Where the code lives (follows the template layout)

```
models/creator-card.js                         # Mongoose model (ULID _id, paranoid soft-delete)
repository/creator-card/index.js               # repositoryFactory('CreatorCard')
messages/creator-card.js                       # human-readable error messages
services/creator-card/create-creator-card.js   # POST business logic + validation
services/creator-card/get-creator-card.js      # GET access-control rules
services/creator-card/delete-creator-card.js   # DELETE soft-delete logic
services/creator-card/card-error-codes.js      # business-rule code constants (SL02, AC01, ...)
services/utils/serialize-creator-card.js       # _id -> id, hides access_code, deleted 0 -> null
services/utils/creator-card-helpers.js         # slug generation + charset/format checks
endpoints/creator-cards/*.js                   # thin HTTP handlers, registered in app.js
```

## Validation strategy

- **Field-level** validation (types, required, lengths, enums) is done by the
  template's **VSL** validator and returns **HTTP 400**.
- Rules the DSL cannot express are enforced in the service and also return 400:
  slug character set, `access_code` being exactly 6 alphanumerics, link URLs
  starting with `http://`/`https://`, and rate `amount` being a positive integer.
- **Business rules** carry the custom codes below via `throwAppError(message, code)`.

| Rule | Code | HTTP |
| ---- | ---- | ---- |
| Slug already taken | `SL02` | 400 |
| `access_code` required on private card | `AC01` | 400 |
| `access_code` not allowed on public card | `AC05` | 400 |
| Card not found / deleted | `NF01` | 404 |
| Card exists but is a draft | `NF02` | 404 |
| Private card, access code required | `AC03` | 403 |
| Private card, invalid access code | `AC04` | 403 |

Retrieval applies `NF01 → NF02 → AC03 → AC04 → 200` in that exact order.

## Serialization

`_id` is stored per Mongo convention but **always serialized as `id`**. `access_code`
is returned by create/delete (the creator needs it) but **never** by the public
retrieval endpoint. The paranoid `deleted` sentinel (`0`) is normalized to `null`.

## Soft delete & slug reuse

The model uses the framework's `paranoid: true` mode: deletes stamp `deleted` with
a timestamp and mangle the unique `slug` so it is freed for reuse, while all reads
exclude deleted documents. Slug uniqueness therefore holds across **non-deleted**
cards (a deleted card's slug can be reused).

## Two intentional core extensions

The shipped scaffold could not emit the spec-mandated machine-readable `code`
field on error responses, so two small, well-scoped changes were made:

1. `core/errors/constants.js` — registered the seven business codes in
   `ERROR_STATUS_CODE_MAPPING` so each maps to the correct HTTP status.
2. `core/express/server.js` — the error handler now copies `error.errorCode`
   onto the response body as `code` (only for application errors).

Both complete the framework's existing error contract; no behavior changed for
any other error path.

## Running locally

```bash
npm install                       # local @app/* deps are symlinked via .npmrc
# set MONGODB_URI in .env (e.g. mongodb://127.0.0.1:27017/creator_cards)
node bootstrap.js                 # starts on PORT (default 3000)
```

## Deployment (Render)

`render.yaml` defines a Node web service: build `npm install`, start
`node bootstrap.js`. Set `MONGODB_URI` (MongoDB Atlas free tier) as a secret
env var in the dashboard. No other secrets are required — Redis/queue is
optional and disabled when `REDIS_URL` is unset.
