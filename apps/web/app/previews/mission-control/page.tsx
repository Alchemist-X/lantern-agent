import { MissionControlPreview } from "../../../components/preview-variants";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MissionControlPreviewPage() {
  const data = await getPreviewDashboardData();
  return <MissionControlPreview data={data} />;
}
