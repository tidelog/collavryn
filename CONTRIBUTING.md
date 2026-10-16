# Contributing to Collavryn

Thank you for your interest in contributing.

Collavryn is an open-source full-stack application demonstrating
authentication, multi-tenant access control, team collaboration,
PostgreSQL, automated testing, and continuous integration.

## Getting started

1. Fork and clone the repository.
2. Install Node.js and npm.
3. Run `npm ci`.
4. Configure your own local PostgreSQL database.
5. Configure environment variables locally.
6. Run `npx prisma generate`.
7. Run `npx prisma migrate deploy`.
8. Start the development server with `npm run dev`.

See the README for additional setup instructions.

Never commit credentials, access tokens, database dumps, or local
environment files.

## Development guidelines

- Use TypeScript.
- Follow the existing architecture and code conventions.
- Preserve organisation-level access controls.
- Validate external input.
- Include automated tests for new functionality.
- Avoid unrelated changes.
- Keep pull requests focused.

## Verification

Before opening a pull request, run:

    npm run typecheck
    npm run lint
    npm run test:unit
    npm run test:e2e
    npm run build

End-to-end tests require a configured PostgreSQL database.

## Pull requests

Explain the change, its motivation, and how you tested it.

Changes affecting authentication or authorisation should include
negative security tests.

## Security

Do not disclose vulnerabilities in public issues.

See [SECURITY.md](SECURITY.md).

## License

Contributions are made under the project's MIT license.
