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

This repo uses `vercel-build` in `package.json` (`prisma generate && prisma migrate deploy && next build`). That requires:

- `DATABASE_URL` available at **build time** on Vercel (migrations run during the build).
- If your host requires a direct connection for DDL, configure `DIRECT_URL` in Prisma and set it in Vercel for builds.

## Security checklist

- Mark sensitive values as **encrypted** in Vercel (default for env vars).
- Do not prefix client-exposed variables with `NEXT_PUBLIC_` for secrets (this app does not need `NEXT_PUBLIC_` for auth or DB).
- Never log `DATABASE_URL` or `JWT_SECRET`.
- Use a distinct `JWT_SECRET` per environment (production vs preview).

## Verifying after deploy

- Confirm the deployment build log shows `prisma migrate deploy` succeeding.
- Hit `/` and a protected route after login to confirm DB connectivity and auth cookies (`Secure` on production).

## Troubleshooting: P3005 (schema is not empty)

If the build fails with **P3005** during `prisma migrate deploy`, the database already has tables but Prisma has no migration history. You must **baseline** once (mark migrations as applied without running SQL). See [prisma-baseline-existing-database.md](./prisma-baseline-existing-database.md) and run:

`npm run db:baseline:mark-all-applied`

Use the same database URL Vercel uses for production (direct URL recommended on Neon for CLI if the pooler causes issues).
