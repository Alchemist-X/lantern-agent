import { getPublicRunDetailWithPulse } from "../../../../../lib/public-run-pulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getPublicRunDetailWithPulse(id);
  if (!run) {
    return new Response("Not found", { status: 404 });
  }
  return Response.json(run);
}
