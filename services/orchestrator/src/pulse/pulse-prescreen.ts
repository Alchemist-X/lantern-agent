/**
 * AI pre-screening of pulse candidates.
 *
 * After the top 12 candidates are selected (with type weights from Phase B)
 * and before the final 4 are chosen for deep research, this module runs a
 * lightweight AI classification to filter out markets where AI has no
 * informational edge.
 *
 * This step is OPTIONAL and controlled by the PULSE_AI_PRESCREEN env flag.
 * When disabled (default), behaviour is identical to before.
 * When it fails or times out, execution falls through to normal selection.
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { OrchestratorConfig } from "../config.js";
type AgentRuntimeProvider = string;
import { resolveProviderSkillSettings } from "../runtime/skill-settings.js";
import type { ProgressReporter } from "../lib/terminal-progress.js";
import type { PulseCandidate } from "./market-pulse.js";

const PRESCREEN_TIMEOUT_MS = 60_000;

export interface PreScreenResult {
  marketSlug: string; // tokenAddress for DEX tokens
  suitable: boolean;
  reason: string;
}

export interface PreScreenSummary {
  results: PreScreenResult[];
  tradeCount: number;
  skipCount: number;
  elapsedMs: number;
  failed: boolean;
  failureReason?: string;
}

function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1_000_000) {
    return `$${(liquidity / 1_000_000).toFixed(1)}M`;
  }
  if (liquidity >= 1_000) {
    return `$${(liquidity / 1_000).toFixed(0)}K`;
  }
  return `$${liquidity.toFixed(0)}`;
}

export function buildPreScreenPrompt(candidates: readonly PulseCandidate[]): string {
  const header = [
    "Given these token candidates, quickly classify each as TRADE (good signal strength, meaningful liquidity, reasonable risk) or SKIP (honeypot risk, low liquidity, weak signal).",
    "",
    "For each candidate, respond with exactly one line in this format:",
    "TRADE|token_address|one-line reason",
    "or",
    "SKIP|token_address|one-line reason",
    "",
    "Candidates:"
  ].join("\n");

  const candidateLines = candidates.map((candidate, index) => {
    return `${index + 1}. ${candidate.name} (${candidate.symbol}) | address: ${candidate.tokenAddress} | price: $${candidate.price.toFixed(6)} | 24h: ${candidate.priceChange24h >= 0 ? "+" : ""}${candidate.priceChange24h.toFixed(1)}% | liquidity: ${formatLiquidity(candidate.liquidity)} | signal: ${candidate.signalStrength.toFixed(2)} | risk: ${candidate.riskLevel}`;
  });

  return [header, ...candidateLines, ""].join("\n");
}

export function parsePreScreenResponse(
  response: string,
  candidates: readonly PulseCandidate[]
): PreScreenResult[] {
  const slugSet = new Set(candidates.map((c) => c.tokenAddress));
  const results: PreScreenResult[] = [];
  const seenSlugs = new Set<string>();

  for (const rawLine of response.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const parts = line.split("|").map((s) => s.trim());
    if (parts.length < 3) {
      continue;
    }

    const verdict = parts[0]!.toUpperCase();
    if (verdict !== "TRADE" && verdict !== "SKIP") {
      continue;
    }

    const slug = parts[1]!;
    if (!slugSet.has(slug)) {
      continue;
    }
    if (seenSlugs.has(slug)) {
      continue;
    }
    seenSlugs.add(slug);

    results.push({
      marketSlug: slug,
      suitable: verdict === "TRADE",
      reason: parts.slice(2).join("|").trim() || "no reason given"
    });
  }

  // For any candidates not represented in the response, default to TRADE
  // (conservative: do not skip markets if the AI didn't mention them)
  for (const candidate of candidates) {
    if (!seenSlugs.has(candidate.tokenAddress)) {
      results.push({
        marketSlug: candidate.tokenAddress,
        suitable: true,
        reason: "not classified by pre-screen (defaulting to TRADE)"
      });
    }
  }

  return results;
}

function resolveDefaultProviderCommand(provider: string): string | null {
  switch (provider) {
    case "codex":
      return 'cat {{prompt_file}} | codex exec --skip-git-repo-check -C {{repo_root}} -s read-only --color never -c \'model_reasoning_effort="low"\' -o {{output_file}} -';
    case "claude-code":
      return "cat {{prompt_file}} | claude --print > {{output_file}}";
    case "openclaw":
      return "cat {{prompt_file}} | openclaw run --output {{output_file}} -";
    default:
      return null;
  }
}

export async function preScreenCandidates(input: {
  candidates: readonly PulseCandidate[];
  provider: AgentRuntimeProvider;
  config: OrchestratorConfig;
  progress?: ProgressReporter;
}): Promise<PreScreenSummary> {
  const startedAt = Date.now();

  if (input.candidates.length === 0) {
    return {
      results: [],
      tradeCount: 0,
      skipCount: 0,
      elapsedMs: 0,
      failed: false
    };
  }

  const prompt = buildPreScreenPrompt(input.candidates);
  const settings = resolveProviderSkillSettings(input.config, input.provider);
  const effectiveCommand = settings.command || resolveDefaultProviderCommand(input.provider);

  if (!effectiveCommand) {
    return {
      results: input.candidates.map((c) => ({
        marketSlug: c.tokenAddress,
        suitable: true,
        reason: "pre-screen skipped: no provider command configured"
      })),
      tradeCount: input.candidates.length,
      skipCount: 0,
      elapsedMs: Date.now() - startedAt,
      failed: true,
      failureReason: `No provider command configured for "${input.provider}"`
    };
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), "lantern-prescreen-"));
  const promptFile = path.join(tempDir, "prescreen-prompt.txt");
  const outputFile = path.join(tempDir, "prescreen-output.txt");

  try {
    await writeFile(promptFile, prompt, "utf8");

    let command = effectiveCommand;
    for (const [key, value] of Object.entries({
      repo_root: input.config.repoRoot,
      prompt_file: promptFile,
      output_file: outputFile,
      skill_root: settings.skillRootDir,
      model: settings.model
    })) {
      command = command.replaceAll(`{{${key}}}`, value);
    }

    input.progress?.stage({
      percent: 22,
      label: "AI pre-screening candidates",
      detail: `${input.candidates.length} candidates via ${input.provider}`
    });

    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
      const child = spawn("/bin/sh", ["-lc", command], {
        cwd: input.config.repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env
      });

      let stdout = "";
      let stderr = "";

      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Pre-screen timed out after ${PRESCREEN_TIMEOUT_MS}ms`));
      }, PRESCREEN_TIMEOUT_MS);

      child.stdout?.on("data", (chunk) => { stdout += String(chunk); });
      child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        resolve({ stdout, stderr, code: code ?? 1 });
      });
    });

    if (result.code !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `Pre-screen command exited with code ${result.code}`);
    }

    let responseText: string;
    try {
      responseText = await readFile(outputFile, "utf8");
    } catch {
      // Some providers write to stdout instead of the output file
      responseText = result.stdout;
    }

    if (!responseText.trim()) {
      throw new Error("Pre-screen returned empty response");
    }

    const results = parsePreScreenResponse(responseText, input.candidates);
    const tradeCount = results.filter((r) => r.suitable).length;
    const skipCount = results.filter((r) => !r.suitable).length;

    input.progress?.stage({
      percent: 23,
      label: "AI pre-screen complete",
      detail: `${tradeCount} TRADE / ${skipCount} SKIP in ${Math.round((Date.now() - startedAt) / 1000)}s`
    });

    return {
      results,
      tradeCount,
      skipCount,
      elapsedMs: Date.now() - startedAt,
      failed: false
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    input.progress?.info(
      `AI pre-screen failed (${Math.round(elapsedMs / 1000)}s): ${message}. Falling through to normal selection.`
    );

    return {
      results: input.candidates.map((c) => ({
        marketSlug: c.tokenAddress,
        suitable: true,
        reason: `pre-screen failed: ${message}`
      })),
      tradeCount: input.candidates.length,
      skipCount: 0,
      elapsedMs,
      failed: true,
      failureReason: message
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
