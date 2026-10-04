# Product screenshots and recording brief

## Included assets

These files are copies of existing owner-supplied assets; no interface screenshots were generated or reconstructed.

| Repository asset | Original supplied filename | Placement |
| --- | --- | --- |
| `images/marketverse-logo.png` | MarketVerse Transparent Logo.png | README hero |
| `images/dashboard.png` | Dashboard.png | Full-width product preview |
| `images/portfolio-analyzer.png` | Portfolio Analyzer.png | Preview grid |
| `images/nova-ai.png` | Nova AI.png | Preview grid |

The screenshots show historical UI states, not current market prices. The portfolio screenshot displays an old 5 MB label; the current parser accepts at most 2 MB and 100 holdings. The NOVA screenshot shows the workspace, not a completed inference. “Live feed” labels in captures do not establish freshness or provider provenance.

## Recommended replacement captures

Use a 1920 × 1080, 16:9 browser viewport at 100% zoom, with synthetic holdings and no private account details. Capture the current revision:

- **Dashboard:** show the full heatmap and a visible source/status/timestamp where available. Replace `images/dashboard.png`.
- **Portfolio result:** import a synthetic three-to-five-stock sheet and show allocation, P&L, and health summaries, rather than only the upload screen. Save as `images/portfolio-results.png` and replace the portfolio cell in the README grid.
- **NOVA response:** show one completed educational answer together with the question and any data/fallback notice. Save as `images/nova-response.png` and replace the NOVA grid cell.
- **Radar / simulation:** optionally capture the ranking explanation and a virtual trade with before/after holdings. Add only if it demonstrates something the first three images do not.

## Hero recording

Capture a **25–30 second** walkthrough at **1920 × 1080 (16:9)**:

1. Dashboard overview and heatmap — 5 seconds.
2. Indian Market Hub → one stock detail and indicator view — 6 seconds.
3. Portfolio allocation from synthetic holdings — 6 seconds.
4. NOVA question and completed response — 8–10 seconds.

Record the actual application with your authorized account; hide profile identifiers, notifications, tokens, and personal holdings. Mark demonstration data clearly. Avoid portraying a fallback answer as live Gemini output. Skip login and waiting periods without fabricating transitions or results.

Keep a high-quality MP4 separately. Export a lightweight looping GIF around 1280 × 720 and 10–12 fps, ideally below 8 MB, to `docs/images/marketverse-demo.gif`. Embed it immediately under **Product preview**, replacing the full-width dashboard image so the opening does not become repetitive. No missing-file placeholder is embedded in the README today.
