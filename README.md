<div align="center">

# 🌌 MarketVerse India
### Institutional-Grade Quantitative Intelligence & Simulated Trading Terminal

[![Vercel Deployment](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://market-verse.vercel.app)
[![Supabase Auth & DB](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![React Engine](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SEBI Regulatory Guard](https://img.shields.io/badge/Compliance-SEBI_Educational_Sandbox-blue?style=for-the-badge)](https://sebi.gov.in)

<p align="center">
  <b>Understand markets. Predict movement. Invest smart.</b><br />
  A high-frequency glassmorphic interface engineered for retail traders navigating Indian Equities (NSE/BSE) and Derivatives.
</p>

[Explore Live Terminal](https://market-verse.vercel.app) • [Architecture](#system-architecture) • [Key Modules](#terminal-modules) • [Legal & Compliance](#regulatory-compliance)

---

</div>

## 📌 Executive Summary

**MarketVerse India** is a real-time market intelligence terminal engineered to bridge the gap between complex quantitative analytics and retail execution. Built on modern web standards with liquid-glass aesthetic principles, the platform delivers zero-latency simulated paper trading, options analytics, and sentiment indexing strictly within educational compliance boundaries.

---

## ⚡ Terminal Modules

| Module | Core Functionality | Status |
| :--- | :--- | :--- |
| **Simulated Sandbox** | Dynamic margin allocation (₹1L - ₹50L), 1x/5x leverage configurations, live mark-to-market P&L ladders. | `Active` |
| **Market Radar** | Nifty 50 & Bank Nifty sector heatmaps, real-time gainers/losers tracking, and breadth indices. | `Active` |
| **Analytics Engine** | Natural language sentiment scoring, multi-factor technical scans, and macroeconomic correlation models. | `Active` |
| **Options Analytics** | Black-Scholes option pricing, Greeks tracking (Delta, Gamma, Theta), Put-Call Ratio (PCR) indicators. | `Active` |
| **Security & Auth** | Enterprise-grade Google OAuth 2.0 and Supabase session management with row-level security (RLS). | `Active` |

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    MarketVerse Client                       │
│      React 18 • Vite • Tailwind CSS • Glassmorphism Engine   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       [WebSocket / REST]              [OAuth / JWT]
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   Market Intelligence Feed   │ │       Supabase Cloud        │
│  NSE/BSE Feeds & Pricing     │ │  PostgreSQL • RLS • OAuth   │
│  Options Greeks & Sentiment  │ │  User Portfolios & Margins  │
└──────────────────────────────┘ └─────────────────────────────┘
```
