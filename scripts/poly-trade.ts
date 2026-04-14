/**
 * poly-trade.ts -- Place a real trade on Polymarket using the no1 wallet.
 *
 * Usage:
 *   cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
 *   pnpm exec tsx scripts/poly-trade.ts
 */

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// The clob-client + ethers are installed inside services/executor/node_modules.
const executorRequire = createRequire(
  pathToFileURL(
    "/Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external/services/executor/node_modules/@polymarket/clob-client/package.json",
  ).href,
);

// ── Wallet configuration ────────────────────────────────────────────────────
const PRIVATE_KEY =
  "0x627a8ac708ab40f3c0cf0fec7dc5ade758d918d39be788c70871dadccd009fca";
const SIGNER_ADDRESS = "0xE14E6C10e688Ab2C8aF3e60EdeB1Af71aD7ddFF1";
const FUNDER_ADDRESS = "0xc78873644e582cb950f1af880c4f3ef3c11f2936";
const SIGNATURE_TYPE = 2; // POLY_GNOSIS_SAFE
const CHAIN_ID = 137;
const HOST = "https://clob.polymarket.com";

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(label: string, data?: unknown) {
  if (data !== undefined) {
    console.log(
      `[poly-trade] ${label}:`,
      typeof data === "string" ? data : JSON.stringify(data, null, 2),
    );
  } else {
    console.log(`[poly-trade] ${label}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log("Starting Polymarket trade script");
  log("Signer address", SIGNER_ADDRESS);
  log("Funder address", FUNDER_ADDRESS);

  // Dynamic imports to avoid top-level await
  const ethersPath = executorRequire.resolve("ethers");
  const { Wallet } = await import(ethersPath);

  const clobPath = executorRequire.resolve("@polymarket/clob-client");
  const { ClobClient, Side, OrderType } = await import(clobPath);

  // Step 1: Create a signer from the private key
  log("Creating ethers Wallet signer...");
  const signer = new Wallet(PRIVATE_KEY);
  log("Signer address from wallet", signer.address);

  // Step 2: Create a boot ClobClient (no API creds) to derive API key
  log("Creating boot ClobClient to derive API credentials...");
  const bootClient = new ClobClient(HOST, CHAIN_ID, signer);

  // Test connectivity
  log("Testing CLOB connectivity...");
  try {
    const ok = await bootClient.getOk();
    log("CLOB getOk() response", ok);
  } catch (err: unknown) {
    log("CLOB getOk() failed (non-fatal)", (err as Error).message);
  }

  // Step 3: Derive or create API credentials
  log("Deriving API credentials from private key...");
  let creds: { key: string; secret: string; passphrase: string };
  try {
    creds = await bootClient.deriveApiKey();
    log("Derived existing API key", creds.key);
  } catch (deriveErr: unknown) {
    log(
      "deriveApiKey failed, trying createOrDeriveApiKey...",
      (deriveErr as Error).message,
    );
    try {
      creds = await bootClient.createOrDeriveApiKey();
      log("Created/derived API key", creds.key);
    } catch (createErr: unknown) {
      log(
        "createOrDeriveApiKey also failed",
        (createErr as Error).message,
      );
      throw createErr;
    }
  }

  // Step 4: Create the fully authenticated ClobClient
  log("Creating authenticated ClobClient with API creds + funder address...");
  const client = new ClobClient(
    HOST,
    CHAIN_ID,
    signer,
    creds,
    SIGNATURE_TYPE,
    FUNDER_ADDRESS,
  );

  // Step 5: Check collateral balance
  log("Checking collateral balance & allowance...");
  try {
    const bal = await client.getBalanceAllowance({
      asset_type: "COLLATERAL",
    });
    log("Collateral balance/allowance", bal);
  } catch (err: unknown) {
    log("getBalanceAllowance failed (non-fatal)", (err as Error).message);
  }

  // Step 6: Find a crypto market via Gamma API
  log("Fetching active crypto markets from Gamma API...");
  const gammaRes = await fetch(
    "https://gamma-api.polymarket.com/events?active=true&closed=false&tag=crypto&limit=10",
  );
  if (!gammaRes.ok) {
    throw new Error(
      `Gamma API failed: ${gammaRes.status} ${gammaRes.statusText}`,
    );
  }
  const events = (await gammaRes.json()) as Array<{
    title: string;
    slug: string;
    markets?: Array<{
      question: string;
      conditionId: string;
      clobTokenIds: string;
      outcomePrices: string;
      volume: string;
      active: boolean;
      closed: boolean;
    }>;
  }>;

  log(`Found ${events.length} crypto events`);

  // Find a good market: active, not closed, with reasonable liquidity
  let targetMarket: {
    question: string;
    conditionId: string;
    yesTokenId: string;
    noTokenId: string;
    yesPrice: number;
    noPrice: number;
    volume: number;
  } | null = null;

  for (const event of events) {
    log(`Event: ${event.title}`);
    if (!event.markets) continue;

    for (const market of event.markets) {
      if (!market.active || market.closed) continue;

      let tokenIds: string[];
      let prices: number[];
      try {
        tokenIds = JSON.parse(market.clobTokenIds);
        prices = JSON.parse(market.outcomePrices).map(Number);
      } catch {
        continue;
      }

      if (tokenIds.length < 2 || prices.length < 2) continue;

      const vol = parseFloat(market.volume || "0");
      log(
        `  Market: ${market.question}` +
          `  | YES=$${prices[0]?.toFixed(2)} NO=$${prices[1]?.toFixed(2)}` +
          `  | Vol=$${vol.toFixed(0)}`,
      );

      // Pick a market with decent volume where YES is below 0.90
      if (
        vol > 10000 &&
        prices[0] !== undefined &&
        prices[0] < 0.90 &&
        prices[0] > 0.10
      ) {
        targetMarket = {
          question: market.question,
          conditionId: market.conditionId,
          yesTokenId: tokenIds[0]!,
          noTokenId: tokenIds[1]!,
          yesPrice: prices[0],
          noPrice: prices[1]!,
          volume: vol,
        };
        break;
      }
    }
    if (targetMarket) break;
  }

  if (!targetMarket) {
    log("No suitable crypto market found. Trying all active markets...");
    const fallbackRes = await fetch(
      "https://gamma-api.polymarket.com/markets?limit=20&active=true&closed=false&order=liquidity&ascending=false",
    );
    if (fallbackRes.ok) {
      const markets = (await fallbackRes.json()) as Array<{
        question: string;
        conditionId: string;
        clobTokenIds: string;
        outcomePrices: string;
        volume: string;
        active: boolean;
        closed: boolean;
      }>;

      for (const market of markets) {
        if (!market.active || market.closed) continue;
        let tokenIds: string[];
        let prices: number[];
        try {
          tokenIds = JSON.parse(market.clobTokenIds);
          prices = JSON.parse(market.outcomePrices).map(Number);
        } catch {
          continue;
        }
        if (tokenIds.length < 2 || prices.length < 2) continue;
        const vol = parseFloat(market.volume || "0");
        if (
          vol > 5000 &&
          prices[0] !== undefined &&
          prices[0] < 0.95 &&
          prices[0] > 0.05
        ) {
          targetMarket = {
            question: market.question,
            conditionId: market.conditionId,
            yesTokenId: tokenIds[0]!,
            noTokenId: tokenIds[1]!,
            yesPrice: prices[0],
            noPrice: prices[1]!,
            volume: vol,
          };
          log(`Fallback found: ${market.question}`);
          break;
        }
      }
    }
  }

  if (!targetMarket) {
    throw new Error("Could not find any suitable market to trade on.");
  }

  log("=== TARGET MARKET ===");
  log("Question", targetMarket.question);
  log("Condition ID", targetMarket.conditionId);
  log("YES token ID", targetMarket.yesTokenId);
  log("NO token ID", targetMarket.noTokenId);
  log("YES price", targetMarket.yesPrice);
  log("NO price", targetMarket.noPrice);
  log("Volume", `$${targetMarket.volume.toFixed(0)}`);

  // Step 7: Read the order book for the YES token
  log("Reading order book for YES token...");
  try {
    const book = await client.getOrderBook(targetMarket.yesTokenId);
    const bids = book.bids?.slice(0, 3) ?? [];
    const asks = book.asks?.slice(0, 3) ?? [];
    log("Top 3 bids", bids);
    log("Top 3 asks", asks);
    log("Min order size", book.min_order_size);
    log("Tick size", book.tick_size);
  } catch (err: unknown) {
    log("Failed to read order book (non-fatal)", (err as Error).message);
  }

  // Step 8: Place a $1 market BUY order on YES
  // For a FOK market order: amount = USDC to spend
  const tradeAmountUsd = 1;
  log(`Placing $${tradeAmountUsd} FOK market BUY on YES...`);

  try {
    const orderResult = await client.createAndPostMarketOrder(
      {
        tokenID: targetMarket.yesTokenId,
        amount: tradeAmountUsd,
        side: Side.BUY,
      },
      undefined,
      OrderType.FOK,
    );

    log("=== ORDER RESULT ===");
    log("Full response", orderResult);
    log("Order ID", orderResult?.orderID);
    log("Success", orderResult?.success);
    log("Status", orderResult?.status);
    log("Taking amount", orderResult?.takingAmount);
    log("Making amount", orderResult?.makingAmount);
    if (orderResult?.transactionsHashes) {
      log("Transaction hashes", orderResult.transactionsHashes);
    }
  } catch (err: unknown) {
    const errMsg = (err as Error).message ?? String(err);
    log("ORDER FAILED", errMsg);

    // If FOK fails (no fill), try a GTC limit order instead
    if (
      errMsg.includes("not enough liquidity") ||
      errMsg.includes("FOK") ||
      errMsg.includes("not_matched")
    ) {
      log("FOK failed, trying GTC limit order instead...");
      const limitPrice =
        Math.floor(targetMarket.yesPrice * 100) / 100;
      const limitSize =
        Math.floor((tradeAmountUsd / limitPrice) * 100) / 100;

      log(
        `Placing GTC limit BUY: price=${limitPrice}, size=${limitSize} shares`,
      );
      try {
        const limitResult = await client.createAndPostOrder(
          {
            tokenID: targetMarket.yesTokenId,
            price: limitPrice,
            size: limitSize,
            side: Side.BUY,
          },
          undefined,
          OrderType.GTC,
        );
        log("=== LIMIT ORDER RESULT ===");
        log("Full response", limitResult);
      } catch (limitErr: unknown) {
        log(
          "LIMIT ORDER ALSO FAILED",
          (limitErr as Error).message ?? String(limitErr),
        );
      }
    }

    // Re-throw so main() reports the original error
    throw err;
  }

  log("Trade completed successfully!");
}

main().catch((err) => {
  console.error("[poly-trade] Fatal error:", err);
  process.exit(1);
});
