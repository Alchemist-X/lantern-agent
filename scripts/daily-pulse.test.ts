import { describe, expect, it } from "vitest";
import { buildDailyPulseCommand, parseDailyPulseArgs, shouldStayOpenAfterRun } from "./daily-pulse.ts";

describe("daily pulse script", () => {
  it("defaults to execute mode", () => {
    const parsed = parseDailyPulseArgs(["--json"]);
    const command = buildDailyPulseCommand(parsed);

    expect(parsed.recommendOnly).toBe(false);
    expect(command.args).toEqual(["scripts/pulse-live.ts", "--json"]);
  });

  it("switches to recommend-only mode only when explicitly requested", () => {
    const parsed = parseDailyPulseArgs(["--recommend-only", "--json"]);
    const command = buildDailyPulseCommand(parsed);

    expect(parsed.recommendOnly).toBe(true);
    expect(command.args).toEqual(["scripts/pulse-live.ts", "--recommend-only", "--json"]);
  });

  it("supports disabling the interactive shell explicitly", () => {
    const parsed = parseDailyPulseArgs(["--no-stay-open"]);
    expect(parsed.noStayOpen).toBe(true);
    expect(shouldStayOpenAfterRun(parsed, { stdinIsTTY: true, stdoutIsTTY: true })).toBe(false);
  });

  it("sets pizza as the default env plus live pulse-direct defaults", () => {
    const previousEnvFile = process.env.ENV_FILE;
    const previousExecutionMode = process.env.LANTERN_EXECUTION_MODE;
    const previousStrategy = process.env.AGENT_DECISION_STRATEGY;
    delete process.env.ENV_FILE;
    delete process.env.LANTERN_EXECUTION_MODE;
    delete process.env.AGENT_DECISION_STRATEGY;

    try {
      const command = buildDailyPulseCommand(parseDailyPulseArgs([]));
      expect(command.env.ENV_FILE?.endsWith(".env.pizza")).toBe(true);
      expect(command.env.LANTERN_EXECUTION_MODE).toBe("live");
      expect(command.env.AGENT_DECISION_STRATEGY).toBe("pulse-direct");
    } finally {
      if (previousEnvFile === undefined) {
        delete process.env.ENV_FILE;
      } else {
        process.env.ENV_FILE = previousEnvFile;
      }
      if (previousExecutionMode === undefined) {
        delete process.env.LANTERN_EXECUTION_MODE;
      } else {
        process.env.LANTERN_EXECUTION_MODE = previousExecutionMode;
      }
      if (previousStrategy === undefined) {
        delete process.env.AGENT_DECISION_STRATEGY;
      } else {
        process.env.AGENT_DECISION_STRATEGY = previousStrategy;
      }
    }
  });

  it("stays open by default in interactive terminals", () => {
    const parsed = parseDailyPulseArgs([]);
    expect(shouldStayOpenAfterRun(parsed, { stdinIsTTY: true, stdoutIsTTY: true })).toBe(true);
    expect(shouldStayOpenAfterRun(parsed, { stdinIsTTY: false, stdoutIsTTY: true })).toBe(false);
  });
});
