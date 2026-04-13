import "dotenv/config";

import { loadEnvFile } from "./lib/env-file.js";

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readFirstString(names: string[], fallback = ""): string {
  for (const name of names) {
    const raw = process.env[name];
    if (!raw) {
      continue;
    }
    const value = raw.trim();
    if (value) {
      return value;
    }
  }
  return fallback;
}

export interface ExecutorConfig {
  port: number;
  redisUrl: string;
  envFilePath: string | null;
  privateKey: string;
  walletAddress: string;
  chainId: string;
  slippagePct: number;
  rpcUrl: string;
  defaultOrderType: "SWAP";
  drawdownStopPct: number;
  positionStopLossPct: number;
  initialBankrollUsd: number;
}

export function loadConfig(): ExecutorConfig {
  const envFilePath = loadEnvFile();
  return {
    port: readNumber("PORT", 4002),
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    envFilePath,
    privateKey: readFirstString(["PRIVATE_KEY"]),
    walletAddress: readFirstString(["WALLET_ADDRESS", "ADDRESS", "FUNDER_ADDRESS", "EVM_ADDRESS"]),
    chainId: readFirstString(["CHAIN_ID"], "196"),
    slippagePct: readNumber("SLIPPAGE_PCT", 0.5),
    rpcUrl: process.env.RPC_URL ?? "https://xlayerrpc.okx.com",
    defaultOrderType: "SWAP",
    drawdownStopPct: readNumber("DRAWDOWN_STOP_PCT", 0.2),
    positionStopLossPct: readNumber("POSITION_STOP_LOSS_PCT", 0.3),
    initialBankrollUsd: readNumber("INITIAL_BANKROLL_USD", 10000)
  };
}
