# Security Policy

## Supported versions

Security maintenance focuses on the latest version of the `main` branch.

## Reporting vulnerabilities

Please do not disclose suspected vulnerabilities through public
GitHub issues, discussions, or pull requests.

Use GitHub's private vulnerability reporting feature when available.

If private reporting is unavailable, contact the repository maintainer
through a private channel.

Do not include credentials, access tokens, or personal information
in vulnerability reports.

## Security scope

Reports may concern:

- Authentication and session management
- Organisation and membership permissions
- Cross-organisation data isolation
- Input validation
- Dependency vulnerabilities
- Sensitive information exposure

## Development practices

- Keep secrets in environment variables.
- Never commit local environment files.
- Review database migrations.
- Test authentication and authorisation changes.
- Investigate dependency security alerts.

## Responsible disclosure

Please allow reasonable time for investigation and remediation
before public disclosure.
