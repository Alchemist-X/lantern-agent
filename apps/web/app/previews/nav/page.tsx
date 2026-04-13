import { PreviewNav } from "../../../components/preview-nav";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NavPreviewPage() {
  const data = await getPreviewDashboardData();
  return <PreviewNav data={data} />;
}
