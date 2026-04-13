import { notFound } from "next/navigation";
import { RunDetail } from "../../../components/run-detail";
import { getPublicRunDetailWithPulse } from "../../../lib/public-run-pulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getPublicRunDetailWithPulse(id);

  if (!run) {
    notFound();
  }

  return <RunDetail runId={id} initialData={run} />;
}
