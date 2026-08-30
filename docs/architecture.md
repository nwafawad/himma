# Himma architecture

Himma is an npm-workspace monorepo with three dependency layers:

```text
frontend ─┐
          ├──> @himma/contracts
backend ──┘
```

`@himma/contracts` contains HTTP transport schemas and inferred TypeScript
types. It must not import frontend code, Express, or Prisma. Database models
remain private to the backend.

## Frontend boundaries

- `app/` owns routing and layouts. Route files should remain thin.
- `features/<domain>/` owns domain components, API functions, hooks, and view
  models.
- `components/ui/` is reserved for reusable, domain-neutral UI primitives.
- `(public)` and `(authenticated)` route groups select their own shell without
  changing public URLs.
- Feature API functions parse unknown responses with schemas from
  `@himma/contracts` before returning data to components.

## Backend boundaries

- `modules/<domain>/` colocates routes, controllers, and business services.
- Controllers translate HTTP requests and responses; services own business
  behavior and persistence orchestration.
- `infrastructure/` contains replaceable implementations such as database and
  upload storage.
- `middleware/` contains cross-cutting Express behavior.
- `jobs/` owns background scheduling and delegates domain behavior to modules.
- Cross-domain HTTP composition belongs in `routes/index.ts`; new domain code
  should use the module layout.

## API compatibility

`/api/v1` is canonical. `/api` and singular `/activity` remain temporary
compatibility routes and advertise a successor through response headers. New
clients must not depend on the compatibility paths.

## Upload storage

HTTP upload routes depend on the `UploadStorage` interface. Development uses
the local adapter. A production deployment using that adapter must set
`UPLOAD_DIR` to a persistent mounted path; an object-storage adapter can replace
it without changing routes.

## Verification

Run `npm run verify` from the repository root. It executes workspace tests,
typechecks every workspace, builds contracts and backend code, and performs the
Next.js production build.
