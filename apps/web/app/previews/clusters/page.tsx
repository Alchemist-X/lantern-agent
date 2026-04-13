import { PreviewMarketClusters } from "../../../components/preview-market-clusters";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClustersPreviewPage() {
  const data = await getPreviewDashboardData();
  return <PreviewMarketClusters data={data} />;
}
