import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildLiveRunContextRows,
  createArchiveDir,
  finalizeArchiveDir,
  maskAddressForDisplay,
  writeJsonArtifact
} from "./live-run-common.ts";

describe("live run common helpers", () => {
  it("builds shared context rows with optional execution identity", () => {
    const rows = buildLiveRunContextRows({
      envFilePath: ".env.pizza",
      archiveDir: "runtime-artifacts/live-test/demo",
      funderAddress: "0x1234567890abcdef1234567890abcdef12345678",
      executionMode: "live",
      decisionStrategy: "pulse-direct",
      runId: "run-1",
      marketSlug: "demo-market",
      tokenId: "demo-token",
      requestedUsd: 1.25
    });

    expect(rows).toEqual([
      ["Env File", ".env.pizza"],
      ["Execution Mode", "live"],
      ["Decision Strategy", "pulse-direct"],
      ["Archive Dir", "runtime-artifacts/live-test/demo"],
      ["Wallet", "0x1234***5678"],
      ["Run ID", "run-1"],
      ["Market", "demo-market"],
      ["Token", "demo-token"],
      ["Requested USD", "$1.25"]
    ]);
    expect(maskAddressForDisplay("0x1234567890")).toBe("0x1234***7890");
  });

  it("writes and finalizes archive directories", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "live-run-common-"));
    try {
      const archiveDir = await createArchiveDir(tempDir, "2026-03-17T080000Z");
      const jsonPath = path.join(archiveDir, "preflight.json");
      await writeJsonArtifact(jsonPath, { ok: true });

      const renamedDir = await finalizeArchiveDir(
        archiveDir,
        "2026-03-17T080000Z",
        "11111111-1111-4111-8111-111111111111"
      );
      const payload = JSON.parse(await readFile(path.join(renamedDir, "preflight.json"), "utf8")) as { ok: boolean };

      expect(renamedDir).toContain("2026-03-17T080000Z-11111111-1111-4111-8111-111111111111");
      expect(payload.ok).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
