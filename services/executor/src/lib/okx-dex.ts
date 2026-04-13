import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ONCHAINOS = "/Users/Aincrad/.local/bin/onchainos";
const CHAIN = "196"; // X Layer

const USDC_ADDRESS = "0x74b7f16337b8972027f6196a17a631ac6de26d22";
const NATIVE_OKB_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const STABLECOIN_ADDRESSES = new Set([
  USDC_ADDRESS.toLowerCase(),
]);

const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface OkxDexConfig {
  walletAddress: string;
  chainId: string;
  slippagePct: number;
  rpcUrl: string;
}

export interface SwapResult {
  txHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  gasUsed: string;
}

export interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  balanceUsd: string;
}

export interface QuoteResult {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  estimateGasFee: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Run an onchainos CLI command, capture stdout, parse as JSON, and return the
 * parsed object.  Throws on non-zero exit, stderr output, or JSON parse
 * failure.
 */
async function runOnchainos(args: readonly string[]): Promise<unknown> {
  const cmdLine = [ONCHAINOS, ...args].join(" ");
  console.info(`[okx-dex] exec: ${cmdLine}`);

  try {
    const { stdout, stderr } = await exec(ONCHAINOS, [...args], {
      timeout: TIMEOUT_MS,
    });

    const trimmedStderr = (stderr ?? "").trim();
    if (trimmedStderr) {
      console.warn(`[okx-dex] stderr for "${cmdLine}": ${trimmedStderr}`);
    }

    const trimmedStdout = (stdout ?? "").trim();
    if (!trimmedStdout) {
      throw new Error(`onchainos returned empty stdout for: ${cmdLine}`);
    }

    try {
      return JSON.parse(trimmedStdout) as unknown;
    } catch (parseError) {
      throw new Error(
        `onchainos returned non-JSON output for "${cmdLine}": ${trimmedStdout.slice(0, 200)}`
      );
    }
  } catch (error) {
    throw new Error(`onchainos command failed ("${cmdLine}"): ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Execute a token swap on X Layer DEX via the onchainos CLI.
 */
export async function executeSwap(
  config: OkxDexConfig,
  params: {
    fromToken: string;
    toToken: string;
    readableAmount: string;
  }
): Promise<SwapResult> {
  const raw = await runOnchainos([
    "swap",
    "execute",
    "--from",
    params.fromToken,
    "--to",
    params.toToken,
    "--readable-amount",
    params.readableAmount,
    "--chain",
    config.chainId || CHAIN,
    "--wallet",
    config.walletAddress,
    "--slippage",
    String(config.slippagePct),
    "--force",
  ]);

  const data = raw as Record<string, unknown>;

  return {
    txHash: String(data.swapTxHash ?? ""),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: String(data.fromAmount ?? params.readableAmount),
    toAmount: String(data.toAmount ?? "0"),
    priceImpact: String(data.priceImpact ?? "0"),
    gasUsed: String(data.gasUsed ?? "0"),
  };
}

/**
 * Get a swap quote (read-only, no on-chain execution).
 */
export async function getQuote(
  config: OkxDexConfig,
  params: {
    fromToken: string;
    toToken: string;
    readableAmount: string;
  }
): Promise<QuoteResult> {
  const raw = await runOnchainos([
    "swap",
    "quote",
    "--from",
    params.fromToken,
    "--to",
    params.toToken,
    "--readable-amount",
    params.readableAmount,
    "--chain",
    config.chainId || CHAIN,
  ]);

  const data = raw as Record<string, unknown>;

  return {
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: String(data.fromAmount ?? params.readableAmount),
    toAmount: String(data.toAmount ?? "0"),
    priceImpact: String(data.priceImpact ?? "0"),
    estimateGasFee: String(data.estimateGasFee ?? data.gasEstimate ?? "0"),
  };
}

/**
 * Fetch all token balances for the configured wallet on X Layer.
 */
export async function fetchWalletBalances(
  config: OkxDexConfig
): Promise<TokenBalance[]> {
  const raw = await runOnchainos([
    "portfolio",
    "all-balances",
    "--address",
    config.walletAddress,
    "--chains",
    config.chainId || CHAIN,
  ]);

  const items = Array.isArray(raw) ? raw : [];

  return items.map((item: Record<string, unknown>) => ({
    tokenAddress: String(item.tokenAddress ?? item.address ?? ""),
    symbol: String(item.symbol ?? ""),
    balance: String(item.balance ?? "0"),
    balanceUsd: String(item.balanceUsd ?? item.valueUsd ?? "0"),
  }));
}

/**
 * Get the balance of a single token for the configured wallet.
 * Returns `null` if the token is not held.
 */
export async function getTokenBalance(
  config: OkxDexConfig,
  tokenAddress: string
): Promise<TokenBalance | null> {
  const balances = await fetchWalletBalances(config);
  const normalised = tokenAddress.toLowerCase();

  const match = balances.find(
    (b) => b.tokenAddress.toLowerCase() === normalised
  );

  return match ?? null;
}

/**
 * Get the current USD price of a token on X Layer.
 */
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  const raw = await runOnchainos([
    "market",
    "price",
    "--address",
    tokenAddress,
    "--chain",
    CHAIN,
  ]);

  const data = raw as Record<string, unknown>;
  const price = Number(data.price ?? data.usdPrice ?? 0);

  if (!Number.isFinite(price)) {
    throw new Error(
      `onchainos returned non-numeric price for ${tokenAddress}: ${JSON.stringify(data)}`
    );
  }

  return price;
}

/**
 * Simulate a swap before execution to check for warnings.
 *
 * This fetches a quote and runs basic safety heuristics:
 *   - price impact above 5% is flagged
 *   - zero output amount is flagged
 *   - quote failure is flagged
 */
export async function simulateSwap(
  config: OkxDexConfig,
  params: {
    fromToken: string;
    toToken: string;
    readableAmount: string;
  }
): Promise<{ safe: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  try {
    const quote = await getQuote(config, params);

    const impact = Math.abs(Number(quote.priceImpact));
    if (impact > 5) {
      warnings.push(
        `High price impact: ${impact.toFixed(2)}% (threshold: 5%)`
      );
    }

    const outAmount = Number(quote.toAmount);
    if (outAmount <= 0) {
      warnings.push("Quoted output amount is zero or negative");
    }

    const gasEstimate = Number(quote.estimateGasFee);
    if (gasEstimate <= 0) {
      warnings.push("Gas estimate is zero -- the transaction may revert");
    }
  } catch (error) {
    warnings.push(`Quote failed: ${getErrorMessage(error)}`);
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Flatten all positions by selling every non-stablecoin token back to USDC.
 *
 * Returns one `SwapResult` per token that was sold.  Tokens with zero or
 * negligible balance (< $0.01 USD) are skipped.
 */
export async function flattenAllPositions(
  config: OkxDexConfig
): Promise<SwapResult[]> {
  const balances = await fetchWalletBalances(config);

  const nonStable = balances.filter((b) => {
    const addr = b.tokenAddress.toLowerCase();
    if (STABLECOIN_ADDRESSES.has(addr)) {
      return false;
    }
    const usdValue = Number(b.balanceUsd);
    if (!Number.isFinite(usdValue) || usdValue < 0.01) {
      return false;
    }
    return true;
  });

  if (nonStable.length === 0) {
    console.info("[okx-dex] flattenAllPositions: no non-stablecoin positions to flatten");
    return [];
  }

  const results: SwapResult[] = [];

  for (const token of nonStable) {
    console.info(
      `[okx-dex] flattenAllPositions: selling ${token.balance} ${token.symbol} ($${token.balanceUsd}) -> USDC`
    );

    try {
      const result = await executeSwap(config, {
        fromToken: token.tokenAddress,
        toToken: USDC_ADDRESS,
        readableAmount: token.balance,
      });
      results.push(result);
    } catch (error) {
      console.error(
        `[okx-dex] flattenAllPositions: failed to sell ${token.symbol}: ${getErrorMessage(error)}`
      );
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Re-export constants for external use
// ---------------------------------------------------------------------------

export { USDC_ADDRESS, NATIVE_OKB_ADDRESS, CHAIN };
