# Baseline Prisma migrations on an existing database (fix P3005 on Vercel)

If `prisma migrate deploy` fails with **P3005** (*The database schema is not empty*), the database was created or updated outside Prisma Migrate (for example `db push`, SQL in the console, or an older app), so there is no row in `_prisma_migrations` for your migration files.

`migrate deploy` will not apply the *first* migration to a non-empty database. You must **baseline**: tell Prisma that migrations were already applied, **without** running their SQL.

## Before you baseline

1. Confirm the **live schema matches** what your migrations would produce (tables, enums, columns). If something is missing, fix the DB first or add a new migration after baselining.
2. Use a connection string that can run Prisma CLI against this database. Neon: prefer the **direct** (non-pooler) URL for `migrate resolve` if the pooler errors on metadata DDL; many teams set `DATABASE_URL` (pooler) in the app and `DIRECT_URL` (direct) only in Prisma — see `.env.example` and [Prisma: baselining](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining).

## One-time baseline (this repo)

From the project root, with `DATABASE_URL` (or `DIRECT_URL` if configured in `schema.prisma`) pointing at the **same** database Vercel uses:

```bash
npm run db:baseline:mark-all-applied
```

That runs `prisma migrate resolve --applied <name>` for each migration **in chronological order**. It only updates `_prisma_migrations`; it does **not** re-run `migration.sql`.

## After baselining

1. Run `npx prisma migrate deploy` locally — it should report everything already applied (or apply only **new** migrations you add later).
2. Redeploy on Vercel — the platform runs `next build` only (no `migrate deploy`), so the build should pass if the app compiles.

## Alternative: empty database

If this is a throwaway DB with no data you need, you can **drop all objects** (or create a new Neon database), set `DATABASE_URL` to it, and run `npx prisma migrate deploy` once from your machine so migrations apply to a truly empty database. Then point Vercel at that database.

## Duplicate profile migrations

This repository includes two sequential migrations that both add `User.profileImage` and `User.major` (`20260421021500` and `20260421021821`). If you baseline, mark **both** as applied if your database already has those columns (the provided `db:baseline:mark-all-applied` script does that).
