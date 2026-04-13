import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const storedArtifactKinds = [
  "pulse-report",
  "review-report",
  "monitor-report",
  "rebalance-report",
  "resolution-report",
  "backtest-report",
  "runtime-log"
] as const;

export type StoredArtifactKind = (typeof storedArtifactKinds)[number];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "artifact";
}

function formatTimestampId(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function reportFolder(kind: StoredArtifactKind): string {
  switch (kind) {
    case "pulse-report":
      return "pulse";
    case "review-report":
      return "review";
    case "monitor-report":
      return "monitor";
    case "rebalance-report":
      return "rebalance";
    case "resolution-report":
      return "resolution";
    case "runtime-log":
      return "runtime-log";
    case "backtest-report":
      return "backtest";
  }
}

export function buildArtifactRelativePath(input: {
  kind: StoredArtifactKind;
  publishedAtUtc: string;
  runtime: string;
  mode: string;
  runId: string;
  extension: "md" | "json";
}): string {
  const date = new Date(input.publishedAtUtc);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const folder = reportFolder(input.kind);
  const runtime = slugify(input.runtime);
  const mode = slugify(input.mode);
  const stem = folder === "backtest" ? "backtest" : folder;
  const filename = `${stem}-${formatTimestampId(input.publishedAtUtc)}-${runtime}-${mode}-${input.runId}.${input.extension}`;
  return path.posix.join("reports", folder, year, month, day, filename);
}

export async function writeStoredArtifact(storageRoot: string, relativePath: string, content: string): Promise<string> {
  const absolutePath = path.resolve(storageRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
  return absolutePath;
}

export function buildEnglishMirrorRelativePath(relativePath: string): string {
  const extension = path.extname(relativePath);
  if (!extension) {
    return `${relativePath}.en`;
  }
  return `${relativePath.slice(0, -extension.length)}.en${extension}`;
}

export async function writeStoredMarkdownPair(input: {
  storageRoot: string;
  relativePath: string;
  zhContent: string;
  enContent: string;
}) {
  const absoluteZhPath = path.resolve(input.storageRoot, input.relativePath);
  const englishRelativePath = buildEnglishMirrorRelativePath(input.relativePath);
  const absoluteEnPath = path.resolve(input.storageRoot, englishRelativePath);
  await mkdir(path.dirname(absoluteZhPath), { recursive: true });
  await Promise.all([
    writeFile(absoluteZhPath, input.zhContent, "utf8"),
    writeFile(absoluteEnPath, input.enContent, "utf8")
  ]);
  return {
    absoluteZhPath,
    absoluteEnPath,
    englishRelativePath
  };
}
