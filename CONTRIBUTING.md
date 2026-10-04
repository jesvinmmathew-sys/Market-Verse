# Contributing to MarketVerse India

Start with the setup and data limitations in [README.md](README.md). For substantial work, open an issue describing the problem and proposed scope before implementation.

1. Fork the repository and create a focused branch.
2. Keep changes small; explain the user-visible behavior or documentation correction.
3. For code changes, run `npm test`, `npm run lint`, and `npm run build`. Include results and any failures in the pull request. Documentation-only changes need link, formatting, and factual checks.
4. Include screenshots for interface changes and regression coverage for meaningful behavior changes.
5. Open a pull request explaining what changed, why, and how you verified it.

Do not commit credentials, `.env`, personal account information, real brokerage statements, or generated build output. Use synthetic holdings in examples. Label simulated data clearly and distinguish heuristic scores from measured or calibrated results.

Keep provider credentials server-side and preserve authentication, account isolation, and bounded input handling. Discuss infrastructure or authentication changes explicitly rather than bundling them into unrelated work.

Use [SECURITY.md](SECURITY.md) for vulnerabilities; do not post exploit details or secrets in public issues.
