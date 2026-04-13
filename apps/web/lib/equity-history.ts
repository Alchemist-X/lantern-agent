import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface EquitySnapshot {
  timestamp: string;
  total_equity_usd: number;
  cash_usd: number;
  positions_value_usd: number;
  open_positions: number;
}

/**
 * Load equity history from the static JSON file in public/.
 * This runs server-side at build/request time in Next.js.
 * On Vercel, the file is bundled as a static asset.
 */
export async function loadEquityHistory(): Promise<EquitySnapshot[]> {
  const filePath = path.join(process.cwd(), "public", "equity-history.json");
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as EquitySnapshot[];
  } catch {
    return [];
  }
}
