import path from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { formatUsd } from "@lantern/terminal-ui";
import { buildLiveTestDirectoryName } from "./live-test-helpers.ts";

export interface LiveRunContextRowsInput {
  envFilePath: string | null;
  archiveDir: string;
  funderAddress: string;
  executionMode?: string;
  decisionStrategy?: string;
  runId?: string | null;
  marketSlug?: string;
  tokenId?: string;
  requestedUsd?: number | null;
}

export function formatTimestampToken(now = new Date()) {
  return now.toISOString().replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

export function maskAddressForDisplay(value: string) {
  if (!value) {
    return "-";
  }
  if (value.length <= 10) {
    return `${value.slice(0, 3)}***`;
  }
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

export async function ensureDirectory(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function writeJsonArtifact(filePath: string, value: unknown) {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function createArchiveDir(root: string, timestamp: string) {
  const dirPath = path.join(root, buildLiveTestDirectoryName(timestamp, null));
  await ensureDirectory(dirPath);
  return dirPath;
}

export async function finalizeArchiveDir(currentDir: string, timestamp: string, runId: string) {
  const nextDir = path.join(path.dirname(currentDir), buildLiveTestDirectoryName(timestamp, runId));
  if (nextDir === currentDir) {
    return currentDir;
  }
  await rename(currentDir, nextDir);
  return nextDir;
}

export function buildLiveRunContextRows(input: LiveRunContextRowsInput): Array<[string, string]> {
  const rows: Array<[string, string]> = [["Env File", input.envFilePath ?? "-"]];

  if (input.executionMode) {
    rows.push(["Execution Mode", input.executionMode]);
  }
  if (input.decisionStrategy) {
    rows.push(["Decision Strategy", input.decisionStrategy]);
  }

  rows.push(
    ["Archive Dir", input.archiveDir],
    ["Wallet", maskAddressForDisplay(input.funderAddress)],
    ["Run ID", input.runId ?? "-"],
    ["Market", input.marketSlug ?? "-"],
    ["Token", input.tokenId ?? "-"],
    ["Requested USD", input.requestedUsd == null ? "-" : formatUsd(input.requestedUsd)]
  );

  return rows;
}
