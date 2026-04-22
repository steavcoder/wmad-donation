# Vercel environment variables

This project expects secrets and database configuration to be set in the Vercel dashboard, not committed to the repository.

## Where to configure

1. Open your project on [Vercel](https://vercel.com).
2. Go to **Settings** → **Environment Variables**.
3. Add each variable for the environments where it applies (**Production**, **Preview**, **Development**).

Use the same names as in `.env.example`. Preview deployments should use a **separate database** or isolated schema when possible so tests do not touch production data.

## Required variables

| Name | Description |
|------|-------------|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma at runtime. For serverless, use a **pooled** URL (PgBouncer / pooler port) to avoid exhausting connections. |
| `JWT_SECRET` | Secret key for signing session JWTs stored in HTTP-only cookies. Must be long and random; rotate by invalidating all sessions if compromised. |

## Optional variables

| Name | When to use |
|------|-------------|
| `DIRECT_URL` | If you add `directUrl = env("DIRECT_URL")` to `schema.prisma`, use a **non-pooled** URL for `prisma migrate` while keeping `DATABASE_URL` pooled for the app. |

`NODE_ENV` is set automatically by Vercel (`production` in deployed builds). You normally do not set it manually.

## Build command and migrations

Vercel uses the default Next.js **build** command (`next build`). `prisma generate` runs in **`postinstall`** after `npm install`. **Migrations are not part of the Vercel build** so deploys stay reliable (Neon poolers and existing non-empty databases often break `migrate deploy` in CI).

Apply schema changes to production yourself, from a trusted machine or CI job, **before or after** you deploy app code:

```bash
npx prisma migrate deploy
```

Use your production `DATABASE_URL` (on Neon, prefer the **direct** connection string for DDL if the pooler errors). Optional local/CI script that runs migrations then build: `npm run build:with-migrate`.

**New environment:** run `npx prisma migrate deploy` once against the empty database, then deploy. **Existing database (P3005):** baseline first — see [prisma-baseline-existing-database.md](./prisma-baseline-existing-database.md).

## Security checklist

- Mark sensitive values as **encrypted** in Vercel (default for env vars).
- Do not prefix client-exposed variables with `NEXT_PUBLIC_` for secrets (this app does not need `NEXT_PUBLIC_` for auth or DB).
- Never log `DATABASE_URL` or `JWT_SECRET`.
- Use a distinct `JWT_SECRET` per environment (production vs preview).

## Verifying after deploy

- Confirm the build log finishes `next build` without errors.
- After you change the schema, confirm you ran `npx prisma migrate deploy` against the same database the deployment uses.
- Hit `/` and a protected route after login to confirm DB connectivity and auth cookies (`Secure` on production).

## Troubleshooting: P3005 (schema is not empty)

If **`npx prisma migrate deploy`** (run locally or in CI) fails with **P3005**, the database already has tables but Prisma has no migration history. Baseline once — see [prisma-baseline-existing-database.md](./prisma-baseline-existing-database.md) and run `npm run db:baseline:mark-all-applied` against production (Neon **direct** URL recommended for CLI).
