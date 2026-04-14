import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  // Priority: runtime-artifacts (fresh local data) → public/demo-trace.json (Vercel static)
  const paths = [
    join(process.cwd(), "../../runtime-artifacts/demo/latest.json"),
    join(process.cwd(), "../../../runtime-artifacts/demo/latest.json"),
    join(process.cwd(), "runtime-artifacts/demo/latest.json"),
    // Vercel: read from public/ folder (bundled with build)
    join(process.cwd(), "public/demo-trace.json"),
    join(process.cwd(), "apps/web/public/demo-trace.json"),
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
