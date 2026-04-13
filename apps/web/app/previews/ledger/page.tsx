import { LedgerPreview } from "../../../components/preview-variants";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LedgerPreviewPage() {
  const data = await getPreviewDashboardData();
  return <LedgerPreview data={data} />;
}
