import { BalancerResearchPreview } from "../../../components/preview-balancer-variants";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BalancerResearchPreviewPage() {
  const data = await getPreviewDashboardData();
  return <BalancerResearchPreview data={data} />;
}
