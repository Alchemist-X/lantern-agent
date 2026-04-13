/**
 * Shared pulse filter types and logic.
 *
 * Lives in the orchestrator so that both `services/orchestrator/` and `scripts/`
 * can import it without creating circular dependencies (scripts already import
 * from the orchestrator; the reverse is not allowed).
 */

// ---------------------------------------------------------------------------
// Filter args
// ---------------------------------------------------------------------------

export interface PulseFilterArgs {
  category: string | null;
  tag: string | null;
  minProb: number | null;
  maxProb: number | null;
  minLiquidity: number | null;
}

export function hasPulseFilters(filters: PulseFilterArgs): boolean {
  return (
    filters.category != null ||
    filters.tag != null ||
    filters.minProb != null ||
    filters.maxProb != null ||
    filters.minLiquidity != null
  );
}

// ---------------------------------------------------------------------------
// User-specified pulse filters (category, tag, prob range, liquidity)
// ---------------------------------------------------------------------------

export function applyPulseFilters<
  T extends {
    categorySlug?: string | null;
    tags?: Array<{ slug: string }>;
    outcomePrices: number[];
    liquidityUsd: number;
  }
>(candidates: readonly T[], filters: PulseFilterArgs): T[] {
  return candidates.filter((candidate) => {
    if (filters.category != null && candidate.categorySlug !== filters.category) return false;
    if (filters.tag != null && !(candidate.tags ?? []).some((t) => t.slug === filters.tag)) return false;
    if (filters.minLiquidity != null && candidate.liquidityUsd < filters.minLiquidity) return false;
    if (candidate.outcomePrices.length > 0) {
      const maxPrice = Math.max(...candidate.outcomePrices);
      const minPrice = Math.min(...candidate.outcomePrices);
      if (filters.minProb != null && maxPrice < filters.minProb) return false;
      if (filters.maxProb != null && minPrice > filters.maxProb) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Short-term price market auto-filter
// ---------------------------------------------------------------------------

/**
 * Regex patterns that identify price-prediction market questions.
 * Matched case-insensitively against the market question text.
 */
const PRICE_PREDICTION_PATTERNS: readonly RegExp[] = [
  /price.*(?:above|below|hit|reach|dip|pump)/i,
  /(?:BTC|ETH|SOL|DOGE).*\$[\d,]+/i,
  /Bitcoin.*\$|Ethereum.*\$/i,
  /up or down/i,
];

/**
 * Category slugs that are inherently price-related.
 * Markets in these categories with short expiry are filtered.
 */
const PRICE_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  "crypto",
  "stocks",
  "commodities",
]);

/** Minimum days to expiry for price-prediction markets. */
const MIN_DAYS_FOR_PRICE_MARKETS = 7;

function isPricePredictionQuestion(question: string): boolean {
  return PRICE_PREDICTION_PATTERNS.some((pattern) => pattern.test(question));
}

function resolveCanonicalCategory(slug: string | null | undefined): string {
  if (!slug) return "";
  const lower = slug.trim().toLowerCase();
  for (const alias of TYPE_WEIGHT_ALIASES) {
    if (lower === alias.pattern || lower.includes(alias.pattern)) {
      return alias.canonical;
    }
  }
  return lower;
}

function isPriceCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const lower = slug.trim().toLowerCase();
  if (lower === "") return false;
  // Check both the raw slug and the canonical form
  if (PRICE_CATEGORY_SLUGS.has(lower)) return true;
  const canonical = resolveCanonicalCategory(slug);
  return PRICE_CATEGORY_SLUGS.has(canonical);
}

function isShortTermPriceMarket(candidate: {
  question: string;
  endDate: string;
  categorySlug?: string | null;
}, nowMs?: number): boolean {
  const now = nowMs ?? Date.now();
  const endMs = new Date(candidate.endDate).getTime();
  if (Number.isNaN(endMs)) return false;

  const daysToExpiry = (endMs - now) / (1000 * 60 * 60 * 24);
  if (daysToExpiry >= MIN_DAYS_FOR_PRICE_MARKETS) return false;

  if (isPriceCategorySlug(candidate.categorySlug)) return true;

  return isPricePredictionQuestion(candidate.question);
}

/**
 * Remove short-term price prediction markets where AI has no edge.
 *
 * This filter is applied unconditionally (no CLI flag required).
 * Markets are removed when:
 *   1. They expire in < 7 days AND
 *   2. They are in a price-related category OR the question matches
 *      price-prediction keywords.
 */
export function filterShortTermPriceMarkets<
  T extends {
    question: string;
    endDate: string;
    categorySlug?: string | null;
  }
>(candidates: readonly T[], nowMs?: number): T[] {
  return candidates.filter((c) => !isShortTermPriceMarket(c, nowMs));
}

// ---------------------------------------------------------------------------
// Type weight scoring for candidate ranking
// ---------------------------------------------------------------------------

/**
 * Weights that represent how much AI edge we expect in each market category.
 * Higher weight = more valuable for our strategy.
 */
const TYPE_WEIGHTS: Readonly<Record<string, number>> = {
  politics: 1.5,
  geopolitics: 1.5,
  "foreign-policy": 1.5,
  tech: 1.5,
  ai: 1.5,
  economics: 1.2,
  finance: 1.2,
  sports: 1.0,
  esports: 1.0,
  culture: 1.0,
  crypto: 0.3,
  weather: 0.5,
  other: 0.8,
};

const DEFAULT_TYPE_WEIGHT = TYPE_WEIGHTS["other"]!;

/**
 * Partial-match rules for resolving category slugs to canonical type-weight
 * keys.  Follows the same pattern as `CATEGORY_ALIASES` in fees.ts.
 * Evaluated in order; first match wins.
 */
const TYPE_WEIGHT_ALIASES: ReadonlyArray<{ pattern: string; canonical: string }> = [
  { pattern: "politic", canonical: "politics" },
  { pattern: "trump", canonical: "politics" },
  { pattern: "election", canonical: "politics" },
  { pattern: "geopolitic", canonical: "geopolitics" },
  { pattern: "war", canonical: "geopolitics" },
  { pattern: "conflict", canonical: "geopolitics" },
  { pattern: "foreign-policy", canonical: "foreign-policy" },
  { pattern: "diplomac", canonical: "foreign-policy" },
  { pattern: "tech", canonical: "tech" },
  { pattern: "ai", canonical: "ai" },
  { pattern: "econ", canonical: "economics" },
  { pattern: "fed", canonical: "economics" },
  { pattern: "inflation", canonical: "economics" },
  { pattern: "gdp", canonical: "economics" },
  { pattern: "finance", canonical: "finance" },
  { pattern: "stock", canonical: "finance" },
  { pattern: "sport", canonical: "sports" },
  { pattern: "nba", canonical: "sports" },
  { pattern: "nfl", canonical: "sports" },
  { pattern: "mlb", canonical: "sports" },
  { pattern: "soccer", canonical: "sports" },
  { pattern: "football", canonical: "sports" },
  { pattern: "esport", canonical: "esports" },
  { pattern: "culture", canonical: "culture" },
  { pattern: "entertain", canonical: "culture" },
  { pattern: "movie", canonical: "culture" },
  { pattern: "music", canonical: "culture" },
  { pattern: "oscar", canonical: "culture" },
  { pattern: "crypto", canonical: "crypto" },
  { pattern: "bitcoin", canonical: "crypto" },
  { pattern: "ethereum", canonical: "crypto" },
  { pattern: "defi", canonical: "crypto" },
  { pattern: "weather", canonical: "weather" },
  { pattern: "climate", canonical: "weather" },
  { pattern: "hurricane", canonical: "weather" },
  { pattern: "commodit", canonical: "commodities" },
];

/**
 * Look up the type weight for a given category slug.
 * Case-insensitive with partial alias matching (same approach as fee lookup).
 */
export function lookupTypeWeight(categorySlug: string | null | undefined): number {
  if (!categorySlug) return DEFAULT_TYPE_WEIGHT;

  const lower = categorySlug.trim().toLowerCase();
  if (lower === "") return DEFAULT_TYPE_WEIGHT;

  const exact = TYPE_WEIGHTS[lower];
  if (exact != null) return exact;

  for (const alias of TYPE_WEIGHT_ALIASES) {
    if (lower.includes(alias.pattern)) {
      return TYPE_WEIGHTS[alias.canonical] ?? DEFAULT_TYPE_WEIGHT;
    }
  }

  return DEFAULT_TYPE_WEIGHT;
}

/**
 * Calculate a composite ranking score for a pulse candidate.
 *
 * score = liquidityScore * typeWeight
 *
 * where liquidityScore = log10(liquidityUsd + 1) * log10(volume24hUsd + 1)
 *
 * This allows high-edge categories (politics, tech) to outrank high-liquidity
 * but low-edge categories (crypto) in the final candidate list.
 */
export function calculateCandidateScore(candidate: {
  liquidityUsd: number;
  volume24hUsd: number;
  categorySlug?: string | null;
}): number {
  const liquidityScore =
    Math.log10(candidate.liquidityUsd + 1) * Math.log10(candidate.volume24hUsd + 1);
  const typeWeight = lookupTypeWeight(candidate.categorySlug);
  return liquidityScore * typeWeight;
}

/**
 * Sort candidates by composite score (descending).
 * Returns a new array; does not mutate the input.
 */
export function sortCandidatesByScore<
  T extends {
    liquidityUsd: number;
    volume24hUsd: number;
    categorySlug?: string | null;
  }
>(candidates: readonly T[]): T[] {
  return [...candidates].sort(
    (a, b) => calculateCandidateScore(b) - calculateCandidateScore(a)
  );
}

/**
 * Randomly shuffle candidates using Fisher-Yates.
 * Returns a new array; does not mutate the input.
 */
export function shuffleCandidates<T>(candidates: readonly T[]): T[] {
  const arr = [...candidates];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
