import { BalancerCorePreview } from "../../../components/preview-balancer-variants";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BalancerCorePreviewPage() {
  const data = await getPreviewDashboardData();
  return <BalancerCorePreview data={data} />;
}
