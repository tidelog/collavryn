# Collavryn Deployment Guide

## Status

Collavryn is a Next.js application backed by PostgreSQL and Prisma.

GitHub Actions validates the application on pushes to main and
on pull requests.

This repository does not automatically deploy to production.

## Requirements

- Node.js 24
- PostgreSQL
- A hosting provider capable of running Next.js
- A production database connection
- A strong Auth.js authentication secret

## Required environment variables

- DATABASE_URL: PostgreSQL connection string
- AUTH_SECRET: Strong secret used by Auth.js

The production environment may require further values depending
on the hosting provider and authentication configuration.

Never commit production credentials or local .env files.

## Production environment validation

Set production environment variables using your hosting
provider's secret management system.

Then run:

    node scripts/check-production-env.mjs

This checks presence and basic structure. It does not verify
that the database can be reached.

## Database migrations

The migration files in prisma/migrations must be committed.

On a fresh production database:

    npx prisma migrate deploy

Do not use `prisma migrate dev` against production.

Back up the production database before migrations that change
or remove existing data.

Never use `prisma migrate reset` against production.

## Build and start

    npm ci
    npx prisma generate
    npm run build
    npm run start

The hosting provider may handle installation, builds, and
process startup automatically.

## CI verification

The GitHub Actions workflow runs:

1. Dependency installation
2. Prisma client generation
3. Prisma schema validation
4. PostgreSQL migration deployment
5. TypeScript and ESLint
6. Unit tests
7. Chromium end-to-end tests
8. Production build
9. Production dependency security audit

The CI PostgreSQL database and authentication secret are
temporary test-only resources.

## Release checklist

- Confirm GitHub Actions succeeds on main.
- Review unresolved development-dependency advisories.
- Configure a managed production PostgreSQL database.
- Configure production authentication secrets.
- Verify the host-specific environment requirements.
- Apply production database migrations.
- Deploy the application.
- Test registration, login, workspaces, projects, and tasks
  against the deployed environment.
- Verify access restrictions using separate test accounts.
- Enable database backups and application monitoring.

## Rollback

For an application-only failure, redeploy the previous known
good application version.

Database migrations require a migration-specific rollback
plan and a verified backup. Reverting application code does
not automatically reverse schema changes.
