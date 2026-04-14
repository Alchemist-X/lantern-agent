import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  // Try multiple possible paths for the artifacts
  const paths = [
    join(process.cwd(), "../../runtime-artifacts/demo/latest.json"),
    join(process.cwd(), "../../../runtime-artifacts/demo/latest.json"),
    join(process.cwd(), "runtime-artifacts/demo/latest.json"),
  ];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        const data = JSON.parse(raw);
        return NextResponse.json(data);
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json(
    { error: "No demo trace found. Run: pnpm agent:demo" },
    { status: 404 },
  );
}
