# Lantern Agent

Autonomous DEX trading agent on X Layer, built for OKX Build X Hackathon.

## Architecture

4-layer monorepo (pnpm workspaces):
- L1 `services/orchestrator/src/pulse/` — Market discovery via OKX Onchain OS
- L2 `services/orchestrator/src/runtime/` — Decision engine (Kelly Criterion)
- L3 `services/executor/src/lib/` — Trade execution via onchainos CLI
- L4 `apps/web/` — Next.js 16 dashboard

## Key Commands

- `pnpm agent:live` — Run agent in live mode (real trades)
- `pnpm agent:paper` — Run agent in paper mode (simulation)
- `pnpm dev` — Start all services + dashboard
- `pnpm build` — Build all packages
- `pnpm typecheck` — TypeScript check

## Naming Conventions

- Package scope: `@lantern/`
- DB name: `lantern`
- Env prefix: `LANTERN_`
- Chain: X Layer (196)

## OKX Integration

All OKX API calls go through `onchainos` CLI via subprocess (`execFile`).
See `services/executor/src/lib/okx-dex.ts` for the execution bridge.
See `services/orchestrator/src/pulse/market-pulse.ts` for market discovery.

## Risk Controls (Hard, Service-Layer)

- Drawdown halt: 20% from HWM
- Stop-loss: 30% per position
- Max exposure: 50% of bankroll
- Max per-token: 30%
- Max positions: 10
- Min trade: $5

## Do NOT

- Hardcode API keys or private keys
- Bypass risk controls
- Remove heartbeat swap (needed for Most Active Agent prize)
- Use `@polymarket/clob-client` (removed)
