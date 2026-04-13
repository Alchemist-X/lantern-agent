/**
 * agent:paper entry point.
 *
 * Thin wrapper that delegates to pulse-live.ts in recommend-only (paper) mode.
 * Injects --recommend-only before forwarding remaining CLI flags.
 */

// Inject --recommend-only into argv before pulse-live parses it.
if (!process.argv.includes("--recommend-only")) {
  process.argv.splice(2, 0, "--recommend-only");
}

import "./pulse-live.ts";
