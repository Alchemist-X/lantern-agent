import { getPublicRuns } from "@lantern/db";
import { LiveRuns } from "../../components/live-runs";

export default async function RunsPage() {
  const runs = await getPublicRuns();
  return (
    <div className="dash-page">
      <LiveRuns initialData={runs} />
    </div>
  );
}

