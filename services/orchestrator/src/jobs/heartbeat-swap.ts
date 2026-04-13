import { executeSwap, USDC_ADDRESS, NATIVE_OKB_ADDRESS, type OkxDexConfig } from "../../../executor/src/lib/okx-dex.js";

const HEARTBEAT_AMOUNT = "0.1"; // $0.10 USDC per heartbeat
const HEARTBEAT_PAIRS = [
  { from: USDC_ADDRESS, to: NATIVE_OKB_ADDRESS },
  { from: NATIVE_OKB_ADDRESS, to: USDC_ADDRESS },
];

let heartbeatIndex = 0;

export async function executeHeartbeatSwap(config: OkxDexConfig): Promise<{ txHash: string } | null> {
  const pair = HEARTBEAT_PAIRS[heartbeatIndex % HEARTBEAT_PAIRS.length]!;
  heartbeatIndex++;

  try {
    const result = await executeSwap(config, {
      fromToken: pair.from,
      toToken: pair.to,
      readableAmount: HEARTBEAT_AMOUNT,
    });
    console.log(`[heartbeat] swap #${heartbeatIndex}: ${result.txHash}`);
    return { txHash: result.txHash };
  } catch (err) {
    console.error(`[heartbeat] swap failed:`, err);
    return null;
  }
}
