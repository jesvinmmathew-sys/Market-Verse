# Implementation notes

These notes map the README to the current implementation. Source behavior takes precedence over interface copy and comments.

| Claim | Source to inspect |
| --- | --- |
| React 19, Vite 6, TypeScript 5.8, Tailwind 4, Express 4, Gemini SDK 2 | [`package.json`](../package.json), with resolved dependencies in `package-lock.json` |
| TypeScript strict mode is not enabled | [`tsconfig.json`](../tsconfig.json) |
| Browser market indicators and simulated history | [`marketApi.ts`](../src/services/marketApi.ts): `calculateTechnicalIndicators`, `generateHistory` |
| Separate EMA-based MACD helpers | [`marketTools.ts`](../src/services/marketTools.ts); distinguish these from `marketApi.ts`'s simplified MACD calculation |
| Rule-based bullish/bearish rankings | [`MarketRadar.tsx`](../src/components/MarketRadar.tsx): scoring based on change, RSI, MACD-related history, moving averages |
| Portfolio metrics and heuristic commentary | [`PortfolioAnalyzer.tsx`](../src/components/PortfolioAnalyzer.tsx); some commentary is built from local templates rather than Gemini |
| Virtual cash and buy/sell state | [`trading.ts`](../src/services/trading.ts); default cash is 1,000,000 INR |
| Browser-local account state and stale-write guards | [`accountStorage.ts`](../src/services/accountStorage.ts), [`AccountBoundary.tsx`](../src/components/AccountBoundary.tsx) |
| Authenticated server AI, context and fallbacks | [`server.ts`](../server.ts), [`access.ts`](../server/lib/access.ts) |
| General chat has a different context path | `/api/chat` in `server.ts`; [`novaAi.ts`](../src/services/novaAi.ts) separately fetches quotes for some stock cards |
| Server-only credentials and model override | `getGeminiClient` in `server.ts`; [`vite.config.ts`](../vite.config.ts) explicitly exports only public Supabase configuration |
| Quote/history providers and fallback generators | [`marketProviders/`](../marketProviders/), market routes in `server.ts` |
| Import validation and worker termination | [`portfolioImport.ts`](../src/services/portfolioImport.ts), [`importPortfolioFile.ts`](../src/services/importPortfolioFile.ts) |
| Validation, bounded calls, process-local limits | [`server/lib/`](../server/lib/) |
| Vercel entry, frontend output and server separation | [`api/index.ts`](../api/index.ts), [`vercel.json`](../vercel.json), build script in `package.json` |
| Existing regression coverage | [`security.test.ts`](../tests/security.test.ts), [`account-import.test.ts`](../tests/account-import.test.ts) |

## Boundaries worth preserving

Deterministic calculations mean that the same inputs produce the same calculation result. They do not establish that the inputs are real market observations. The server analysis routes can calculate indicators from generated history, and multiple fallback paths use fixed, seeded, or randomized values.

The main browser MACD implementation uses rolling means and a simplified signal. The separate helper implementation uses EMA recurrences. Neither the README nor future demos should imply that every displayed indicator has been validated against a reference financial library.

Some legacy UI/assistant language refers to institutional-grade analysis, HHI, live data, or probability. Those words alone do not establish implemented or independently verified capabilities. In particular, the portfolio health calculation uses application rules; it is not evidence of an HHI implementation or a calibrated risk model.

Supabase is used for authentication. The portfolio/trading services persist account-scoped browser state; the repository does not establish a Supabase-backed portfolio database.

## Documentation review baseline

The presentation review examined the remediation series ending at `f28cfa6`: authenticated and bounded AI access (`4a9545d`), server-only provider keys and account isolation (`13cbe2d`), import and artifact hardening (`1ee77c2`), and final validation/provider refinements (`f28cfa6`). This is source review context, not a security audit certification.

The public deployment's owner-only account access is a project-owner-provided operational notice, not an inferred allowlist implemented in this repository. The demo URL is retained from the existing README; deployment uptime and settings are not asserted by this documentation review.

No repository evidence was found for FINVERSE affiliation or an internal Smart India Hackathon selection result. Add recognition only after the owner confirms the institution, event, year, and exact result; distinguish internal selection from a national SIH win.
